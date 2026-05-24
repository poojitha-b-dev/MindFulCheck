import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import {
  Smile,
  Frown,
  Meh,
  Moon,
  Sun,
  CloudRain,
  Zap,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  Target,
  Activity,
  Lightbulb
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { moodAnalysisService, MoodEntry, MoodPrediction, MoodPattern } from '../services/moodAnalysisService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import RecordTodayModal from './RecordTodayModal';
interface ChartDataPoint {
  date: string;
  dateKey: string; // YYYY-MM-DD — used for 30-day skeleton merge
  fullDate: Date;
  mood: number | null;
  energy: number | null;
  sleep: number | null;
  anxiety: number | null;
  socialInteraction: number | null;
  exercise: number | null;
  workStress: number | null;
}

// ─── Module-level cache ───────────────────────────────────────────────────────
let _uid: string | null = null;
let _firestoreUnsub: (() => void) | null = null;
export let _cachedEntries: ChartDataPoint[] = [];
export let _cachedTodayLogged = false;
// Date the cache was last built — used to detect a new calendar day
let _cachedDate: string = format(new Date(), 'yyyy-MM-dd');

/** Call at the top of subscribeMoodCache to wipe stale cross-midnight data */
function _invalidateMoodCacheIfNewDay(): void {
  const today = format(new Date(), 'yyyy-MM-dd');
  if (_cachedDate !== today) {
    _cachedDate = today;
    _cachedTodayLogged = false;
    _cachedEntries = [];
    if (_firestoreUnsub) { _firestoreUnsub(); _firestoreUnsub = null; }
    _uid = null;
  }
}
let _componentCallbacks: Array<(entries: ChartDataPoint[], todayLogged: boolean) => void> = [];

/** Builds a 30-day skeleton (today going back 29 days) and merges Firebase docs into it.
 *  Days with no entry get null for all metric fields. */
function buildChartTimeline(
  firestoreDocs: { id: string; data: Record<string, any>; timestamp: Date }[]
): { entries: ChartDataPoint[]; todayLogged: boolean } {
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  let todayLogged = false;

  if (firestoreDocs.length === 0) {
    return { entries: [], todayLogged: false };
  }

  // Sort by date ascending
  const sorted = [...firestoreDocs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Limit to last 30 entries if more than 30
  const limited = sorted.slice(-30);

  // Build sequence — one entry per logged day, no empty padding
  const entries: ChartDataPoint[] = limited.map(doc => {
    if (doc.id === todayKey) todayLogged = true;
    return {
      dateKey: doc.id,
      date: format(doc.timestamp, 'MMM dd'),
      fullDate: doc.timestamp,
      mood: doc.data.mood ?? null,
      energy: doc.data.energy ?? null,
      sleep: doc.data.sleep ?? null,
      anxiety: doc.data.anxiety ?? null,
      socialInteraction: doc.data.socialInteraction ?? null,
      exercise: doc.data.exercise ?? null,
      workStress: doc.data.workStress ?? null,
    };
  });

  // If fewer than 3 real entries, pad with invisible ghost points so chart
  // doesn't look broken with a lone dot floating in the center
  if (entries.length === 1) {
    const ghost: ChartDataPoint = {
      dateKey: '', date: '', fullDate: new Date(),
      mood: null, energy: null, sleep: null,
      anxiety: null, socialInteraction: null,
      exercise: null, workStress: null,
    };
    return { entries: [ghost, entries[0], ghost], todayLogged };
  }

  return { entries, todayLogged };
}

function subscribeMoodCache(
  uid: string,
  onUpdate: (entries: ChartDataPoint[], todayLogged: boolean) => void
): () => void {
  // Wipe stale data if it's a new calendar day
  _invalidateMoodCacheIfNewDay();

  if (_uid === uid && _firestoreUnsub) {
    _componentCallbacks.push(onUpdate);
    onUpdate(_cachedEntries, _cachedTodayLogged);
    return () => {
      _componentCallbacks = _componentCallbacks.filter(cb => cb !== onUpdate);
    };
  }

  if (_firestoreUnsub) { _firestoreUnsub(); _firestoreUnsub = null; }
  _uid = uid;
  _cachedEntries = [];
  _cachedTodayLogged = false;
  _componentCallbacks = [onUpdate];

  const moodsRef = collection(db, 'users', uid, 'moods');
  // Fetch all docs; 30-day retention is handled by RecordTodayModal on write.
  // We sort ascending so older docs come first (limit not applied here so we
  // always get the full stored set and let build30DayTimeline pick the right window).
  const q = query(moodsRef, orderBy('timestamp', 'asc'));

  _firestoreUnsub = onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const timestamp =
        data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(data.timestamp);
      return { id: docSnap.id, data, timestamp };
    });

    const { entries, todayLogged } = buildChartTimeline(docs);
    _cachedEntries = entries;
    _cachedTodayLogged = todayLogged;
    _componentCallbacks.forEach(cb => cb(entries, todayLogged));
  }, (error) => {
    console.error('Mood snapshot error:', error);
    _componentCallbacks.forEach(cb => cb([], false));
  });

  return () => {
    _componentCallbacks = _componentCallbacks.filter(cb => cb !== onUpdate);
  };
}
// ─────────────────────────────────────────────────────────────────────────────
const renderDot = (color: string) => (props: any) => {
  const { cx, cy, value } = props;
  if (value === null || value === undefined || cx === undefined || cy === undefined) return null;
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} fillOpacity={0.9} />;
};

const MoodTrackerPage: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [openModal, setOpenModal] = useState(false);
  const [moodData, setMoodData] = useState<ChartDataPoint[]>(_cachedEntries);
  const [moodPrediction, setMoodPrediction] = useState<MoodPrediction | null>(null);
  const [moodPatterns, setMoodPatterns] = useState<MoodPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayAlreadyLogged, setTodayAlreadyLogged] = useState(_cachedTodayLogged);

  // Auto-open form if navigated from Dashboard with openForm flag
  useEffect(() => {
    if (location.state && (location.state as any).openForm) {
      setOpenModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (currentUser === undefined) return; // still initializing
    if (!currentUser) {
      setIsLoading(false); // logged out
      return;
    }

    const unregister = subscribeMoodCache(currentUser.uid, (entries, todayLogged) => {
      setMoodData(entries);
      setTodayAlreadyLogged(todayLogged);
      setIsLoading(false);
      if (entries.length > 0) runMoodAnalysis(entries);
    });

    return unregister;
  }, [currentUser]);

  // ── Midnight auto-reset ────────────────────────────────────────────────────
  // When the clock crosses midnight the "Logged Today" state must reset so the
  // user can record a new entry for the new day without refreshing the page.
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    };

    let timerId: ReturnType<typeof setTimeout>;

    const scheduleMidnightReset = () => {
      timerId = setTimeout(() => {
        // Invalidate the module-level cache
        _invalidateMoodCacheIfNewDay();
        // Reset component state for the new day
        setTodayAlreadyLogged(false);
        setMoodData([]);
        setIsLoading(true);
        // Re-subscribe to Firestore with a fresh cache
        if (currentUser) {
          subscribeMoodCache(currentUser.uid, (entries, todayLogged) => {
            setMoodData(entries);
            setTodayAlreadyLogged(todayLogged);
            setIsLoading(false);
            if (entries.length > 0) runMoodAnalysis(entries);
          });
        }
        scheduleMidnightReset();
      }, msUntilMidnight());
    };

    scheduleMidnightReset();
    return () => clearTimeout(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const runMoodAnalysis = async (entries: ChartDataPoint[]) => {
    setIsAnalyzing(true);
    try {
      await moodAnalysisService.initialize();

      entries
        .filter(entry => entry.mood !== null)
        .forEach(entry => {
          moodAnalysisService.addMoodEntry({
            date: entry.fullDate,
            mood: entry.mood as number,
            energy: entry.energy as number,
            sleep: entry.sleep as number,
            anxiety: entry.anxiety as number,
            socialInteraction: entry.socialInteraction as number,
            exercise: entry.exercise as number,
            workStress: entry.workStress as number,
          });
        });

      const patterns = moodAnalysisService.identifyMoodPatterns();
      setMoodPatterns(patterns);

      const nonNullEntries = entries.filter(e => e.mood !== null);
      if (nonNullEntries.length === 0) return;
      const latestEntry = nonNullEntries[nonNullEntries.length - 1];

      const prediction = await moodAnalysisService.predictMood({
        previousMood: latestEntry.mood,
        sleep: latestEntry.sleep,
        energy: latestEntry.energy,
        anxiety: latestEntry.anxiety,
        socialInteraction: latestEntry.socialInteraction,
        exercise: latestEntry.exercise
      });
      setMoodPrediction(prediction);
    } catch (error) {
      console.error('Error running mood analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={20} /> },
    { id: 'mood', label: 'Mood', icon: <Smile size={20} /> },
    { id: 'sleep', label: 'Sleep', icon: <Moon size={20} /> },
    { id: 'energy', label: 'Energy', icon: <Zap size={20} /> },
    { id: 'anxiety', label: 'Anxiety', icon: <CloudRain size={20} /> },
    { id: 'insights', label: 'AI Insights', icon: <Brain size={20} /> },
  ];

  const getMoodIcon = (value: number) => {
    if (value >= 8) return <Smile className="text-secondary-500" />;
    if (value >= 5) return <Meh className="text-warning-500" />;
    return <Frown className="text-error-500" />;
  };

  const getInsightColor = (impact: number) => {
    if (impact > 0.5) return 'text-green-600 bg-green-50';
    if (impact < -0.5) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const hasData = moodData.length > 0;
  const realEntryCount = moodData.filter(d => d.mood !== null).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Mood Tracker</h1>
          <p className="text-gray-600">
            Track your mood with machine learning insights and personalized recommendations
          </p>
        </div>

        {/* Record Today button — changes to green "Logged Today" after save */}
        {todayAlreadyLogged ? (
          <button
            className="mt-4 sm:mt-0 btn-primary flex items-center bg-green-500 hover:bg-green-600 border-green-500 cursor-default"
            disabled
          >
            ✓ Logged Today
          </button>
        ) : (
          <button
            className="mt-4 sm:mt-0 btn-primary flex items-center"
            onClick={() => setOpenModal(true)}
          >
            <Plus size={18} className="mr-1" /> Record Today
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading your data...</span>
        </div>
      ) : (
        <>
          {/* AI Insights Summary */}
          {moodPrediction && hasData && (
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8 border border-primary-100">
              <div className="flex items-center mb-4">
                <Brain size={24} className="text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold">AI Mood Prediction</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Tomorrow's Predicted Mood</h3>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {moodPrediction.predictedMood.toFixed(1)}/10
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({Math.round(moodPrediction.confidence * 100)}% confidence)
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Key Factors</h3>
                  <div className="space-y-1">
                    {moodPrediction.factors.slice(0, 2).map((factor, index) => (
                      <div key={index} className={`text-xs px-2 py-1 rounded ${getInsightColor(factor.impact)}`}>
                        {factor.factor}: {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Top Recommendation</h3>
                  <p className="text-sm text-gray-600">
                    {moodPrediction.recommendations[0] || "Keep up your current routine!"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-soft mb-8">
            <div className="flex overflow-x-auto border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Comprehensive Overview</h2>
                  {!hasData ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Calendar size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">No data yet</p>
                      <p className="text-sm mt-1">Start by recording today's mood to see your trends here.</p>
                    </div>
                  ) : realEntryCount < 3 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <TrendingUp size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {realEntryCount === 1
                          ? 'Great start! 1 entry logged.'
                          : `${realEntryCount} entries logged.`}
                      </p>
                      <p className="text-sm mt-1">Log at least 3 days to see your trend graph.</p>
                      <div className="flex gap-2 mt-4">
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${i <= realEntryCount
                              ? 'bg-primary-500'
                              : 'bg-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={moodData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#50C878" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#50C878" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#B19CD9" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#B19CD9" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            tick={{ fontSize: 11 }}
                            interval={Math.max(0, Math.floor(moodData.length / 6) - 1)}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            domain={[0, 10]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11 }}
                            width={25}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                            formatter={(value: any) => value === null ? 'No data' : value}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                          <Area
                            type="monotone"
                            dataKey="mood"
                            name="Mood"
                            stroke="#4A90E2"
                            strokeWidth={2.5}
                            fill="url(#moodGrad)"
                            dot={renderDot('#4A90E2')}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="energy"
                            name="Energy"
                            stroke="#50C878"
                            strokeWidth={2.5}
                            fill="url(#energyGrad)"
                            dot={renderDot('#50C878')}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="sleep"
                            name="Sleep"
                            stroke="#B19CD9"
                            strokeWidth={2.5}
                            fill="url(#sleepGrad)"
                            dot={renderDot('#B19CD9')}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">AI-Generated Insights</h2>
                    {isAnalyzing && (
                      <div className="flex items-center text-primary-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                        Analyzing patterns...
                      </div>
                    )}
                  </div>

                  {!hasData ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Brain size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">No insights yet</p>
                      <p className="text-sm mt-1">Log your first entry to see AI-generated insights.</p>
                    </div>
                  ) : (
                    <>
                      {/* Mood Patterns */}
                      {moodPatterns.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="font-semibold mb-4 flex items-center">
                            <Target size={20} className="text-primary-600 mr-2" />
                            Identified Patterns
                          </h3>
                          <div className="space-y-4">
                            {moodPatterns.map((pattern, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <h4 className="font-medium text-gray-800 mb-2">{pattern.pattern}</h4>
                                <p className="text-gray-600 text-sm mb-3">{pattern.description}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {pattern.triggers.map((trigger, i) => (
                                    <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                                      {trigger}
                                    </span>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-700">Suggestions:</p>
                                  {pattern.suggestions.map((suggestion, i) => (
                                    <p key={i} className="text-xs text-gray-600">• {suggestion}</p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Factor Analysis */}
                      {moodPrediction && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="font-semibold mb-4 flex items-center">
                            <Activity size={20} className="text-primary-600 mr-2" />
                            Factor Impact Analysis
                          </h3>
                          <div className="space-y-3">
                            {moodPrediction.factors.map((factor, index) => (
                              <div key={index} className="bg-white rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{factor.factor}</span>
                                  <span className={`text-sm font-medium ${factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{factor.description}</p>
                                <div className="mt-2 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${factor.impact > 0 ? 'bg-green-500' : 'bg-red-500'
                                      }`}
                                    style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {moodPrediction && moodPrediction.recommendations.length > 0 && (
                        <div className="bg-gradient-to-r from-secondary-50 to-accent-50 rounded-lg p-6">
                          <h3 className="font-semibold mb-4 flex items-center">
                            <Lightbulb size={20} className="text-secondary-600 mr-2" />
                            Personalized Recommendations
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {moodPrediction.recommendations.map((rec, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-700">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Other tab content */}
              {activeTab !== 'overview' && activeTab !== 'insights' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      {tabs.find(tab => tab.id === activeTab)?.label} History
                    </h2>
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        <ChevronLeft size={18} />
                      </button>
                      <button className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {!hasData ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Calendar size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">No data yet</p>
                      <p className="text-sm mt-1">Record your first mood entry to see your history.</p>
                    </div>
                  ) : realEntryCount < 3 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <TrendingUp size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium">Keep going!</p>
                      <p className="text-sm mt-1">Log at least 3 days to see your history graph.</p>
                      <div className="flex gap-2 mt-4">
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${i <= realEntryCount
                              ? 'bg-primary-500'
                              : 'bg-gray-200'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={moodData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            tick={{ fontSize: 11 }}
                            interval={Math.max(0, Math.floor(moodData.length / 6) - 1)}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            domain={[0, 10]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11 }}
                            width={25}
                          />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                          {activeTab === 'mood' && (
                            <Line type="monotone" dataKey="mood" name="Mood"
                              stroke="#4A90E2" strokeWidth={3}
                              dot={renderDot('#4A90E2')}
                              activeDot={{ r: 8 }} />
                          )}
                          {activeTab === 'sleep' && (
                            <Line type="monotone" dataKey="sleep" name="Sleep Quality"
                              stroke="#B19CD9" strokeWidth={3}
                              dot={renderDot('#B19CD9')}
                              activeDot={{ r: 8 }} />
                          )}
                          {activeTab === 'energy' && (
                            <Line type="monotone" dataKey="energy" name="Energy Level"
                              stroke="#50C878" strokeWidth={3}
                              dot={renderDot('#50C878')}
                              activeDot={{ r: 8 }} />
                          )}
                          {activeTab === 'anxiety' && (
                            <Line type="monotone" dataKey="anxiety" name="Anxiety Level"
                              stroke="#F59E0B" strokeWidth={3}
                              dot={renderDot('#F59E0B')}
                              activeDot={{ r: 8 }} />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal — rendered via RecordTodayModal */}
      {openModal && (
        <RecordTodayModal
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            setTodayAlreadyLogged(true);
            _cachedTodayLogged = true;
            setOpenModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MoodTrackerPage;

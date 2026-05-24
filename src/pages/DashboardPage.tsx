import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  LineChart,
  ClipboardCheck,
  Calendar,
  Moon,
  Sun,
  ArrowRight,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, where, limit } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import RecordTodayModal from './RecordTodayModal';

interface MoodDataPoint {
  day: string;
  mood: number;
  sleep: number;
}

interface AssessmentScore {
  score: number;
  severity: string;
  timestamp: Date;
}

interface AssessmentHistoryPoint {
  month: string;
  depression: number | null;
  anxiety: number | null;
}

interface DashboardStats {
  currentMood: string;
  currentMoodValue: number;
  avgSleep: number;
  moodTrendText: string;
  chartData: MoodDataPoint[];
}

const getMoodLabel = (value: number): string => {
  if (value >= 8) return 'Great';
  if (value >= 6) return 'Good';
  if (value >= 4) return 'Okay';
  return 'Low';
};

// ─── Module-level cache: survives React unmount/remount across navigation ─────
// State stored here is preserved when user navigates away and back, so the
// Dashboard never re-fetches or shows a spinner on return visits.
let _dashUid: string | null = null;
let _dashUnsubs: Array<() => void> = [];
let _dashStats: DashboardStats | null = null;
let _dashPhq9: AssessmentScore | null = null;
let _dashGad7: AssessmentScore | null = null;
let _dashAssessmentHistory: AssessmentHistoryPoint[] = [];
let _dashCallbacks: Array<() => void> = [];

// ── Midnight-reset helpers ────────────────────────────────────────────────────
// Cache is keyed by calendar date (YYYY-MM-DD). If the stored date differs from
// today we wipe all cached data and tear down listeners so the next mount starts
// fresh — ensuring the "Record Today" state and dashboard stats always reflect
// the correct calendar day.
const _getTodayKey = () => format(new Date(), 'yyyy-MM-dd');
let _dashCacheDate: string = _getTodayKey();

function _invalidateCacheIfNewDay(): void {
  const today = _getTodayKey();
  if (_dashCacheDate !== today) {
    _dashCacheDate = today;
    _dashStats = null;
    _dashPhq9 = null;
    _dashGad7 = null;
    _dashAssessmentHistory = [];
    _dashUnsubs.forEach(u => u());
    _dashUnsubs = [];
    _dashUid = null;
  }
}

function notify() {
  _dashCallbacks.forEach(cb => cb());
}

function subscribeDashCache(uid: string, onChange: () => void): () => void {
  // Check if it's a new calendar day and wipe stale cache first
  _invalidateCacheIfNewDay();

  // Same user already wired up — just register this component's update callback
  if (_dashUid === uid && _dashUnsubs.length > 0) {
    _dashCallbacks.push(onChange);
    return () => {
      _dashCallbacks = _dashCallbacks.filter(cb => cb !== onChange);
    };
  }

  // New user or first run — reset and create fresh listeners
  _dashUnsubs.forEach(u => u());
  _dashUnsubs = [];
  _dashUid = uid;
  _dashStats = null;
  _dashPhq9 = null;
  _dashGad7 = null;
  _dashAssessmentHistory = [];
  _dashCallbacks = [onChange];

  // ── Mood data ──────────────────────────────────────────────────────────────
  const moodsRef = collection(db, 'users', uid, 'moods');
  const moodsQ = query(moodsRef, orderBy('timestamp', 'desc'), limit(30));

  const moodUnsub = onSnapshot(moodsQ, (snapshot) => {
    if (!snapshot.empty) {
      const allEntries: { date: Date; mood: number; sleep: number }[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const entryDate = data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(data.timestamp);
        allEntries.push({ date: entryDate, mood: data.mood, sleep: data.sleep });
      });

      // Query returns newest-first (desc); reverse so chart data is chronological
      allEntries.reverse();

      const recent7 = allEntries.slice(-7);
      const latest = allEntries[allEntries.length - 1];
      const avgSleep = recent7.reduce((sum, e) => sum + e.sleep, 0) / recent7.length;

      let moodTrendText = 'Tracking your progress';
      if (allEntries.length >= 8) {
        const prev7 = allEntries.slice(-14, -7);
        const recentAvg = recent7.reduce((s, e) => s + e.mood, 0) / recent7.length;
        const prevAvg = prev7.reduce((s, e) => s + e.mood, 0) / prev7.length;
        const diff = recentAvg - prevAvg;
        if (diff > 0.5) {
          moodTrendText = `${Math.round(Math.abs(diff / prevAvg) * 100)}% better than last week`;
        } else if (diff < -0.5) {
          moodTrendText = `${Math.round(Math.abs(diff / prevAvg) * 100)}% lower than last week`;
        } else {
          moodTrendText = 'Stable compared to last week';
        }
      }

      _dashStats = {
        currentMood: getMoodLabel(latest.mood),
        currentMoodValue: latest.mood,
        avgSleep: Math.round(avgSleep * 10) / 10,
        moodTrendText,
        chartData: recent7.map(e => ({
          day: format(e.date, 'EEE'),
          mood: e.mood,
          sleep: e.sleep,
        })),
      };
    }
    notify();
  }, (error) => {
    console.error('Dashboard mood snapshot error:', error);
    notify();
  });
  _dashUnsubs.push(moodUnsub);

  // ── PHQ-9 (latest) ─────────────────────────────────────────────────────────
  const assessmentsRef = collection(db, 'users', uid, 'assessments');

  // ── All assessments — single listener, no composite index needed ───────────
  const allAssessmentsQ = query(assessmentsRef, orderBy('timestamp', 'asc'));
  const assessmentUnsub = onSnapshot(allAssessmentsQ, (snap) => {
    let latestPhq9: AssessmentScore | null = null;
    let latestGad7: AssessmentScore | null = null;
    const monthMap = new Map<string, { depression: number | null; anxiety: number | null }>();

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const ts = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);

      if (d.type === 'PHQ-9') {
        // Last one wins since sorted asc = latest is last
        latestPhq9 = { score: d.score, severity: d.severity, timestamp: ts };
      }
      if (d.type === 'GAD-7') {
        latestGad7 = { score: d.score, severity: d.severity, timestamp: ts };
      }

      // Build history graph grouped by month
      const monthKey = format(ts, 'MMM yy');
      const existing = monthMap.get(monthKey) || { depression: null, anxiety: null };
      if (d.type === 'PHQ-9') existing.depression = d.score;
      if (d.type === 'GAD-7') existing.anxiety = d.score;
      monthMap.set(monthKey, existing);
    });

    _dashPhq9 = latestPhq9;
    _dashGad7 = latestGad7;
    _dashAssessmentHistory = Array.from(monthMap.entries()).map(([month, scores]) => ({
      month,
      ...scores,
    }));
    notify();
  }, (error) => console.error('Assessment snapshot error:', error));
  _dashUnsubs.push(assessmentUnsub);

  // Returning only removes this component's callback
  return () => {
    _dashCallbacks = _dashCallbacks.filter(cb => cb !== onChange);
  };
}
// ─────────────────────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Render with whatever the cache already has — no blank flash on re-navigation
  const [stats, setStats] = useState<DashboardStats | null>(_dashStats);
  const [phq9, setPhq9] = useState<AssessmentScore | null>(_dashPhq9);
  const [gad7, setGad7] = useState<AssessmentScore | null>(_dashGad7);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryPoint[]>(_dashAssessmentHistory);
  // Only show loading spinner on the very first visit when cache is empty
  const [isLoading, setIsLoading] = useState(
    _dashStats === null && _dashUid !== currentUser?.uid
  );
  const [openRecordModal, setOpenRecordModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unregister = subscribeDashCache(currentUser.uid, () => {
      setStats(_dashStats);
      setPhq9(_dashPhq9);
      setGad7(_dashGad7);
      setAssessmentHistory(_dashAssessmentHistory);
      setIsLoading(false);
    });

    if (_dashUid === currentUser.uid) {
      setStats(_dashStats);
      setPhq9(_dashPhq9);
      setGad7(_dashGad7);
      setAssessmentHistory(_dashAssessmentHistory);
      setIsLoading(false);
    }

    return unregister;
  }, [currentUser]);

  // ── Midnight auto-reset ────────────────────────────────────────────────────
  // Schedule a one-shot timer that fires exactly at the next midnight.
  // When it fires we invalidate the cache and trigger a re-subscribe so
  // the dashboard immediately shows a clean slate for the new day.
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // next midnight
      return midnight.getTime() - now.getTime();
    };

    let timerId: ReturnType<typeof setTimeout>;

    const scheduleMidnightReset = () => {
      timerId = setTimeout(() => {
        _invalidateCacheIfNewDay();
        // Force a re-subscribe by resetting component state
        setStats(null);
        setPhq9(null);
        setGad7(null);
        setAssessmentHistory([]);
        setIsLoading(true);
        // Re-wire the cache for the new day
        if (currentUser) {
          subscribeDashCache(currentUser.uid, () => {
            setStats(_dashStats);
            setPhq9(_dashPhq9);
            setGad7(_dashGad7);
            setAssessmentHistory(_dashAssessmentHistory);
            setIsLoading(false);
          });
        }
        // Schedule the NEXT midnight reset
        scheduleMidnightReset();
      }, msUntilMidnight());
    };

    scheduleMidnightReset();
    return () => clearTimeout(timerId);
  }, [currentUser]);

  const handleRecordToday = () => {
    setOpenRecordModal(true);
  };
  const handleGoToTracker = () => {
    navigate('/mood-tracker');
  };

  // Dynamic "last assessment" label — uses the most recent of PHQ-9 / GAD-7 timestamps
  const lastAssessmentTs = (() => {
    const dates = [phq9?.timestamp, gad7?.timestamp].filter(Boolean) as Date[];
    return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
  })();

  const lastAssessmentLabel = lastAssessmentTs
    ? `Last assessment: ${formatDistanceToNow(lastAssessmentTs, { addSuffix: true })}`
    : 'Last assessment: none yet';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {currentUser?.displayName || 'User'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <span className="text-gray-600 text-sm">{lastAssessmentLabel}</span>
          <Link to="/assessment" className="btn-primary">
            Take Assessment
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading your data...</span>
        </div>
      ) : !stats ? (
        <>
          {/* Empty state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Current Mood</p>
                  <h3 className="text-2xl font-bold text-gray-300">—</h3>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-400">No mood data yet</span>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Sleep Quality</p>
                  <h3 className="text-2xl font-bold text-gray-300">—</h3>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-400">No mood data yet</span>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Depression Score</p>
                  <h3 className="text-2xl font-bold">
                    {phq9 ? phq9.score : <span className="text-gray-300">—</span>}
                    <span className="text-sm font-normal text-gray-500"> / 27</span>
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-secondary-100 text-secondary-600">
                  <ClipboardCheck size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  {phq9 ? `${phq9.severity} • PHQ-9` : 'Take an assessment'}
                </span>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Anxiety Score</p>
                  <h3 className="text-2xl font-bold">
                    {gad7 ? gad7.score : <span className="text-gray-300">—</span>}
                    <span className="text-sm font-normal text-gray-500"> / 21</span>
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-warning-100 text-warning-500">
                  <BarChart2 size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  {gad7 ? `${gad7.severity} • GAD-7` : 'Take an assessment'}
                </span>
              </div>
            </div>
          </div>

          {(phq9 || gad7) && (
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Assessment History</h2>
                <Link to="/assessment" className="text-primary-600 text-sm font-medium flex items-center">
                  Take New Assessment <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {phq9 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">PHQ-9 · Depression</p>
                    <p className="text-3xl font-bold">{phq9.score} <span className="text-base font-normal text-gray-400">/ 27</span></p>
                    <p className="text-sm font-medium text-secondary-600 mt-1">{phq9.severity}</p>
                  </div>
                )}
                {gad7 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">GAD-7 · Anxiety</p>
                    <p className="text-3xl font-bold">{gad7.score} <span className="text-base font-normal text-gray-400">/ 21</span></p>
                    <p className="text-sm font-medium text-warning-500 mt-1">{gad7.severity}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card mb-8 flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-500">No mood data recorded yet</p>
            <p className="text-sm mt-1 mb-6">Start tracking your mood to see your dashboard come to life.</p>
            <button onClick={() => setOpenRecordModal(true)} className="btn-primary">
              Record Your Mood
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Current Mood</p>
                  <h3 className="text-2xl font-bold">{stats.currentMood}</h3>
                </div>
                <div className="p-2 rounded-full bg-primary-100 text-primary-600">
                  <Sun size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <TrendingUp size={16} className="text-secondary-500 mr-1" />
                  <span className="text-sm text-gray-600">{stats.moodTrendText}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Sleep Quality</p>
                  <h3 className="text-2xl font-bold">{stats.avgSleep}/10</h3>
                </div>
                <div className="p-2 rounded-full bg-accent-100 text-accent-600">
                  <Moon size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Avg over last 7 days</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Depression Score</p>
                  <h3 className="text-2xl font-bold">
                    {phq9 ? phq9.score : '—'}
                    <span className="text-sm font-normal text-gray-500"> / 27</span>
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-secondary-100 text-secondary-600">
                  <ClipboardCheck size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Target size={16} className="text-secondary-500 mr-1" />
                  <span className="text-sm text-gray-600">
                    {phq9 ? `${phq9.severity} • PHQ-9` : 'Take an assessment'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 mb-1">Anxiety Score</p>
                  <h3 className="text-2xl font-bold">
                    {gad7 ? gad7.score : '—'}
                    <span className="text-sm font-normal text-gray-500"> / 21</span>
                  </h3>
                </div>
                <div className="p-2 rounded-full bg-warning-100 text-warning-500">
                  <BarChart2 size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Target size={16} className="text-warning-500 mr-1" />
                  <span className="text-sm text-gray-600">
                    {gad7 ? `${gad7.severity} • GAD-7` : 'Take an assessment'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mood and Sleep Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Mood Trends</h2>
                <Link to="/mood-tracker" className="text-primary-600 text-sm font-medium flex items-center">
                  View Details <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={stats.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#9CA3AF"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
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
                    <Line
                      type="monotone"
                      dataKey="mood"
                      name="Mood"
                      stroke="#4A90E2"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#4A90E2', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Award size={20} className="text-primary-500 mr-2" />
                  <span className="text-gray-700">{stats.moodTrendText}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Sleep Quality</h2>
                <Link to="/mood-tracker" className="text-primary-600 text-sm font-medium flex items-center">
                  View Details <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#9CA3AF"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
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
                    <Bar
                      dataKey="sleep"
                      name="Sleep Quality"
                      fill="#B19CD9"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Moon size={20} className="text-accent-500 mr-2" />
                  <span className="text-gray-700">Your average sleep quality is {stats.avgSleep}/10 this week.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment History */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Assessment History</h2>
              <Link to="/assessment" className="text-primary-600 text-sm font-medium flex items-center">
                Take New Assessment <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            {assessmentHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ClipboardCheck size={40} className="mb-3 opacity-50" />
                <p className="text-sm">No assessment data yet. Take an assessment to see your history.</p>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={assessmentHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      width={25}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="depression"
                      name="Depression Score"
                      stroke="#4A90E2"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#4A90E2', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="anxiety"
                      name="Anxiety Score"
                      stroke="#B19CD9"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#B19CD9', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                      connectNulls={true}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center">
                <TrendingUp size={20} className="text-secondary-500 mr-2" />
                <span className="text-gray-700">Complete assessments regularly to track your mental health trends.</span>
              </div>
            </div>
          </div>

          
        </>
      )}

      {openRecordModal && (
        <RecordTodayModal
          onClose={() => setOpenRecordModal(false)}
          onSaved={() => setOpenRecordModal(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;

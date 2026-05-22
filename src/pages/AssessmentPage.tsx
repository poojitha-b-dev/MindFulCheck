// AssessmentPage.tsx
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAgeSpecificQuestions,
  interpretDepressionResult,
  interpretAnxietyResult,
  AssessmentType,
  AgeGroup,
  AssessmentQuestion,
  AssessmentResult,
} from '../models/assessmentTypes';
import {
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTherapyIcon = (type: string) => {
  const map: Record<string, string> = {
    music: '🎵', breathing: '🫁', yoga: '🧘‍♂️', journaling: '📓',
    meditation: '🧘‍♀️', exercise: '🏃‍♂️', story: '📖', mindfulness: '🧠',
    therapy: '💬', crisis: '🆘', support: '🤝', social: '👥',
    lifestyle: '🌱', safety: '🛡️',
  };
  return map[type] ?? '💡';
};

// ─── Slide animation variants ────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 380, damping: 35 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

// ─── Setup Screen ────────────────────────────────────────────────────────────

interface SetupScreenProps {
  assessmentType: AssessmentType;
  ageGroup: AgeGroup;
  onTypeChange: (v: AssessmentType) => void;
  onAgeChange: (v: AgeGroup) => void;
  onStart: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  assessmentType, ageGroup, onTypeChange, onAgeChange, onStart,
}) => (
  <motion.div
    key="setup"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -24 }}
    transition={{ duration: 0.35 }}
    className="flex flex-col items-center justify-center min-h-[70vh] px-4"
  >
    {/* Icon badge */}
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
      <Brain size={36} className="text-white" />
    </div>

    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-3 tracking-tight">
      Mental Health Assessment
    </h1>
    <p className="text-slate-500 text-center max-w-md mb-10 leading-relaxed">
      Answer a few short questions to receive personalized AI-powered insights
      about your mental wellbeing.
    </p>

    <div className="w-full max-w-sm space-y-4 mb-10">
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Assessment type
        </label>
        <select
          value={assessmentType}
          onChange={(e) => onTypeChange(e.target.value as AssessmentType)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition shadow-sm"
        >
          <option value="depression">Depression Screening (PHQ-9 Style)</option>
          <option value="anxiety">Anxiety Assessment (GAD-7 Style)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-1.5">
          Age group
        </label>
        <select
          value={ageGroup}
          onChange={(e) => onAgeChange(e.target.value as AgeGroup)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition shadow-sm"
        >
          <option value="child">Child (5–12 years)</option>
          <option value="teen">Teen (13–17 years)</option>
          <option value="adult">Adult (18–64 years)</option>
          <option value="senior">Senior (65+ years)</option>
        </select>
      </div>
    </div>

    <motion.button
      onClick={onStart}
      className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:from-violet-700 hover:to-indigo-700 transition-all"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      Begin Assessment
      <ArrowRight size={20} />
    </motion.button>

    <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
      This assessment is not a diagnostic tool. Please consult a mental health
      professional for clinical evaluation.
    </p>
  </motion.div>
);

// ─── Completion Screen ───────────────────────────────────────────────────────

interface CompletionScreenProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  totalAnswered: number;
  total: number;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  onAnalyze, isAnalyzing, totalAnswered, total,
}) => (
  <motion.div
    key="completion"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
    className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
      className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-8 shadow-xl shadow-emerald-200"
    >
      <CheckCircle size={44} className="text-white" />
    </motion.div>

    <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
      All done!
    </h2>
    <p className="text-slate-500 mb-2 text-lg">
      You answered all {total} questions.
    </p>
    <p className="text-slate-400 mb-10 max-w-sm text-sm leading-relaxed">
      Ready to see your personalized insights? Our AI will analyze your
      responses and generate tailored recommendations.
    </p>

    <motion.button
      onClick={onAnalyze}
      disabled={isAnalyzing}
      className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 disabled:opacity-60 transition-all hover:shadow-indigo-300 hover:from-violet-700 hover:to-indigo-700"
      whileHover={{ scale: isAnalyzing ? 1 : 1.03 }}
      whileTap={{ scale: isAnalyzing ? 1 : 0.97 }}
    >
      <Brain size={22} />
      {isAnalyzing ? 'Analyzing…' : 'Analyze with AI'}
    </motion.button>
  </motion.div>
);

// ─── Analyzing Screen ─────────────────────────────────────────────────────────

const AnalyzingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
    <motion.div
      className="w-20 h-20 mb-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200"
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      <Brain size={36} className="text-white" />
    </motion.div>

    <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
      Analyzing your responses
    </h2>
    <p className="text-slate-500 mb-10 text-center max-w-sm">
      Our AI is processing your assessment and crafting personalized insights…
    </p>

    <div className="space-y-3 w-full max-w-xs">
      {[
        'Analyzing response patterns',
        'Generating personalized insights',
        'Creating recommendations',
      ].map((label, i) => (
        <motion.div
          key={label}
          className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-600"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.25 }}
        >
          <span
            className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
          {label}
        </motion.div>
      ))}
    </div>
  </div>
);

// ─── Question Card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: AssessmentQuestion;
  index: number;
  total: number;
  selectedValue: number | undefined;
  onAnswer: (id: string, value: number) => void;
  direction: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question, index, total, selectedValue, onAnswer, direction,
}) => (
  <motion.div
    key={question.id}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    className="w-full"
  >
    {/* Question number chip */}
    <div className="flex items-center gap-2 mb-6">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
        {index + 1}
      </span>
      <span className="text-sm text-slate-400 font-medium">of {total}</span>
    </div>

    {/* Question text */}
    <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-8 leading-snug">
      {question.text}
    </h2>

    {/* Options */}
    <div className="space-y-3">
      {question.options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <motion.button
            key={option.value}
            onClick={() => onAnswer(question.id, option.value)}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 text-sm font-medium transition-all flex items-center justify-between group ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            // Keyboard: options are naturally focusable buttons
          >
            <span>{option.label}</span>
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"
              >
                <CheckCircle size={12} className="text-white" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type Screen = 'setup' | 'question' | 'completion' | 'analyzing' | 'results';

const AssessmentPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<Screen>('setup');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('depression');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [answers, setAnswers] = useState<{ [id: string]: number }>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const questions: AssessmentQuestion[] = getAgeSpecificQuestions(assessmentType, ageGroup);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;
  const currentQuestion = questions[currentIndex];
  const isComplete = answeredCount === totalQuestions;

  // Scroll top whenever the visible question changes
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex, screen]);

  // Reset state on type / age change
  useEffect(() => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setScreen('setup');
  }, [assessmentType, ageGroup]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (screen !== 'question') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      // Number keys 1-4 to select option
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= currentQuestion.options.length) {
        const option = currentQuestion.options[num - 1];
        handleAnswer(currentQuestion.id, option.value);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screen, currentIndex, currentQuestion],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((p) => p + 1);
    } else if (isComplete) {
      setScreen('completion');
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((p) => p - 1);
    }
  };

  const handleAnswer = (id: string, value: number) => {
    const isNew = answers[id] === undefined;
    setAnswers((prev) => ({ ...prev, [id]: value }));

    // Auto-advance only on a fresh answer (not a change)
    if (isNew) {
      if (currentIndex < totalQuestions - 1) {
        setDirection(1);
        setTimeout(() => setCurrentIndex((p) => p + 1), 340);
      } else {
        // Last question answered — go to completion screen
        setTimeout(() => setScreen('completion'), 400);
      }
    }
  };

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    setScreen('analyzing');

    try {
      const answerArray = questions.map((q) => answers[q.id] ?? 0);
      const score = answerArray.reduce((sum, a) => sum + a, 0);

      await new Promise((resolve) => setTimeout(resolve, 2200));

      let res: AssessmentResult;
      if (assessmentType === 'depression') {
        res = await interpretDepressionResult(score, ageGroup, answerArray);
      } else {
        res = await interpretAnxietyResult(score, ageGroup, answerArray);
      }

      setResult(res);
      setIsAnalyzing(false);
      setScreen('results');

      if (currentUser) {
        try {
          const firestoreType = assessmentType === 'depression' ? 'PHQ-9' : 'GAD-7';
          const assessmentsRef = collection(db, 'users', currentUser.uid, 'assessments');
          const docId = `${firestoreType}-${Date.now()}`;
          await setDoc(doc(assessmentsRef, docId), {
            type: firestoreType,
            score: res.score,
            severity: res.severity,
            timestamp: Timestamp.fromDate(new Date()),
          });
        } catch (saveError) {
          console.error('Failed to save assessment to Firebase:', saveError);
        }
      }
    } catch (error) {
      console.error('Error processing assessment:', error);
      setIsAnalyzing(false);
      setScreen('completion');
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setDirection(1);
    setScreen('setup');
  };

  // ── Shared progress bar (shown during questionnaire) ──
  const ProgressBar = () => (
    <div className="px-6 pt-6 pb-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Question {Math.min(currentIndex + 1, totalQuestions)} of {totalQuestions}
        </span>
        <span className="text-xs font-semibold text-indigo-600">
          {Math.round(progress)}% complete
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );

  // ── RESULTS ──────────────────────────────────────────────────────────────────
  if (screen === 'results' && result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Main result card */}
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 text-white" style={{ backgroundColor: result.color }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1 tracking-tight">Assessment Results</h2>
                  <p className="opacity-80 text-lg">
                    Score: {result.score} &middot;{' '}
                    {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} severity
                  </p>
                </div>
                <BarChart3 size={48} className="opacity-60" />
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-slate-700 text-lg leading-relaxed">{result.interpretation}</p>
            </div>
          </div>

          {/* ML Insights */}
          {result.mlPrediction && (
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center mb-5">
                <Brain size={22} className="text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-slate-800">AI-Generated Insights</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-2 gap-1.5">
                    <Target size={18} className="text-indigo-600" />
                    <span className="font-semibold text-sm text-slate-700">Risk Assessment</span>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {(result.mlPrediction.riskLevel * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Confidence: {(result.mlPrediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-2 gap-1.5">
                    <TrendingUp size={18} className="text-violet-600" />
                    <span className="font-semibold text-sm text-slate-700">Pattern Analysis</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Based on your response patterns and demographic factors
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center mb-2 gap-1.5">
                    <Activity size={18} className="text-teal-600" />
                    <span className="font-semibold text-sm text-slate-700">Personalization</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tailored for {ageGroup} {assessmentType} assessment
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-sm mb-3">Personalized Insights:</h4>
                {result.mlPrediction.personalizedInsights.map((insight, i) => (
                  <div key={i} className="flex items-start bg-white rounded-xl p-3 gap-2.5 shadow-sm">
                    <Lightbulb size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk & Protective factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {result.riskFactors.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-center mb-4 gap-2">
                  <AlertTriangle size={20} className="text-red-600" />
                  <h3 className="font-semibold text-red-800">Risk Factors</h3>
                </div>
                <ul className="space-y-2">
                  {result.riskFactors.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-red-700 text-sm">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.protectiveFactors.length > 0 && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center mb-4 gap-2">
                  <Shield size={20} className="text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">Protective Factors</h3>
                </div>
                <ul className="space-y-2">
                  {result.protectiveFactors.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-emerald-700 text-sm">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Lightbulb size={22} className="text-amber-500" />
              Personalized Recommendations
            </h3>
            <div className="grid gap-5">
              {result.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  className="bg-slate-50 rounded-xl p-5 border border-slate-200"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-2xl shadow-sm">
                      {getTherapyIcon(rec.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 mb-1">{rec.title}</h4>
                      <p className="text-slate-600 text-sm mb-2">{rec.description}</p>
                      {rec.duration && (
                        <p className="text-xs text-indigo-600 font-medium">Duration: {rec.duration}</p>
                      )}
                      {rec.videoUrl && (
                        <div className="mt-4">
                          <iframe
                            width="100%"
                            height="200"
                            src={rec.videoUrl}
                            title={rec.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pb-6">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Take Another Assessment
            </button>
            <button
              onClick={() => navigate('/mood-tracker')}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              Track Your Mood
            </button>
            <button
              onClick={() => navigate('/find-help')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Find Professional Help
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── QUESTIONNAIRE SHELL ───────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-xl mx-auto">
        {/* Analyzing overlay */}
        <AnimatePresence mode="wait">
          {screen === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnalyzingScreen />
            </motion.div>
          )}

          {/* Setup */}
          {screen === 'setup' && (
            <SetupScreen
              key="setup"
              assessmentType={assessmentType}
              ageGroup={ageGroup}
              onTypeChange={(v) => setAssessmentType(v)}
              onAgeChange={(v) => setAgeGroup(v)}
              onStart={() => {
                setCurrentIndex(0);
                setDirection(1);
                setScreen('question');
              }}
            />
          )}

          {/* Completion */}
          {screen === 'completion' && (
            <CompletionScreen
              key="completion"
              onAnalyze={handleSubmit}
              isAnalyzing={isAnalyzing}
              totalAnswered={answeredCount}
              total={totalQuestions}
            />
          )}

          {/* Question flow */}
          {screen === 'question' && (
            <motion.div
              key="question-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200 mx-4 my-8 overflow-hidden"
            >
              {/* Progress bar */}
              <ProgressBar />

              {/* Animated question card */}
              <div className="p-6 md:p-8 min-h-[360px] relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <QuestionCard
                    key={currentQuestion.id}
                    question={currentQuestion}
                    index={currentIndex}
                    total={totalQuestions}
                    selectedValue={answers[currentQuestion.id]}
                    onAnswer={handleAnswer}
                    direction={direction}
                  />
                </AnimatePresence>
              </div>

              {/* Navigation footer */}
              <div className="px-6 md:px-8 pb-6 flex items-center justify-between border-t border-slate-100 pt-4">
                {/* Back button */}
                <button
                  onClick={() => {
                    setDirection(-1);
                    goPrev();
                  }}
                  disabled={currentIndex === 0}
                  aria-label="Previous question"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-500 font-medium text-sm hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                {/* Step dots */}
                <div className="flex gap-1.5">
                  {questions.slice(0, Math.min(totalQuestions, 10)).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setCurrentIndex(i);
                      }}
                      aria-label={`Go to question ${i + 1}`}
                      className={`rounded-full transition-all ${
                        i === currentIndex
                          ? 'w-5 h-2.5 bg-indigo-500'
                          : answers[questions[i].id] !== undefined
                          ? 'w-2.5 h-2.5 bg-indigo-300'
                          : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                  {totalQuestions > 10 && (
                    <span className="text-xs text-slate-400 self-center">+{totalQuestions - 10}</span>
                  )}
                </div>

                {/* Next / Submit */}
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => {
                      setDirection(1);
                      goNext();
                    }}
                    disabled={answers[currentQuestion.id] === undefined}
                    aria-label="Next question"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => setScreen('completion')}
                    disabled={!isComplete}
                    aria-label="Finish assessment"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium text-sm hover:from-violet-700 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-200"
                  >
                    Finish
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssessmentPage;

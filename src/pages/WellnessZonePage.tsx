// WellnessZone.tsx  — upgraded Recharge Zone
// Drop-in replacement for src/components/WellnessZone.tsx
// WellnessZonePage.tsx and all routing remain UNCHANGED.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Types (unchanged public API)
// ─────────────────────────────────────────────────────────────────────────────
type Mood = 'great' | 'good' | 'okay' | 'low' | 'bad';
type ActivityId = 'breathing' | 'game' | 'jokes' | 'stretch' | 'music';

interface WellnessZoneProps {
  moodScore?: number | null;
}

function getMoodCategory(score: number | null | undefined): Mood {
  if (score == null) return 'okay';
  if (score >= 9) return 'great';
  if (score >= 7) return 'good';
  if (score >= 5) return 'okay';
  if (score >= 3) return 'low';
  return 'bad';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood config (same logic, richer visuals)
// ─────────────────────────────────────────────────────────────────────────────
const MOOD_ACTIVITIES: Record<Mood, ActivityId[]> = {
  great: ['game', 'jokes', 'music'],
  good:  ['music', 'game', 'stretch'],
  okay:  ['breathing', 'jokes', 'stretch', 'music'],
  low:   ['breathing', 'jokes', 'stretch', 'game'],
  bad:   ['breathing', 'stretch', 'jokes', 'music'],
};

const MOOD_META: Record<Mood, {
  emoji: string; label: string; subLabel: string;
  gradFrom: string; gradTo: string; accent: string; textAccent: string;
}> = {
  great: {
    emoji: '😄', label: "You're glowing today!",
    subLabel: "Let's celebrate that energy ✨",
    gradFrom: '#d1fae5', gradTo: '#a7f3d0', accent: '#10b981', textAccent: '#065f46',
  },
  good: {
    emoji: '😊', label: "Pretty good — keep the momentum",
    subLabel: "A little boost never hurts 💙",
    gradFrom: '#dbeafe', gradTo: '#bfdbfe', accent: '#3b82f6', textAccent: '#1e3a8a',
  },
  okay: {
    emoji: '😐', label: "Let's lift your mood a little",
    subLabel: "We've got just the right activities 🌿",
    gradFrom: '#fef9c3', gradTo: '#fde68a', accent: '#f59e0b', textAccent: '#78350f',
  },
  low: {
    emoji: '😔', label: "Here to help you feel better",
    subLabel: "Take it one breath at a time 🤗",
    gradFrom: '#ffedd5', gradTo: '#fed7aa', accent: '#f97316', textAccent: '#7c2d12',
  },
  bad: {
    emoji: '😰', label: "We've got you — take it easy",
    subLabel: "Start with one gentle activity 💙",
    gradFrom: '#fee2e2', gradTo: '#fecaca', accent: '#ef4444', textAccent: '#7f1d1d',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Encouragement engine
// ─────────────────────────────────────────────────────────────────────────────
const ENCOURAGEMENTS = [
  "You're doing amazing 🌟",
  "Keep breathing slowly 💙",
  "Every moment of care counts ✨",
  "You're showing up for yourself — that matters 💚",
  "Progress, not perfection 🌿",
  "One breath at a time 🧘",
  "You deserve this moment of calm 🍃",
  "Look at you taking care of yourself 🌸",
];

const FloatingEncouragement: React.FC<{ visible: boolean }> = ({ visible }) => {
  const [msg] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-md border border-emerald-200 text-emerald-800 px-6 py-3 rounded-2xl shadow-xl shadow-emerald-100 text-sm font-semibold whitespace-nowrap">
            {msg}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Session tracker (which activities opened this session)
// ─────────────────────────────────────────────────────────────────────────────
interface SessionStats {
  activitiesVisited: ActivityId[];
  breathingCycles: number;
  stretchesDone: number;
  startTime: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ✨ BREATHING EXERCISE — immersive redesign
// ─────────────────────────────────────────────────────────────────────────────
interface BreathingProps { onCycleComplete?: () => void; }

const BreathingExercise: React.FC<BreathingProps> = ({ onCycleComplete }) => {
  const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'] as const;
  const durations = [4, 4, 4, 4];
  const phaseColors = ['#6EE7B7', '#A78BFA', '#67E8F9', '#A78BFA'];
  const phaseInstructions = [
    'Breathe in slowly through your nose',
    'Hold your breath gently',
    'Release slowly through your mouth',
    'Rest and soften',
  ];
  const phaseEmojis = ['👃', '🤐', '😮‍💨', '😌'];

  const [phase, setPhase] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durations[0]);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controls = useAnimation();

  const phaseColor = phaseColors[phase];

  // Breathing animation
  useEffect(() => {
    if (!running) return;
    const targetScale = phase === 0 ? 1.5 : phase === 2 ? 0.65 : 1.05;
    controls.start({
      scale: targetScale,
      transition: { duration: durations[phase], ease: [0.45, 0, 0.55, 1] },
    });
  }, [phase, running]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1;
        setPhase(p => {
          const next = (p + 1) % phases.length;
          if (next === 0) {
            setCycles(c => {
              const newCount = c + 1;
              onCycleComplete?.();
              return newCount;
            });
          }
          setTimeout(() => setSecondsLeft(durations[next]), 0);
          return next;
        });
        return prev;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const stop = () => {
    setRunning(false);
    setPhase(0);
    setSecondsLeft(durations[0]);
    controls.stop();
    controls.set({ scale: 1 });
  };

  const totalSecs = durations[phase];
  const arcProgress = 1 - (secondsLeft / totalSecs);
  const r = 110;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center py-6 select-none gap-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Box Breathing · 4-4-4-4</p>
        <AnimatePresence mode="wait">
          <motion.p key={cycles} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm font-semibold text-emerald-600">
            {cycles === 0 ? 'Ready to begin' : `${cycles} cycle${cycles !== 1 ? 's' : ''} complete 🌿`}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Central breathing orb */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        {/* Outer ambient glow layers */}
        <motion.div animate={controls}
          className="absolute rounded-full opacity-10"
          style={{ width: 260, height: 260, backgroundColor: phaseColor, filter: 'blur(20px)' }} />
        <motion.div animate={controls}
          className="absolute rounded-full opacity-20"
          style={{ width: 220, height: 220, backgroundColor: phaseColor, filter: 'blur(8px)' }} />

        {/* SVG arc ring */}
        <svg className="absolute" width="260" height="260" viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="130" cy="130" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="130" cy="130" r={r} fill="none"
            stroke={phaseColor} strokeWidth="6"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - arcProgress) }}
            transition={{ duration: 0.8, ease: 'linear' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${phaseColor})` }}
          />
        </svg>

        {/* Core circle */}
        <motion.div
          animate={controls}
          className="absolute rounded-full flex items-center justify-center"
          style={{ width: 140, height: 140, backgroundColor: phaseColor + '33', border: `2px solid ${phaseColor}66` }}
        />

        {/* Center content */}
        <div className="relative z-10 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={`${phase}-${running}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-3xl">{running ? phaseEmojis[phase] : '🫧'}</span>
              <span className="text-4xl font-black" style={{ color: running ? phaseColor : '#9CA3AF' }}>
                {running ? secondsLeft : '•'}
              </span>
              <span className="text-xs font-bold tracking-wide" style={{ color: running ? phaseColor : '#D1D5DB' }}>
                {running ? phases[phase].toUpperCase() : 'READY'}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Instruction line */}
      <AnimatePresence mode="wait">
        <motion.p key={`instr-${phase}-${running}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-gray-500 text-center font-medium min-h-5 px-4"
        >
          {running ? phaseInstructions[phase] : 'Press start and follow the expanding circle'}
        </motion.p>
      </AnimatePresence>

      {/* Phase dots */}
      <div className="flex gap-5">
        {phases.map((p, i) => (
          <div key={p} className="flex flex-col items-center gap-1.5">
            <motion.div
              animate={{
                scale: i === phase && running ? 1.5 : 1,
                backgroundColor: i === phase && running ? phaseColors[i] : '#E5E7EB',
              }}
              className="w-2.5 h-2.5 rounded-full"
              transition={{ duration: 0.3 }}
            />
            <span className="text-[10px] font-semibold text-gray-400 uppercase">{p[0]}</span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => running ? stop() : setRunning(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`px-10 py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${
            running
              ? 'bg-gradient-to-r from-red-400 to-rose-500 shadow-rose-200'
              : 'bg-gradient-to-r from-teal-400 to-emerald-500 shadow-emerald-200'
          }`}
        >
          {running ? '⏹ Stop' : '▶ Start Breathing'}
        </motion.button>
      </div>

      {cycles >= 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm text-emerald-700 font-semibold text-center">
          🌟 {cycles} cycles — you're building a real habit!
        </motion.div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🫧 BUBBLE POP GAME — elevated
// ─────────────────────────────────────────────────────────────────────────────
interface Bubble { id: number; x: number; y: number; size: number; color: string; emoji: string; }

const BubbleGame: React.FC = () => {
  const palettes = [
    { bg: '#60A5FA', shadow: '#93C5FD' }, { bg: '#34D399', shadow: '#6EE7B7' },
    { bg: '#F472B6', shadow: '#F9A8D4' }, { bg: '#FBBF24', shadow: '#FDE68A' },
    { bg: '#A78BFA', shadow: '#C4B5FD' }, { bg: '#38BDF8', shadow: '#7DD3FC' },
  ];
  const emojis = ['🫧', '💙', '💜', '💚', '💛', '🩷', '⭐', '🌸'];
  const MAX_BUBBLES = 7; // game over if this many unpopped bubbles on screen

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [gameOn, setGameOn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [popped, setPopped] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const nextId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gameOn) return;
    timerRef.current = setInterval(() => {
      setBubbles(prev => {
        // Game over if too many bubbles piled up
        if (prev.length >= MAX_BUBBLES) {
          setGameOn(false);
          setGameOver(true);
          return prev;
        }
        const p = palettes[Math.floor(Math.random() * palettes.length)];
        return [...prev, {
          id: nextId.current++,
          x: 5 + Math.random() * 80,
          y: 5 + Math.random() * 78,
          size: 46 + Math.random() * 34,
          color: p.bg,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        }];
      });
    }, 650);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameOn]);

  const pop = (id: number) => {
    setPopped(p => [...p, id]);
    setScore(s => s + 1);
    setStreak(s => {
      const next = s + 1;
      if (next >= 5) { setShowStreak(true); if (streakTimer.current) clearTimeout(streakTimer.current); streakTimer.current = setTimeout(() => setShowStreak(false), 1600); }
      return next;
    });
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== id));
      setPopped(p => p.filter(x => x !== id));
    }, 220);
  };

  const reset = () => { setBubbles([]); setScore(0); setPopped([]); setGameOn(false); setGameOver(false); setStreak(0); setShowStreak(false); };

  const milestones = [10, 25, 50];
  const nextMilestone = milestones.find(m => score < m);
  // Warning colour as bubbles pile up
  const dangerLevel = bubbles.length / MAX_BUBBLES;
  const arenaColor = dangerLevel >= 0.71 ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)';

  return (
    <div className="flex flex-col items-center py-4 gap-3">
      {/* Score bar — hugs content, centered */}
      <div className="inline-flex items-center gap-5 bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100">
        <div className="text-center">
          <div className="text-3xl font-black text-blue-500">{score}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popped</div>
        </div>
        {nextMilestone && (
          <div style={{ width: 100 }}>
            <div className="text-[10px] text-gray-400 font-semibold mb-1 text-center">
              Next goal: {nextMilestone} 🎯
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full"
                animate={{ width: `${(score / nextMilestone) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
        {streak >= 3 && (
          <div className="text-center">
            <div className="text-xl font-black text-orange-500">{streak}🔥</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Streak</div>
          </div>
        )}
      </div>

      {/* Bubble danger warning */}
      {gameOn && bubbles.length >= 5 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-xs font-bold text-red-500 flex items-center gap-1">
          ⚠️ {MAX_BUBBLES - bubbles.length === 1 ? 'Last bubble! Pop fast!' : `${MAX_BUBBLES - bubbles.length} more bubbles = game over!`}
        </motion.div>
      )}

      {/* Streak burst */}
      <AnimatePresence>
        {showStreak && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="absolute text-2xl font-black text-orange-500 z-50 pointer-events-none"
            style={{ top: '30%' }}
          >
            🔥 On a streak!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game arena — centered */}
      <div
        className="relative rounded-3xl overflow-hidden border shadow-inner transition-colors duration-500"
        style={{
          width: 300, height: 280,
          background: arenaColor,
          borderColor: dangerLevel >= 0.71 ? '#FECDD3' : '#BFDBFE',
        }}
      >
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #A78BFA 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {!gameOn && !gameOver && score === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
              className="text-6xl">🫧</motion.div>
            <p className="font-bold text-gray-500 text-base">Pop the bubbles!</p>
            <p className="text-sm text-gray-400">Don't let 7 pile up or it's game over!</p>
          </div>
        )}
        {!gameOn && gameOver && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-5xl">💥</div>
            <p className="font-black text-red-500 text-xl">Overflow! {score} popped</p>
            <p className="text-sm text-gray-400">Too many bubbles piled up!</p>
            <p className="text-xs font-bold text-gray-400">{score >= 15 ? "Amazing reflexes! 🌟" : score >= 8 ? "Good run! 💪" : "Keep practising! 😊"}</p>
          </motion.div>
        )}
        {!gameOn && !gameOver && score > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-5xl">🎉</div>
            <p className="font-black text-gray-700 text-xl">You popped {score}!</p>
            <p className="text-sm text-gray-400">
              {score >= 25 ? "Incredible focus! 🌟" : score >= 10 ? "Great session! 💪" : "Nice work! 😊"}
            </p>
          </div>
        )}

        <AnimatePresence>
          {bubbles.map(b => (
            <motion.button
              key={b.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: popped.includes(b.id) ? 1.7 : 1, opacity: popped.includes(b.id) ? 0 : 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => !popped.includes(b.id) && pop(b.id)}
              className="absolute rounded-full flex items-center justify-center cursor-pointer select-none"
              style={{
                left: `${b.x}%`, top: `${b.y}%`,
                width: b.size, height: b.size,
                backgroundColor: b.color,
                fontSize: b.size * 0.38,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 4px 20px ${b.color}88`,
              }}
            >
              {b.emoji}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={() => { if (gameOver) reset(); else setGameOn(g => !g); }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className={`px-6 py-2.5 rounded-2xl font-bold text-white text-sm shadow-lg transition-all ${
            gameOn ? 'bg-gradient-to-r from-red-400 to-rose-500 shadow-rose-100' : 'bg-gradient-to-r from-blue-500 to-violet-500 shadow-blue-100'
          }`}
        >
          {gameOver ? '🔄 Try Again' : gameOn ? '⏹ Stop' : '▶ Play'}
        </motion.button>
        {!gameOver && score > 0 && (
          <motion.button onClick={reset} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-2xl font-semibold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
            🔄 Reset
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 😂 JOKES & FUN FACTS — same data, upgraded cards
// ─────────────────────────────────────────────────────────────────────────────
const JOKES = [
  { type: '😂 Joke',     text: "Why don't scientists trust atoms?\n\nBecause they make up everything! 😆" },
  { type: '😂 Joke',     text: "Why did the scarecrow win an award?\n\nBecause he was outstanding in his field! 🌾" },
  { type: '😂 Joke',     text: "I told my doctor I broke my arm in two places.\n\nHe told me to stop going to those places! 😅" },
  { type: '😂 Joke',     text: "Why can't you give Elsa a balloon?\n\nBecause she'll let it go! ❄️" },
  { type: '😂 Joke',     text: "What do you call a fake noodle?\n\nAn impasta! 🍝" },
  { type: '😂 Joke',     text: "Why do cows wear bells?\n\nBecause their horns don't work! 🐄" },
  { type: '😂 Joke',     text: "What do you call cheese that isn't yours?\n\nNacho cheese! 🧀" },
  { type: '🌟 Fun Fact', text: "Honey never spoils! Archaeologists found 3000-year-old honey in Egyptian tombs — still perfectly edible. 🍯" },
  { type: '🌟 Fun Fact', text: "Otters hold hands while sleeping so they don't drift apart. 🦦💕" },
  { type: '🌟 Fun Fact', text: "A group of flamingos is called a 'flamboyance'. How perfect is that? 🦩" },
  { type: '🌟 Fun Fact', text: "Cows have best friends and get stressed when separated from them. 🐮💛" },
  { type: '🌟 Fun Fact', text: "The world record for the longest time someone laughed continuously is 3 hours and 6 minutes. 😂" },
  { type: '💭 Thought',  text: "You've survived 100% of your bad days so far.\n\nThat's a perfect record! 🏆" },
  { type: '💭 Thought',  text: "A smile uses 12 muscles.\n\nConsider this your daily workout. 💪😄" },
  { type: '💭 Thought',  text: "Scientists say laughing for 10–15 minutes a day can burn up to 40 calories.\n\nYou're basically at the gym right now. 🏋️😂" },
  { type: '🎨 Random',   text: "If you fake a smile for long enough, your brain actually starts to feel happier.\n\nTry it — smile right now! 😁" },
  { type: '🎨 Random',   text: "Penguins propose to their partners with pebbles. 🐧💍\n\nHighly romantic, honestly." },
  { type: '🎨 Random',   text: "Wombats produce cube-shaped poop.\n\nNobody asked for this information, and yet here we are. 🟫😂" },
];

const TYPE_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  '😂 Joke':     { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  '🌟 Fun Fact': { bg: 'from-sky-50 to-blue-50',    border: 'border-sky-200',   badge: 'bg-sky-100 text-sky-700' },
  '💭 Thought':  { bg: 'from-violet-50 to-purple-50',border: 'border-violet-200',badge: 'bg-violet-100 text-violet-700' },
  '🎨 Random':   { bg: 'from-pink-50 to-rose-50',   border: 'border-pink-200',  badge: 'bg-pink-100 text-pink-700' },
};

const JokesAndFacts: React.FC = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * JOKES.length));
  const [direction, setDirection] = useState(1);
  const [liked, setLiked] = useState<number[]>([]);
  const [reacted, setReacted] = useState<Record<number, string>>({});

  const next = () => { setDirection(1); setIndex(i => (i + 1) % JOKES.length); };
  const prev = () => { setDirection(-1); setIndex(i => (i - 1 + JOKES.length) % JOKES.length); };

  const current = JOKES[index];
  const style = TYPE_STYLES[current.type] ?? TYPE_STYLES['🎨 Random'];
  const reactions = ['😂', '🤩', '💙', '😌'];

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Type badge + counter */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>{current.type}</span>
        <span className="text-xs text-gray-300 font-semibold">{index + 1}/{JOKES.length}</span>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeInOut' }}
            className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-3xl p-7 text-center shadow-sm min-h-36 flex items-center justify-center`}
          >
            <p className="text-gray-700 font-medium text-[15px] leading-relaxed whitespace-pre-line">
              {current.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Reactions */}
      <div className="flex gap-2">
        {reactions.map(r => (
          <motion.button
            key={r}
            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
            onClick={() => setReacted(prev => ({ ...prev, [index]: r }))}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
              reacted[index] === r ? 'bg-white shadow-md ring-2 ring-yellow-300' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {r}
          </motion.button>
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3">
        <motion.button onClick={prev} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-all">
          ‹
        </motion.button>
        <motion.button
          onClick={() => setLiked(l => l.includes(index) ? l.filter(x => x !== index) : [...l, index])}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
            liked.includes(index) ? 'bg-red-100 shadow-sm' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {liked.includes(index) ? '❤️' : '🤍'}
        </motion.button>
        <motion.button onClick={next} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-all">
          ›
        </motion.button>
      </div>

      {liked.length > 0 && (
        <p className="text-xs text-rose-400 font-semibold">❤️ {liked.length} favourited this session</p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🏃 QUICK STRETCH — immersive guided flow
// ─────────────────────────────────────────────────────────────────────────────
const EXERCISES = [
  { name: 'Neck Rolls', duration: 30, emoji: '🔄', visual: ['😌➡️', '⬆️😌', '😌⬅️', '⬇️😌'], steps: ['Sit or stand tall', 'Slowly drop chin to chest', 'Roll head right → back → left', 'Do 3 slow circles each way'], benefit: 'Releases neck tension' },
  { name: 'Shoulder Shrugs', duration: 20, emoji: '🤷', visual: ['🧍', '🤷', '😌'], steps: ['Stand or sit upright', 'Lift both shoulders to your ears', 'Hold for 3 seconds', 'Drop and repeat 5 times'], benefit: 'Releases shoulder stress' },
  { name: 'Deep Belly Breaths', duration: 30, emoji: '🫁', visual: ['😮‍💨', '😤', '😌'], steps: ['Place one hand on belly', 'Breathe IN for 4 counts (belly rises)', 'Hold for 2 counts', 'Breathe OUT for 6 counts — repeat 5×'], benefit: 'Calms nervous system' },
  { name: 'Wrist & Hand Stretch', duration: 20, emoji: '🙌', visual: ['🤲', '👐', '🙌'], steps: ['Extend both arms in front', 'Flex hands up, then down', 'Make fists, then spread fingers wide', 'Rotate wrists × 5 each direction'], benefit: 'Relieves typing strain' },
  { name: 'Seated Spinal Twist', duration: 30, emoji: '🌀', visual: ['🧍', '↪️🧍', '🧍↩️'], steps: ['Sit up straight in your chair', 'Put right hand on left knee', 'Twist gently to the left', 'Hold 10 sec — switch sides'], benefit: 'Improves posture & focus' },
  { name: 'Eye Rest (20-20-20)', duration: 20, emoji: '👀', visual: ['👀', '🌅', '😌'], steps: ['Look away from your screen', 'Find something 20 feet away', 'Focus on it for 20 seconds', 'Blink slowly 5 times'], benefit: 'Reduces eye strain' },
];

interface QuickStretchProps { onComplete?: () => void; }

const QuickStretch: React.FC<QuickStretchProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0].duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        if (current < EXERCISES.length - 1) {
          const next = current + 1;
          setCurrent(next); setTimeLeft(EXERCISES[next].duration); setStep(0);
        } else {
          setRunning(false); setDone(true); onComplete?.();
        }
      } else {
        setTimeLeft(t => t - 1);
        if (EXERCISES[current].steps.length > 1) {
          const stepDur = EXERCISES[current].duration / EXERCISES[current].steps.length;
          setStep(Math.floor((EXERCISES[current].duration - timeLeft) / stepDur));
        }
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft]);

  const reset = () => { setCurrent(0); setTimeLeft(EXERCISES[0].duration); setRunning(false); setDone(false); setStep(0); };
  const progress = ((EXERCISES[current].duration - timeLeft) / EXERCISES[current].duration) * 100;
  const ex = EXERCISES[current];
  const r = 34;
  const circ = 2 * Math.PI * r;

  if (done) return (
    <div className="flex flex-col items-center py-10 gap-5">
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="text-7xl">🎉</motion.div>
      <div className="text-center">
        <p className="text-2xl font-black text-emerald-600 mb-1">Amazing job!</p>
        <p className="text-gray-400 text-sm">You completed all {EXERCISES.length} exercises</p>
      </div>
      <div className="flex gap-1 flex-wrap justify-center">
        {EXERCISES.map((e, i) => (
          <motion.span key={e.name} initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring' }} className="text-2xl">{e.emoji}</motion.span>
        ))}
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-3 text-sm text-emerald-700 font-semibold text-center">
        Your body thanks you 💚 This took just {EXERCISES.reduce((s, e) => s + e.duration, 0)} seconds!
      </div>
      <motion.button onClick={reset} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        className="px-8 py-3 bg-gradient-to-r from-teal-400 to-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100">
        🔄 Do it again!
      </motion.button>
    </div>
  );

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Progress dots */}
      <div className="flex gap-2">
        {EXERCISES.map((e, i) => (
          <motion.div key={i} title={e.name}
            animate={{ scale: i === current ? 1.15 : 1 }}
            className={`flex items-center justify-center rounded-full text-sm font-bold transition-all ${
              i < current ? 'w-8 h-8 bg-emerald-100 text-emerald-600 ring-1 ring-emerald-300' :
              i === current ? 'w-10 h-10 bg-blue-500 text-white shadow-md shadow-blue-200' :
              'w-8 h-8 bg-gray-100 text-gray-300'
            }`}>
            {i < current ? '✓' : e.emoji}
          </motion.div>
        ))}
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.28 }}
          className="w-full max-w-sm bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-6 text-center shadow-sm"
        >
          <motion.div
            animate={{ scale: running ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: running ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
            className="text-6xl mb-2"
          >
            {ex.emoji}
          </motion.div>
          <h3 className="font-black text-gray-800 text-lg mb-0.5">{ex.name}</h3>
          <p className="text-xs font-bold text-blue-500 mb-4">✨ {ex.benefit}</p>

          {/* Visual emojis */}
          <div className="flex justify-center gap-3 text-2xl mb-4 flex-wrap">
            {ex.visual.map((v, i) => (
              <motion.span key={i}
                animate={{ scale: i === step % ex.visual.length && running ? 1.35 : 0.95, opacity: i === step % ex.visual.length && running ? 1 : 0.45 }}
                transition={{ duration: 0.3 }}
              >{v}</motion.span>
            ))}
          </div>

          {/* Steps */}
          <div className="text-left space-y-2">
            {ex.steps.map((s, i) => (
              <motion.div key={i}
                animate={{ x: i === step && running ? 4 : 0 }}
                className={`flex items-start gap-2 text-sm transition-all rounded-lg px-2 py-1 ${
                  i === step && running ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'
                }`}
              >
                <span className="mt-0.5 text-xs flex-shrink-0">{i === step && running ? '👉' : `${i + 1}.`}</span>
                <span>{s}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Timer ring */}
      <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <motion.circle cx="40" cy="40" r={r} fill="none"
            stroke={running ? '#3B82F6' : '#D1D5DB'} strokeWidth="6"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - progress / 100) }}
            transition={{ duration: 0.9, ease: 'linear' }}
            strokeLinecap="round"
            style={running ? { filter: 'drop-shadow(0 0 4px #3B82F6)' } : {}}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-gray-700">{timeLeft}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 font-medium">Exercise {current + 1} of {EXERCISES.length}</p>

      <motion.button
        onClick={() => setRunning(r => !r)}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        className={`px-10 py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${
          running ? 'bg-gradient-to-r from-red-400 to-rose-500 shadow-rose-100' : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-100'
        }`}
      >
        {running ? '⏸ Pause' : current === 0 && timeLeft === ex.duration ? '▶ Start Stretches' : '▶ Resume'}
      </motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🌟 MINDFUL MOMENT — richer affirmations + gratitude
// ─────────────────────────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  "You are doing better than you think. 🌟",
  "Rest is productive. You deserve to pause. 🍃",
  "Your feelings are valid. Take it one moment at a time. 💙",
  "You've gotten through every hard day so far. 💪",
  "Small steps still count as progress. 🐢",
  "Being kind to yourself is not weakness. It's wisdom. 🌸",
  "You matter more than you know. 🌻",
  "Today doesn't define you. Tomorrow is a fresh start. ✨",
  "Breathe. You are exactly where you need to be. 🧘",
  "You are allowed to feel what you're feeling. 🤍",
  "Growth is happening even when you can't see it. 🌱",
  "You showed up today — that counts for everything. ⭐",
];

const MindfulMoment: React.FC = () => {
  const [affIndex, setAffIndex] = useState(0);
  const [affDir, setAffDir] = useState(1);
  const [saved, setSaved] = useState<number[]>([]);
  const [tab, setTab] = useState<'affirmations' | 'gratitude'>('affirmations');
  const [gratitude, setGratitude] = useState(['', '', '']);
  const [gratitudeSaved, setGratitudeSaved] = useState(false);

  const nextAff = () => { setAffDir(1); setAffIndex(i => (i + 1) % AFFIRMATIONS.length); };
  const prevAff = () => { setAffDir(-1); setAffIndex(i => (i - 1 + AFFIRMATIONS.length) % AFFIRMATIONS.length); };

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 self-center gap-1">
        {(['affirmations', 'gratitude'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t ? 'bg-white shadow text-violet-600' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t === 'affirmations' ? '🌟 Affirmations' : '🙏 Gratitude'}
          </button>
        ))}
      </div>

      {tab === 'affirmations' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-sm overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={affIndex}
                initial={{ x: affDir * 50, opacity: 0, scale: 0.96 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: affDir * -50, opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border border-violet-100 rounded-3xl p-8 text-center shadow-sm min-h-28 flex items-center justify-center relative overflow-hidden"
              >
                {/* Decorative bg dots */}
                <div className="absolute top-3 right-4 text-4xl opacity-10 select-none">✦</div>
                <div className="absolute bottom-3 left-4 text-3xl opacity-10 select-none">✦</div>
                <p className="text-gray-700 font-semibold text-[15px] leading-relaxed relative z-10">
                  {AFFIRMATIONS[affIndex]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Counter dots */}
          <div className="flex gap-1.5">
            {AFFIRMATIONS.map((_, i) => (
              <motion.div key={i}
                animate={{ scale: i === affIndex ? 1.4 : 1, backgroundColor: i === affIndex ? '#7C3AED' : '#E5E7EB' }}
                className="w-1.5 h-1.5 rounded-full"
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.button onClick={prevAff} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">‹</motion.button>
            <motion.button
              onClick={() => setSaved(s => s.includes(affIndex) ? s.filter(x => x !== affIndex) : [...s, affIndex])}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                saved.includes(affIndex)
                  ? 'bg-pink-100 text-pink-600 ring-1 ring-pink-300'
                  : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
              }`}
            >
              {saved.includes(affIndex) ? '❤️ Saved' : '🤍 Save this'}
            </motion.button>
            <motion.button onClick={nextAff} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">›</motion.button>
          </div>

          {saved.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-violet-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-violet-500 mb-3 flex items-center gap-1.5">
                <span>💖</span> Your saved affirmations ({saved.length})
              </p>
              <div className="space-y-2">
                {saved.map(i => (
                  <div key={i} className="text-xs text-gray-600 py-1.5 px-3 bg-violet-50 rounded-xl">
                    {AFFIRMATIONS[i]}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {tab === 'gratitude' && (
        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
          <div className="text-center mb-1">
            <p className="text-sm font-bold text-gray-700">3 things you're grateful for today 🙏</p>
            <p className="text-xs text-gray-400">Research shows this boosts your mood in minutes</p>
          </div>
          {gratitude.map((val, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-3 py-2 shadow-sm">
              <span className="text-xl flex-shrink-0">{['🌻', '💙', '✨'][i]}</span>
              <input
                value={val}
                onChange={e => setGratitude(g => g.map((v, j) => j === i ? e.target.value : v))}
                placeholder={["I'm grateful for…", "Something good today…", "A person I appreciate…"][i]}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300 bg-transparent focus:outline-none font-medium"
              />
            </div>
          ))}
          {gratitude.some(v => v.trim()) && !gratitudeSaved && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setGratitudeSaved(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm shadow-md shadow-violet-100"
            >
              Save my gratitude 💜
            </motion.button>
          )}
          <AnimatePresence>
            {gratitudeSaved && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 border border-violet-100"
              >
                <p className="text-xs font-bold text-violet-600 mb-2">💜 Saved — beautiful things to remember:</p>
                {gratitude.filter(v => v.trim()).map((v, i) => (
                  <p key={i} className="text-xs text-gray-600 py-1">• {v}</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Activity config
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVITY_CONFIG: Record<ActivityId, {
  label: string; emoji: string; desc: string;
  gradFrom: string; gradTo: string; ring: string; tag: string;
}> = {
  breathing: { label: 'Box Breathing',  emoji: '🧘', desc: 'Calm your mind',      gradFrom: '#d1fae5', gradTo: '#a7f3d0', ring: '#10b981', tag: 'Anxiety relief' },
  game:      { label: 'Bubble Pop',     emoji: '🫧', desc: 'Stress relief game',  gradFrom: '#ede9fe', gradTo: '#ddd6fe', ring: '#7c3aed', tag: 'Stress buster' },
  jokes:     { label: 'Jokes & Facts',  emoji: '😂', desc: 'Laugh it out',        gradFrom: '#fef9c3', gradTo: '#fde68a', ring: '#d97706', tag: 'Mood lift' },
  stretch:   { label: 'Quick Stretch',  emoji: '🏃', desc: '6 guided exercises',  gradFrom: '#dbeafe', gradTo: '#bfdbfe', ring: '#2563eb', tag: 'Body reset' },
  music:     { label: 'Mindful Moment', emoji: '🌟', desc: 'Affirmations & more', gradFrom: '#fce7f3', gradTo: '#fbcfe8', ring: '#db2777', tag: 'Inner peace' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Mood Logger — same logic, elevated visuals
// ─────────────────────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { score: 10, emoji: '🤩', label: 'Amazing'    },
  { score: 8,  emoji: '😄', label: 'Great'      },
  { score: 6,  emoji: '😊', label: 'Good'       },
  { score: 5,  emoji: '😐', label: 'Okay'       },
  { score: 3,  emoji: '😔', label: 'Low'        },
  { score: 1,  emoji: '😰', label: 'Really bad' },
];

interface MoodLoggerProps { onLog: (score: number) => void; }

const MoodLogger: React.FC<MoodLoggerProps> = ({ onLog }) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden border border-blue-100 shadow-lg shadow-blue-50"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 50%, #FFF 100%)' }}
    >
      <div className="px-6 pt-8 pb-6">
        {/* Header */}
        <div className="text-center mb-7">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="text-5xl mb-3"
          >
            💙
          </motion.div>
          <h2 className="text-xl font-black text-gray-800 mb-1">How are you feeling?</h2>
          <p className="text-sm text-gray-400">We'll personalise your Recharge Zone based on your mood</p>
        </div>

        {/* Mood grid */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-7">
          {MOOD_OPTIONS.map(({ score, emoji, label }) => (
            <motion.button
              key={score}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelected(score)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selected === score
                  ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <motion.span
                animate={{ scale: selected === score ? 1.2 : 1 }}
                className="text-3xl"
              >
                {emoji}
              </motion.span>
              <span className="text-xs font-bold text-gray-600">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={selected !== null ? { scale: 1.04 } : {}}
            disabled={selected === null}
            onClick={() => selected !== null && onLog(selected)}
            className={`px-10 py-3.5 rounded-2xl font-bold text-white text-base shadow-xl transition-all ${
              selected !== null
                ? 'bg-gradient-to-r from-blue-500 to-violet-500 shadow-blue-200 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {selected !== null ? 'Open Recharge Zone ✨' : 'Pick a mood first'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Session Progress Banner
// ─────────────────────────────────────────────────────────────────────────────
interface SessionBannerProps { stats: SessionStats; total: number; }

const SessionBanner: React.FC<SessionBannerProps> = ({ stats, total }) => {
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const pct = Math.round((stats.activitiesVisited.length / total) * 100);

  if (stats.activitiesVisited.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      className="mx-1 mb-3 overflow-hidden"
    >
      <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-lg">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-700">
              {stats.activitiesVisited.length} of {total} activities explored
            </span>
            <span className="text-xs text-gray-400 font-medium">{mins > 0 ? `${mins}m ` : ''}{elapsed % 60}s</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        {stats.activitiesVisited.length >= total && (
          <span className="text-sm font-bold text-emerald-600">🌟</span>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WELLNESS ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────
interface WellnessActivitiesProps {
  moodScore: number;
  onRelog?: () => void;
}

const WellnessActivities: React.FC<WellnessActivitiesProps> = ({ moodScore, onRelog }) => {
  const [activeActivity, setActiveActivity] = useState<ActivityId | null>(null);
  const [session, setSession] = useState<SessionStats>({
    activitiesVisited: [], breathingCycles: 0, stretchesDone: 0, startTime: Date.now(),
  });
  const [showEncouragement, setShowEncouragement] = useState(false);
  const encouragementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mood = getMoodCategory(moodScore);
  const moodMeta = MOOD_META[mood];
  const activities = MOOD_ACTIVITIES[mood];

  const openActivity = (id: ActivityId) => {
    setActiveActivity(prev => {
      if (prev === id) return null;
      // Track visit
      setSession(s => ({
        ...s,
        activitiesVisited: s.activitiesVisited.includes(id) ? s.activitiesVisited : [...s.activitiesVisited, id],
      }));
      // Show encouragement on 2nd+ activity
      if (!session.activitiesVisited.includes(id) && session.activitiesVisited.length >= 1) {
        if (encouragementTimer.current) clearTimeout(encouragementTimer.current);
        setShowEncouragement(true);
        encouragementTimer.current = setTimeout(() => setShowEncouragement(false), 3000);
      }
      return id;
    });
  };

  const handleBreathingCycle = useCallback(() => {
    setSession(s => ({ ...s, breathingCycles: s.breathingCycles + 1 }));
  }, []);

  const handleStretchComplete = useCallback(() => {
    setSession(s => ({ ...s, stretchesDone: s.stretchesDone + 1 }));
  }, []);

  return (
    <>
      <FloatingEncouragement visible={showEncouragement} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-100"
        style={{ background: 'linear-gradient(160deg, #FAFAFA 0%, #F8F9FF 100%)' }}
      >
        {/* Mood header band */}
        <div
          className="px-6 pt-6 pb-5"
          style={{ background: `linear-gradient(135deg, ${moodMeta.gradFrom}, ${moodMeta.gradTo})` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="text-4xl"
              >
                {moodMeta.emoji}
              </motion.span>
              <div>
                <h2 className="text-base font-black text-gray-800">{moodMeta.label}</h2>
                <p className="text-xs font-semibold mt-0.5" style={{ color: moodMeta.textAccent }}>
                  {moodMeta.subLabel}
                </p>
              </div>
            </div>
            {onRelog && (
              <button
                onClick={onRelog}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl transition-all border border-white/40"
              >
                Re-log mood
              </button>
            )}
          </div>
        </div>

        {/* Session banner */}
        <div className="px-4 pt-4">
          <SessionBanner stats={session} total={activities.length} />
        </div>

        {/* Activity cards */}
        <div className="py-3 px-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
            Recommended for you
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {activities.map((id, i) => {
              const a = ACTIVITY_CONFIG[id];
              const isActive = activeActivity === id;
              const visited = session.activitiesVisited.includes(id);
              return (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openActivity(id)}
                  className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 text-center transition-all cursor-pointer overflow-hidden ${
                    isActive
                      ? 'border-transparent shadow-md'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                  style={{
                    width: 125, padding: '14px 10px',
                    ...(isActive ? {
                      background: `linear-gradient(135deg, ${a.gradFrom}, ${a.gradTo})`,
                      borderColor: a.ring,
                      boxShadow: `0 4px 14px ${a.ring}44`,
                    } : {}),
                  }}
                >
                  {visited && !isActive && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-400 rounded-full text-white text-[8px] flex items-center justify-center font-bold">✓</span>
                  )}
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="text-xs font-bold text-gray-700 leading-tight">{a.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{a.desc}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Expanded activity panel */}
        <AnimatePresence>
          {activeActivity && (
            <motion.div
              key={activeActivity}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="w-full bg-white border-t border-gray-100 shadow-sm overflow-hidden">
                {/* Panel header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: `linear-gradient(135deg, ${ACTIVITY_CONFIG[activeActivity].gradFrom}, ${ACTIVITY_CONFIG[activeActivity].gradTo})`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{ACTIVITY_CONFIG[activeActivity].emoji}</span>
                    <div>
                      <h3 className="font-black text-gray-800 text-sm">{ACTIVITY_CONFIG[activeActivity].label}</h3>
                      <p className="text-[10px] font-semibold text-gray-500">{ACTIVITY_CONFIG[activeActivity].desc}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setActiveActivity(null)}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="w-7 h-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-400 text-sm font-bold shadow-sm transition-all"
                  >
                    ✕
                  </motion.button>
                </div>

                {/* Panel body */}
                <div className="px-2 pb-2">
                  {activeActivity === 'breathing' && <BreathingExercise onCycleComplete={handleBreathingCycle} />}
                  {activeActivity === 'game'      && <BubbleGame />}
                  {activeActivity === 'jokes'     && <JokesAndFacts />}
                  {activeActivity === 'stretch'   && <QuickStretch onComplete={handleStretchComplete} />}
                  {activeActivity === 'music'     && <MindfulMoment />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom session stats (only when something has been done) */}
        {(session.breathingCycles > 0 || session.stretchesDone > 0) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="px-0 pb-0"
          >
            <div className="bg-emerald-50 border border-emerald-100 rounded-b-3xl px-4 py-3 flex gap-4 flex-wrap">
              {session.breathingCycles > 0 && (
                <div className="text-center">
                  <div className="text-lg font-black text-emerald-600">{session.breathingCycles}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Breathing cycles</div>
                </div>
              )}
              {session.stretchesDone > 0 && (
                <div className="text-center">
                  <div className="text-lg font-black text-blue-600">{session.stretchesDone}×</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Stretch sessions</div>
                </div>
              )}
              <div className="flex-1 flex items-center justify-end">
                <span className="text-xs font-bold text-emerald-600">
                  {session.activitiesVisited.length >= activities.length
                    ? "🌟 Full session complete!"
                    : `${session.activitiesVisited.length} activit${session.activitiesVisited.length === 1 ? 'y' : 'ies'} tried`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — public API unchanged
// ─────────────────────────────────────────────────────────────────────────────
const WellnessZone: React.FC<WellnessZoneProps> = ({ moodScore: moodScoreProp }) => {
  const [loggedScore, setLoggedScore] = useState<number | null>(null);
  const moodScore = moodScoreProp ?? loggedScore;

  if (moodScore === null || moodScore === undefined) {
    return <MoodLogger onLog={setLoggedScore} />;
  }

  return <WellnessActivities moodScore={moodScore} onRelog={() => setLoggedScore(null)} />;
};

export default WellnessZone;
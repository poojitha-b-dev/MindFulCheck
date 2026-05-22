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
  great: { emoji: '😄', label: "You're glowing today!", subLabel: "Let's celebrate that energy ✨", gradFrom: '#d1fae5', gradTo: '#a7f3d0', accent: '#10b981', textAccent: '#065f46' },
  good:  { emoji: '😊', label: "Pretty good — keep the momentum", subLabel: "A little boost never hurts 💙", gradFrom: '#dbeafe', gradTo: '#bfdbfe', accent: '#3b82f6', textAccent: '#1e3a8a' },
  okay:  { emoji: '😐', label: "Let's lift your mood a little", subLabel: "We've got just the right activities 🌿", gradFrom: '#fef9c3', gradTo: '#fde68a', accent: '#f59e0b', textAccent: '#78350f' },
  low:   { emoji: '😔', label: "Here to help you feel better", subLabel: "Take it one breath at a time 🤗", gradFrom: '#ffedd5', gradTo: '#fed7aa', accent: '#f97316', textAccent: '#7c2d12' },
  bad:   { emoji: '😰', label: "We've got you — take it easy", subLabel: "Start with one gentle activity 💙", gradFrom: '#fee2e2', gradTo: '#fecaca', accent: '#ef4444', textAccent: '#7f1d1d' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Encouragement
// ─────────────────────────────────────────────────────────────────────────────
const ENCOURAGEMENTS = [
  "You're doing amazing 🌟", "Keep breathing slowly 💙", "Every moment of care counts ✨",
  "You're showing up for yourself — that matters 💚", "Progress, not perfection 🌿",
  "One breath at a time 🧘", "You deserve this moment of calm 🍃", "Look at you taking care of yourself 🌸",
];

const FloatingEncouragement: React.FC<{ visible: boolean }> = ({ visible }) => {
  const [msg] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
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

interface SessionStats {
  activitiesVisited: ActivityId[];
  breathingCycles: number;
  stretchesDone: number;
  startTime: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🧘 BREATHING EXERCISE
// ─────────────────────────────────────────────────────────────────────────────
interface BreathingProps { onCycleComplete?: () => void; }

const BreathingExercise: React.FC<BreathingProps> = ({ onCycleComplete }) => {
  const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'] as const;
  const durations = [4, 4, 4, 4];
  const phaseColors = ['#6EE7B7', '#A78BFA', '#67E8F9', '#A78BFA'];
  const phaseInstructions = ['Breathe in slowly through your nose', 'Hold your breath gently', 'Release slowly through your mouth', 'Rest and soften'];
  const phaseEmojis = ['👃', '🤐', '😮‍💨', '😌'];

  const [phase, setPhase] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durations[0]);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controls = useAnimation();
  const phaseColor = phaseColors[phase];

  useEffect(() => {
    if (!running) return;
    const targetScale = phase === 0 ? 1.5 : phase === 2 ? 0.65 : 1.05;
    controls.start({ scale: targetScale, transition: { duration: durations[phase], ease: [0.45, 0, 0.55, 1] } });
  }, [phase, running]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1;
        setPhase(p => {
          const next = (p + 1) % phases.length;
          if (next === 0) { setCycles(c => { onCycleComplete?.(); return c + 1; }); }
          setTimeout(() => setSecondsLeft(durations[next]), 0);
          return next;
        });
        return prev;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const stop = () => { setRunning(false); setPhase(0); setSecondsLeft(durations[0]); controls.stop(); controls.set({ scale: 1 }); };
  const arcProgress = 1 - (secondsLeft / durations[phase]);
  const r = 110; const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center py-6 select-none gap-4">
      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Box Breathing · 4-4-4-4</p>
        <AnimatePresence mode="wait">
          <motion.p key={cycles} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm font-semibold text-emerald-600">
            {cycles === 0 ? 'Ready to begin' : `${cycles} cycle${cycles !== 1 ? 's' : ''} complete 🌿`}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        <motion.div animate={controls} className="absolute rounded-full opacity-10"
          style={{ width: 260, height: 260, backgroundColor: phaseColor, filter: 'blur(20px)' }} />
        <motion.div animate={controls} className="absolute rounded-full opacity-20"
          style={{ width: 220, height: 220, backgroundColor: phaseColor, filter: 'blur(8px)' }} />
        <svg className="absolute" width="260" height="260" viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="130" cy="130" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle cx="130" cy="130" r={r} fill="none" stroke={phaseColor} strokeWidth="6"
            strokeDasharray={circ} animate={{ strokeDashoffset: circ * (1 - arcProgress) }}
            transition={{ duration: 0.8, ease: 'linear' }} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${phaseColor})` }} />
        </svg>
        <motion.div animate={controls} className="absolute rounded-full flex items-center justify-center"
          style={{ width: 140, height: 140, backgroundColor: phaseColor + '33', border: `2px solid ${phaseColor}66` }} />
        <div className="relative z-10 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={`${phase}-${running}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-1">
              <span className="text-3xl">{running ? phaseEmojis[phase] : '🫧'}</span>
              <span className="text-4xl font-black" style={{ color: running ? phaseColor : '#9CA3AF' }}>{running ? secondsLeft : '•'}</span>
              <span className="text-xs font-bold tracking-wide" style={{ color: running ? phaseColor : '#D1D5DB' }}>
                {running ? phases[phase].toUpperCase() : 'READY'}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={`instr-${phase}-${running}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
          className="text-sm text-gray-500 text-center font-medium min-h-5 px-4">
          {running ? phaseInstructions[phase] : 'Press start and follow the expanding circle'}
        </motion.p>
      </AnimatePresence>

      <div className="flex gap-5">
        {phases.map((p, i) => (
          <div key={p} className="flex flex-col items-center gap-1.5">
            <motion.div animate={{ scale: i === phase && running ? 1.5 : 1, backgroundColor: i === phase && running ? phaseColors[i] : '#E5E7EB' }}
              className="w-2.5 h-2.5 rounded-full" transition={{ duration: 0.3 }} />
            <span className="text-[10px] font-semibold text-gray-400 uppercase">{p[0]}</span>
          </div>
        ))}
      </div>

      <motion.button onClick={() => running ? stop() : setRunning(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        className={`px-10 py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${running ? 'bg-gradient-to-r from-red-400 to-rose-500 shadow-rose-200' : 'bg-gradient-to-r from-teal-400 to-emerald-500 shadow-emerald-200'}`}>
        {running ? '⏹ Stop' : '▶ Start Breathing'}
      </motion.button>

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
// 🫧 BUBBLE POP GAME
// ─────────────────────────────────────────────────────────────────────────────
interface Bubble { id: number; x: number; y: number; size: number; color: string; emoji: string; }

const BubbleGame: React.FC = () => {
  const palettes = [
    { bg: '#60A5FA' }, { bg: '#34D399' }, { bg: '#F472B6' },
    { bg: '#FBBF24' }, { bg: '#A78BFA' }, { bg: '#38BDF8' },
  ];
  const emojis = ['🫧', '💙', '💜', '💚', '💛', '🩷', '⭐', '🌸'];
  const MAX_BUBBLES = 7;

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
        if (prev.length >= MAX_BUBBLES) { setGameOn(false); setGameOver(true); return prev; }
        const p = palettes[Math.floor(Math.random() * palettes.length)];
        return [...prev, { id: nextId.current++, x: 5 + Math.random() * 80, y: 5 + Math.random() * 78, size: 46 + Math.random() * 34, color: p.bg, emoji: emojis[Math.floor(Math.random() * emojis.length)] }];
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
    setTimeout(() => { setBubbles(prev => prev.filter(b => b.id !== id)); setPopped(p => p.filter(x => x !== id)); }, 220);
  };

  const reset = () => { setBubbles([]); setScore(0); setPopped([]); setGameOn(false); setGameOver(false); setStreak(0); setShowStreak(false); };

  const milestones = [10, 25, 50];
  const nextMilestone = milestones.find(m => score < m);
  const dangerLevel = bubbles.length / MAX_BUBBLES;
  const arenaColor = dangerLevel >= 0.71 ? 'linear-gradient(135deg,#FFF1F2 0%,#FFE4E6 100%)' : 'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%)';

  return (
    <div className="flex flex-col items-center py-4 gap-3">
      {/* Compact stats bar */}
      <div className="inline-flex items-center gap-5 bg-slate-50 rounded-2xl px-5 py-3 border border-slate-100">
        <div className="text-center">
          <div className="text-3xl font-black text-blue-500">{score}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popped</div>
        </div>
        {nextMilestone && (
          <div style={{ width: 90 }}>
            <div className="text-[10px] text-gray-400 font-semibold mb-1 text-center">Goal: {nextMilestone} 🎯</div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full"
                animate={{ width: `${(score / nextMilestone) * 100}%` }} transition={{ duration: 0.3 }} />
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

      {gameOn && bubbles.length >= 5 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-xs font-bold text-red-500">
          ⚠️ {MAX_BUBBLES - bubbles.length === 1 ? 'Last bubble!' : `${MAX_BUBBLES - bubbles.length} more = game over!`}
        </motion.div>
      )}

      {/* Game arena */}
      <div className="relative rounded-3xl overflow-hidden border shadow-inner transition-colors duration-500"
        style={{ width: 300, height: 280, background: arenaColor, borderColor: dangerLevel >= 0.71 ? '#FECDD3' : '#BFDBFE' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #A78BFA 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {!gameOn && !gameOver && score === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-6xl">🫧</motion.div>
            <p className="font-bold text-gray-500 text-base">Pop the bubbles!</p>
            <p className="text-sm text-gray-400">Don't let 7 pile up!</p>
          </div>
        )}
        {!gameOn && gameOver && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-5xl">💥</div>
            <p className="font-black text-red-500 text-xl">Overflow! {score} popped</p>
            <p className="text-xs font-bold text-gray-400">{score >= 15 ? "Amazing! 🌟" : score >= 8 ? "Good run! 💪" : "Keep going! 😊"}</p>
          </motion.div>
        )}
        {!gameOn && !gameOver && score > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-5xl">🎉</div>
            <p className="font-black text-gray-700 text-xl">You popped {score}!</p>
          </div>
        )}

        <AnimatePresence>
          {bubbles.map(b => (
            <motion.button key={b.id} initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: popped.includes(b.id) ? 1.7 : 1, opacity: popped.includes(b.id) ? 0 : 1 }}
              exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18 }}
              onClick={() => !popped.includes(b.id) && pop(b.id)}
              className="absolute rounded-full flex items-center justify-center cursor-pointer select-none"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size, backgroundColor: b.color, fontSize: b.size * 0.38, transform: 'translate(-50%,-50%)', boxShadow: `0 4px 20px ${b.color}88` }}>
              {b.emoji}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <motion.button onClick={() => { if (gameOver) reset(); else setGameOn(g => !g); }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          className={`px-6 py-2.5 rounded-2xl font-bold text-white text-sm shadow-lg ${gameOn ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-violet-500 shadow-blue-100'}`}>
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
// 😂 JOKES & FACTS
// ─────────────────────────────────────────────────────────────────────────────
const JOKES = [
  { type: '😂 Joke', text: "Why don't scientists trust atoms?\n\nBecause they make up everything! 😆" },
  { type: '😂 Joke', text: "Why did the scarecrow win an award?\n\nBecause he was outstanding in his field! 🌾" },
  { type: '😂 Joke', text: "I told my doctor I broke my arm in two places.\n\nHe told me to stop going to those places! 😅" },
  { type: '😂 Joke', text: "Why can't you give Elsa a balloon?\n\nBecause she'll let it go! ❄️" },
  { type: '😂 Joke', text: "What do you call a fake noodle?\n\nAn impasta! 🍝" },
  { type: '😂 Joke', text: "Why do cows wear bells?\n\nBecause their horns don't work! 🐄" },
  { type: '😂 Joke', text: "What do you call cheese that isn't yours?\n\nNacho cheese! 🧀" },
  { type: '🌟 Fun Fact', text: "Honey never spoils! Archaeologists found 3000-year-old honey in Egyptian tombs — still perfectly edible. 🍯" },
  { type: '🌟 Fun Fact', text: "Otters hold hands while sleeping so they don't drift apart. 🦦💕" },
  { type: '🌟 Fun Fact', text: "A group of flamingos is called a 'flamboyance'. How perfect is that? 🦩" },
  { type: '🌟 Fun Fact', text: "Cows have best friends and get stressed when separated from them. 🐮💛" },
  { type: '💭 Thought', text: "You've survived 100% of your bad days so far.\n\nThat's a perfect record! 🏆" },
  { type: '💭 Thought', text: "A smile uses 12 muscles.\n\nConsider this your daily workout. 💪😄" },
  { type: '🎨 Random', text: "Penguins propose to their partners with pebbles. 🐧💍\n\nHighly romantic, honestly." },
  { type: '🎨 Random', text: "Wombats produce cube-shaped poop.\n\nNobody asked for this information, and yet here we are. 🟫😂" },
];

const TYPE_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  '😂 Joke':     { bg: 'from-amber-50 to-yellow-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
  '🌟 Fun Fact': { bg: 'from-sky-50 to-blue-50',       border: 'border-sky-200',    badge: 'bg-sky-100 text-sky-700' },
  '💭 Thought':  { bg: 'from-violet-50 to-purple-50',  border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  '🎨 Random':   { bg: 'from-pink-50 to-rose-50',      border: 'border-pink-200',   badge: 'bg-pink-100 text-pink-700' },
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
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>{current.type}</span>
        <span className="text-xs text-gray-300 font-semibold">{index + 1}/{JOKES.length}</span>
      </div>
      <div className="relative w-full max-w-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ x: direction * 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }} transition={{ duration: 0.26 }}
            className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-3xl p-7 text-center shadow-sm min-h-36 flex items-center justify-center`}>
            <p className="text-gray-700 font-medium text-[15px] leading-relaxed whitespace-pre-line">{current.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        {reactions.map(r => (
          <motion.button key={r} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
            onClick={() => setReacted(prev => ({ ...prev, [index]: r }))}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${reacted[index] === r ? 'bg-white shadow-md ring-2 ring-yellow-300' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {r}
          </motion.button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <motion.button onClick={prev} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">‹</motion.button>
        <motion.button onClick={() => setLiked(l => l.includes(index) ? l.filter(x => x !== index) : [...l, index])}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${liked.includes(index) ? 'bg-red-100 shadow-sm' : 'bg-gray-100 hover:bg-gray-200'}`}>
          {liked.includes(index) ? '❤️' : '🤍'}
        </motion.button>
        <motion.button onClick={next} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">›</motion.button>
      </div>
      {liked.length > 0 && <p className="text-xs text-rose-400 font-semibold">❤️ {liked.length} favourited</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🏃 QUICK STRETCH
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
        if (current < EXERCISES.length - 1) { const next = current + 1; setCurrent(next); setTimeLeft(EXERCISES[next].duration); setStep(0); }
        else { setRunning(false); setDone(true); onComplete?.(); }
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
  const r = 34; const circ = 2 * Math.PI * r;

  if (done) return (
    <div className="flex flex-col items-center py-10 gap-5">
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="text-7xl">🎉</motion.div>
      <div className="text-center">
        <p className="text-2xl font-black text-emerald-600 mb-1">Amazing job!</p>
        <p className="text-gray-400 text-sm">You completed all {EXERCISES.length} exercises</p>
      </div>
      <motion.button onClick={reset} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        className="px-8 py-3 bg-gradient-to-r from-teal-400 to-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100">
        🔄 Do it again!
      </motion.button>
    </div>
  );

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      <div className="flex gap-2">
        {EXERCISES.map((e, i) => (
          <motion.div key={i} animate={{ scale: i === current ? 1.15 : 1 }}
            className={`flex items-center justify-center rounded-full text-sm font-bold transition-all ${i < current ? 'w-8 h-8 bg-emerald-100 text-emerald-600 ring-1 ring-emerald-300' : i === current ? 'w-10 h-10 bg-blue-500 text-white shadow-md shadow-blue-200' : 'w-8 h-8 bg-gray-100 text-gray-300'}`}>
            {i < current ? '✓' : e.emoji}
          </motion.div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.28 }}
          className="w-full max-w-sm bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-6 text-center shadow-sm">
          <motion.div animate={{ scale: running ? [1, 1.1, 1] : 1 }} transition={{ repeat: running ? Infinity : 0, duration: 1.5 }} className="text-5xl mb-2">{ex.emoji}</motion.div>
          <h3 className="font-bold text-gray-800 text-lg mt-2">{ex.name}</h3>
          <p className="text-xs text-blue-500 font-medium mb-3">✨ {ex.benefit}</p>
          <div className="flex justify-center gap-2 text-2xl mb-3 flex-wrap">
            {ex.visual.map((v, i) => (
              <span key={i} className={`transition-all ${i === step % ex.visual.length && running ? 'scale-125' : 'opacity-60'}`}>{v}</span>
            ))}
          </div>
          <div className="text-left space-y-1">
            {ex.steps.map((s, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm transition-all ${i === step && running ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}>
                <span className="mt-0.5 text-xs">{i === step && running ? '👉' : `${i + 1}.`}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="#3B82F6" strokeWidth="7"
            strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - progress / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-gray-700">{timeLeft}</span>
        </div>
      </div>
      <p className="text-sm text-gray-400">Exercise {current + 1} of {EXERCISES.length}</p>
      <motion.button onClick={() => setRunning(r => !r)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        className={`px-10 py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${running ? 'bg-gradient-to-r from-red-400 to-rose-500 shadow-rose-100' : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-100'}`}>
        {running ? '⏸ Pause' : current === 0 && timeLeft === ex.duration ? '▶ Start Stretches' : '▶ Resume'}
      </motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🌟 MINDFUL MOMENT
// ─────────────────────────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  "You are doing better than you think. 🌟", "Rest is productive. You deserve to pause. 🍃",
  "Your feelings are valid. Take it one moment at a time. 💙", "You've gotten through every hard day so far. 💪",
  "Small steps still count as progress. 🐢", "Being kind to yourself is not weakness. It's wisdom. 🌸",
  "You matter more than you know. 🌻", "Today doesn't define you. Tomorrow is a fresh start. ✨",
  "Breathe. You are exactly where you need to be. 🧘", "You are allowed to feel what you're feeling. 🤍",
  "Growth is happening even when you can't see it. 🌱", "You showed up today — that counts for everything. ⭐",
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
      <div className="flex bg-gray-100 rounded-2xl p-1 self-center gap-1">
        {(['affirmations', 'gratitude'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-white shadow text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {t === 'affirmations' ? '🌟 Affirmations' : '🙏 Gratitude'}
          </button>
        ))}
      </div>

      {tab === 'affirmations' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-sm overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={affIndex} initial={{ x: affDir * 50, opacity: 0, scale: 0.96 }} animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: affDir * -50, opacity: 0, scale: 0.96 }} transition={{ duration: 0.28 }}
                className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border border-violet-100 rounded-3xl p-8 text-center shadow-sm min-h-28 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-3 right-4 text-4xl opacity-10 select-none">✦</div>
                <div className="absolute bottom-3 left-4 text-3xl opacity-10 select-none">✦</div>
                <p className="text-gray-700 font-semibold text-[15px] leading-relaxed relative z-10">{AFFIRMATIONS[affIndex]}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-1.5">
            {AFFIRMATIONS.map((_, i) => (
              <motion.div key={i} animate={{ scale: i === affIndex ? 1.4 : 1, backgroundColor: i === affIndex ? '#7C3AED' : '#E5E7EB' }}
                className="w-1.5 h-1.5 rounded-full" transition={{ duration: 0.2 }} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.button onClick={prevAff} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">‹</motion.button>
            <motion.button onClick={() => setSaved(s => s.includes(affIndex) ? s.filter(x => x !== affIndex) : [...s, affIndex])}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${saved.includes(affIndex) ? 'bg-pink-100 text-pink-600 ring-1 ring-pink-300' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}>
              {saved.includes(affIndex) ? '❤️ Saved' : '🤍 Save this'}
            </motion.button>
            <motion.button onClick={nextAff} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold">›</motion.button>
          </div>
        </div>
      )}

      {tab === 'gratitude' && (
        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
          <p className="text-sm text-gray-500 text-center">Write 3 things you're grateful for today 🙏</p>
          {gratitude.map((val, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-3 py-2 shadow-sm">
              <span className="text-xl flex-shrink-0">{['🌻', '💙', '✨'][i]}</span>
              <input value={val} onChange={e => setGratitude(g => g.map((v, j) => j === i ? e.target.value : v))}
                placeholder={["I'm grateful for…", "Something good today…", "A person I appreciate…"][i]}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300 bg-transparent focus:outline-none font-medium" />
            </div>
          ))}
          {gratitude.some(v => v.trim()) && !gratitudeSaved && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setGratitudeSaved(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm shadow-md">
              Save my gratitude 💜
            </motion.button>
          )}
          <AnimatePresence>
            {gratitudeSaved && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl p-4 border border-violet-100">
                <p className="text-xs font-bold text-violet-600 mb-2">💜 Saved:</p>
                {gratitude.filter(v => v.trim()).map((v, i) => <p key={i} className="text-xs text-gray-600 py-0.5">• {v}</p>)}
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
// Mood Logger
// ─────────────────────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { score: 10, emoji: '🤩', label: 'Amazing' }, { score: 8, emoji: '😄', label: 'Great' },
  { score: 6,  emoji: '😊', label: 'Good'    }, { score: 5, emoji: '😐', label: 'Okay'  },
  { score: 3,  emoji: '😔', label: 'Low'     }, { score: 1, emoji: '😰', label: 'Really bad' },
];

interface MoodLoggerProps { onLog: (score: number) => void; }

const MoodLogger: React.FC<MoodLoggerProps> = ({ onLog }) => {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden border border-blue-100 shadow-lg shadow-blue-50"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 50%, #FFF 100%)' }}>
      <div className="px-6 pt-8 pb-6">
        <div className="text-center mb-7">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }} className="text-5xl mb-3">💙</motion.div>
          <h2 className="text-xl font-black text-gray-800 mb-1">How are you feeling?</h2>
          <p className="text-sm text-gray-400">We'll personalise your Recharge Zone based on your mood</p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-7">
          {MOOD_OPTIONS.map(({ score, emoji, label }) => (
            <motion.button key={score} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.93 }}
              onClick={() => setSelected(prev => prev === score ? null : score)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selected === score ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'}`}>
              <motion.span animate={{ scale: selected === score ? 1.2 : 1 }} className="text-3xl">{emoji}</motion.span>
              <span className="text-xs font-bold text-gray-600">{label}</span>
            </motion.button>
          ))}
        </div>
        <div className="flex justify-center">
          <AnimatePresence>
            {selected !== null ? (
              <motion.button
                key="confirm"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.04 }}
                onClick={() => onLog(selected)}
                className="px-10 py-3.5 rounded-2xl font-bold text-white text-base shadow-xl transition-all bg-gradient-to-r from-blue-500 to-violet-500 shadow-blue-200 cursor-pointer"
              >
                Open Recharge Zone ✨
              </motion.button>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-10 py-3.5 rounded-2xl font-bold text-gray-400 text-base bg-gray-100 cursor-not-allowed select-none"
              >
                Pick a mood first
              </motion.div>
            )}
          </AnimatePresence>
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
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-3">
      <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-lg">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-700">{stats.activitiesVisited.length} of {total} activities explored</span>
            <span className="text-xs text-gray-400 font-medium">{mins > 0 ? `${mins}m ` : ''}{elapsed % 60}s</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
              animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
        {stats.activitiesVisited.length >= total && <span className="text-sm font-bold text-emerald-600">🌟</span>}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ★ ACTIVITY SELECTOR — compact, centered, premium pill layout
// ─────────────────────────────────────────────────────────────────────────────
interface ActivitySelectorProps {
  activities: ActivityId[];
  activeActivity: ActivityId | null;
  visited: ActivityId[];
  onSelect: (id: ActivityId) => void;
}

const ActivitySelector: React.FC<ActivitySelectorProps> = ({ activities, activeActivity, visited, onSelect }) => {
  return (
    // Outer centering wrapper — hugs content, never full-width
    <div className="flex flex-col items-center gap-3 py-4 px-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended for you</p>

      {/* Card grid — fixed-width pill cluster, always centered */}
      <div
        className="grid gap-2.5"
        style={{
          // 2 columns for ≤3 activities, 2 columns otherwise (keeps grid tight)
          gridTemplateColumns: `repeat(${Math.min(activities.length, 2)}, minmax(0, 1fr))`,
          width: 'fit-content',
          maxWidth: 320,
        }}
      >
        {activities.map((id, i) => {
          const a = ACTIVITY_CONFIG[id];
          const isActive = activeActivity === id;
          const hasVisited = visited.includes(id);

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(id)}
              className="relative flex flex-col items-start gap-1 rounded-2xl border-2 text-left cursor-pointer overflow-hidden transition-all"
              style={{
                width: 148,
                padding: '14px 14px 12px',
                background: isActive
                  ? `linear-gradient(145deg, ${a.gradFrom}, ${a.gradTo})`
                  : '#FFFFFF',
                borderColor: isActive ? a.ring : '#E5E7EB',
                boxShadow: isActive
                  ? `0 6px 20px ${a.ring}33, 0 2px 8px ${a.ring}22`
                  : '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {/* Visited checkmark */}
              {hasVisited && !isActive && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-400 rounded-full text-white text-[8px] flex items-center justify-center font-bold shadow-sm">✓</span>
              )}

              {/* Active glow ring */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${a.ring}55` }}
                />
              )}

              {/* Emoji + tag row */}
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span
                  className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? `${a.ring}22` : '#F3F4F6',
                    color: isActive ? a.ring : '#9CA3AF',
                  }}
                >
                  {a.tag}
                </span>
              </div>

              {/* Label */}
              <span className="text-xs font-black text-gray-800 leading-tight">{a.label}</span>
              {/* Description */}
              <span className="text-[10px] text-gray-400 leading-tight">{a.desc}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ★ ACTIVE EXPERIENCE PANEL — centered, max-width constrained, visually grouped
// ─────────────────────────────────────────────────────────────────────────────
interface ActivityPanelProps {
  activityId: ActivityId;
  onClose: () => void;
  onBreathingCycle: () => void;
  onStretchComplete: () => void;
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ activityId, onClose, onBreathingCycle, onStretchComplete }) => {
  const a = ACTIVITY_CONFIG[activityId];

  return (
    <motion.div
      key={activityId}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      // ↓ Centered container with max-width so it never stretches full card width
      className="flex justify-center px-4 pb-5"
    >
      <div
        className="w-full rounded-2xl overflow-hidden shadow-lg"
        style={{
          maxWidth: 420,
          // Subtle gradient border effect via box-shadow
          boxShadow: `0 0 0 1.5px ${a.ring}33, 0 8px 32px ${a.ring}18, 0 2px 8px rgba(0,0,0,0.06)`,
          background: '#FFFFFF',
        }}
      >
        {/* Panel header — minimal inline label, no wide colored strip */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{a.emoji}</span>
            <span className="text-sm font-black text-gray-700">{a.label}</span>
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: `${a.ring}18`, color: a.ring }}
            >
              {a.tag}
            </span>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold transition-colors">
            ✕
          </motion.button>
        </div>
        <div className="mx-4 h-px bg-gray-100" />

        {/* Activity content */}
        <div className="px-3">
          {activityId === 'breathing' && <BreathingExercise onCycleComplete={onBreathingCycle} />}
          {activityId === 'game'      && <BubbleGame />}
          {activityId === 'jokes'     && <JokesAndFacts />}
          {activityId === 'stretch'   && <QuickStretch onComplete={onStretchComplete} />}
          {activityId === 'music'     && <MindfulMoment />}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WELLNESS ACTIVITIES — main orchestrator
// ─────────────────────────────────────────────────────────────────────────────
interface WellnessActivitiesProps { moodScore: number; onRelog?: () => void; }

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
      setSession(s => ({
        ...s,
        activitiesVisited: s.activitiesVisited.includes(id) ? s.activitiesVisited : [...s.activitiesVisited, id],
      }));
      if (!session.activitiesVisited.includes(id) && session.activitiesVisited.length >= 1) {
        if (encouragementTimer.current) clearTimeout(encouragementTimer.current);
        setShowEncouragement(true);
        encouragementTimer.current = setTimeout(() => setShowEncouragement(false), 3000);
      }
      return id;
    });
  };

  const handleBreathingCycle = useCallback(() => setSession(s => ({ ...s, breathingCycles: s.breathingCycles + 1 })), []);
  const handleStretchComplete = useCallback(() => setSession(s => ({ ...s, stretchesDone: s.stretchesDone + 1 })), []);

  return (
    <>
      <FloatingEncouragement visible={showEncouragement} />

      {/*
        ┌────────────────────────────────────────────────────────────────────┐
        │  PAGE SHELL — centers the entire wellness card on all screen sizes │
        │  min-h-screen + flex centers vertically too; py for breathing room │
        └────────────────────────────────────────────────────────────────────┘
      */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col items-center justify-start py-8 px-4">

        {/*
          ┌──────────────────────────────────────────────────────────────────┐
          │  MAIN CARD — max-width 480px, never stretches beyond that        │
          │  All sections (mood header, activity selector, expanded panel)   │
          │  live inside this single constrained card.                       │
          └──────────────────────────────────────────────────────────────────┘
        */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-100"
          style={{ maxWidth: 480, background: 'linear-gradient(160deg,#FAFAFA 0%,#F8F9FF 100%)' }}
        >
          {/* ── Mood header band ── */}
          <div className="px-6 pt-6 pb-5"
            style={{ background: `linear-gradient(135deg, ${moodMeta.gradFrom}, ${moodMeta.gradTo})` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="text-4xl">{moodMeta.emoji}</motion.span>
                <div>
                  <h2 className="text-base font-black text-gray-800">{moodMeta.label}</h2>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: moodMeta.textAccent }}>{moodMeta.subLabel}</p>
                </div>
              </div>
              {onRelog && (
                <button onClick={onRelog}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl transition-all border border-white/40">
                  Re-log mood
                </button>
              )}
            </div>
          </div>

          {/* ── Session progress banner ── */}
          <div className="px-4 pt-4">
            <SessionBanner stats={session} total={activities.length} />
          </div>

          {/*
            ── Activity Selector ──
            Compact, centered pill grid — extracted to its own component.
            The grid uses fit-content + max-width so it never spans full card width.
          */}
          <ActivitySelector
            activities={activities}
            activeActivity={activeActivity}
            visited={session.activitiesVisited}
            onSelect={openActivity}
          />

          {/*
            ── Expanded Activity Panel ──
            Slides in below the selector, constrained to max-width 420px and
            centered. Visually grouped with the selector via matching rounded
            corners and accent color ring.
          */}
          <AnimatePresence mode="wait">
            {activeActivity && (
              <ActivityPanel
                key={activeActivity}
                activityId={activeActivity}
                onClose={() => setActiveActivity(null)}
                onBreathingCycle={handleBreathingCycle}
                onStretchComplete={handleStretchComplete}
              />
            )}
          </AnimatePresence>

          {/* ── Session stats footer ── */}
          {(session.breathingCycles > 0 || session.stretchesDone > 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex gap-4 flex-wrap">
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
                    {session.activitiesVisited.length >= activities.length ? "🌟 Full session complete!" : `${session.activitiesVisited.length} activit${session.activitiesVisited.length === 1 ? 'y' : 'ies'} tried`}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — public API unchanged
// ─────────────────────────────────────────────────────────────────────────────
const WellnessZone: React.FC<WellnessZoneProps> = ({ moodScore: moodScoreProp }) => {
  const [loggedScore, setLoggedScore] = useState<number | null>(null);
  const moodScore = moodScoreProp ?? loggedScore;

  if (moodScore === null || moodScore === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full" style={{ maxWidth: 420 }}>
          <MoodLogger onLog={setLoggedScore} />
        </div>
      </div>
    );
  }

  return <WellnessActivities moodScore={moodScore} onRelog={() => setLoggedScore(null)} />;
};

export default WellnessZone;
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, RotateCcw, Heart, AlertTriangle, Minus, Sparkles } from "lucide-react";
import { mlChatbotService, ChatMessage as MLChatMessage } from "../../services/mlChatbotService";
import { useChatbot, Message } from "../../contexts/ChatbotContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InteractiveChatbotProps {
  userProfile?: {
    name?: string;
    age?: number;
    previousAssessments?: any[];
    moodHistory?: any[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const TYPING_MIN = 800;
const TYPING_MAX = 1400;

// ─────────────────────────────────────────────────────────────────────────────
//  SMART RESPONSE LAYER
//  The mlChatbotService has several bugs:
//    1. Substring matching — 'end' inside 'boyfriend', 'die' inside 'diet', etc.
//       → incorrectly fires crisis intent
//    2. Sentiment inversion — "not great" scores as positive because it finds
//       the word "great" but ignores "not"
//    3. Generic quick replies that don't relate to what was said
//  This layer sits in front of the ML service and corrects those issues.
// ─────────────────────────────────────────────────────────────────────────────

// Words that must match as WHOLE WORDS only to count as crisis
const REAL_CRISIS_PHRASES = [
  /\b(suicid\w*)\b/i,
  /\bkill\s+(my)?self\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bwish\s+i\s+was\s+dead\b/i,
  /\bend\s+(my|it\s+all|everything)\b/i,
  /\bcan't\s+go\s+on\b/i,
  /\bno\s+(reason|point)\s+to\s+live\b/i,
  /\bhurt\s+myself\b/i,
  /\bself[\s-]?harm\b/i,
];

// Negation-aware sentiment scoring — the ML misses "not great", "not good" etc.
const NEGATION_WORDS = ["not", "never", "no", "don't", "didn't", "can't", "won't", "isn't", "aren't", "wasn't"];

// Distress signals the ML misses — short venting, swearing, heartbreak phrases
const DISTRESS_SIGNALS = [
  /\b(fuck|shit|damn|crap|ugh|argh)\b/i,
  /broke\s+up/i,
  /breaking\s+up/i,
  /heart\s*break/i,
  /heartbroken/i,
  /\b(hate\s+(my|this|everything|life))\b/i,
  /\bfeeling\s+(lost|empty|numb|broken|worthless)\b/i,
  /\b(i\s+can't\s+(do|take|handle)\s+(this|it|anymore))\b/i,
  /\bno\s+one\s+(cares|understands|loves)\b/i,
  /\b(miss\s+(him|her|them|you))\b/i,
  /\b(alone|lonely|isolated)\b/i,
];

// Positive signals the ML overcounts (it finds 'good' even in 'not good')
function hasNegation(text: string, targetWord: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  const idx = words.findIndex(w => w.includes(targetWord.toLowerCase()));
  if (idx === -1) return false;
  for (let i = Math.max(0, idx - 3); i < idx; i++) {
    if (NEGATION_WORDS.includes(words[i])) return true;
  }
  return false;
}

interface SmartResult {
  response: string;
  intent: string;
  sentiment: number;
  quickReplies: string[];
  isCrisis: boolean;
}

async function getSmartResponse(
  userText: string,
  mlHistory: MLChatMessage[],
  userName?: string
): Promise<SmartResult> {
  const lower = userText.toLowerCase().trim();

  // ── 1. Real crisis detection (whole-word / phrase matching) ──────────────
  const isCrisis = REAL_CRISIS_PHRASES.some(rx => rx.test(userText));

  // ── 2. Distress detection (things the ML misses) ─────────────────────────
  const isDistressed = DISTRESS_SIGNALS.some(rx => rx.test(userText));

  // ── 3. Negation-aware short-phrase override ───────────────────────────────
  // For very short inputs (≤5 words), the ML's keyword scan is unreliable.
  // We score these manually.
  const wordCount = lower.split(/\s+/).length;
  let manualSentiment: number | null = null;

  if (wordCount <= 6) {
    const positiveWords = ["good", "great", "amazing", "fantastic", "wonderful", "excellent", "happy", "fine", "okay", "well"];
    const negativeWords = ["bad", "awful", "terrible", "horrible", "sad", "depressed", "anxious", "tired", "exhausted", "low", "down", "struggling", "rough", "hard"];

    let score = 0;
    for (const w of positiveWords) {
      if (lower.includes(w)) {
        score += hasNegation(lower, w) ? -0.6 : 0.6;
      }
    }
    for (const w of negativeWords) {
      if (lower.includes(w)) {
        score += hasNegation(lower, w) ? 0.3 : -0.6;
      }
    }
    if (score !== 0) manualSentiment = Math.max(-1, Math.min(1, score));
  }

  // ── 4. Override crisis intent if it's a false positive ───────────────────
  // Call ML service to get its response, then patch it.
  let mlResult: Awaited<ReturnType<typeof mlChatbotService.processMessage>>;
  try {
    mlResult = await mlChatbotService.processMessage(userText, mlHistory);
  } catch {
    return {
      response: "I'm having a little trouble right now — could you say that again? I really want to be here for you. 💙",
      intent: "error",
      sentiment: 0,
      quickReplies: ["Sure", "I'm feeling…", "I need support"],
      isCrisis: false,
    };
  }

  // Patch: if ML says crisis but our real-crisis check disagrees → treat as distress/sharing
  let intent = mlResult.intent;
  if (intent === "crisis" && !isCrisis) {
    intent = isDistressed ? "sharing" : "general";
  }

  // Patch: use our manual sentiment for short inputs when ML got it wrong
  const finalSentiment = manualSentiment !== null ? manualSentiment : mlResult.sentiment;

  // ── 5. Build the response ─────────────────────────────────────────────────

  let response = mlResult.response;

  // Patch: if ML gave a "positive" response but sentiment is actually negative → override
  const mlSaysPositive =
    response.toLowerCase().includes("so glad to hear") ||
    response.toLowerCase().includes("wonderful") ||
    response.toLowerCase().includes("fantastic that") ||
    response.toLowerCase().includes("i'm happy to hear");

  if (mlSaysPositive && (finalSentiment < -0.2 || isDistressed)) {
    // Build a proper empathetic response
    if (isDistressed) {
      const breakupMatch = /broke\s+up|breaking\s+up|heartbroken|heartbreak/i.test(userText);
      const ventingMatch = /\b(fuck|shit|damn|ugh)\b/i.test(userText);

      if (breakupMatch) {
        response = "Oh, I'm so sorry. Breakups are genuinely painful — it's completely okay to feel hurt and upset right now. There's no timeline on grief, and whatever you're feeling is valid. Do you want to talk about it?";
      } else if (ventingMatch) {
        response = "Hey, I hear you — it sounds like things feel really overwhelming right now. You don't have to hold it together here. What's going on?";
      } else {
        response = "I'm sorry you're going through something hard. I'm right here and I want to understand what's happening for you. Can you tell me more about what's on your mind?";
      }
    } else {
      // Negation case like "not great", "not good"
      const negPhrases: Record<string, string> = {
        "not great": "I hear you — 'not great' can mean a lot of things. What's been making things feel that way?",
        "not good": "I'm sorry to hear that. What's been going on that's making things feel not so good?",
        "not okay": "Thank you for being honest with me. It's okay to not be okay — want to tell me what's happening?",
        "not fine": "I hear that things aren't feeling fine right now. I'm here — would you like to share more?",
        "feeling bad": "I'm sorry you're feeling bad. I want to understand — is it more of a physical thing, an emotional thing, or both?",
        "pretty bad": "That sounds rough. I'm really glad you told me — can you share a bit more about what's making things feel that way?",
      };
      for (const [phrase, reply] of Object.entries(negPhrases)) {
        if (lower.includes(phrase)) {
          response = reply;
          break;
        }
      }
      if (mlSaysPositive && finalSentiment < -0.2) {
        // Still wrong — generic negative override
        response = "I hear that things aren't feeling great right now, and that's completely okay to say. I'm here to listen — would you like to share more about what's been going on?";
      }
    }
  }

  // ── 6. Build contextual quick replies ────────────────────────────────────
  //  The ML returns generic ones. We replace them based on what was said.
  let quickReplies: string[];

  if (isCrisis) {
    quickReplies = ["I'm safe right now", "I need to talk to someone", "Tell me more about 988", "Thank you"];
  } else if (/broke\s+up|breaking\s+up|heartbroken/i.test(userText)) {
    quickReplies = ["I'm really sad about it", "I'm angry", "I feel numb", "I don't know how to cope", "I need distraction"];
  } else if (/\b(fuck|shit|damn|ugh|overwhelmed|can't take)\b/i.test(userText)) {
    quickReplies = ["I just needed to vent", "Everything feels like too much", "I need some advice", "Talk me through this"];
  } else if (/\b(anxious|anxiety|worried|panic|nervous|stress)\b/i.test(userText)) {
    quickReplies = ["Can you guide me through breathing?", "It's been happening a lot lately", "I don't know what triggered it", "I need grounding techniques"];
  } else if (/\b(sad|depressed|hopeless|empty|numb|lonely)\b/i.test(userText)) {
    quickReplies = ["I've felt this way for a while", "I don't know why I feel this way", "I want to feel better", "I just need someone to listen"];
  } else if (/\b(tired|exhausted|drained|no energy)\b/i.test(userText)) {
    quickReplies = ["I haven't been sleeping well", "Everything feels like an effort", "I feel burnt out", "I just need rest"];
  } else if (finalSentiment > 0.3) {
    quickReplies = ["Things have been going well lately", "I want to maintain this feeling", "I've been working on myself", "Tell me more about wellness"];
  } else if (finalSentiment < -0.3 || isDistressed) {
    quickReplies = ["I want to talk more about it", "I'm not sure where to start", "I've been feeling this way for a while", "I need some support"];
  } else {
    // Neutral — use the ML's own suggestions if they're decent, otherwise generic
    const mlReplies = mlResult.followUpQuestions?.slice(0, 4) ?? [];
    const filteredMlReplies = mlReplies.filter(r => r.length < 50 && !r.includes("assessment"));
    quickReplies = filteredMlReplies.length >= 2
      ? filteredMlReplies
      : ["I want to share something", "I've been struggling lately", "I'm doing okay actually", "Tell me something calming"];
  }

  return {
    response,
    intent,
    sentiment: finalSentiment,
    quickReplies,
    isCrisis,
  };
}

// ─── Avatars ──────────────────────────────────────────────────────────────────

const BotAvatar: React.FC<{ live?: boolean }> = ({ live }) => (
  <div className="relative flex-shrink-0">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
      <Heart size={14} className="text-white fill-white" />
    </div>
    {live && (
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary-400 border-2 border-white" />
    )}
  </div>
);

const UserAvatar: React.FC<{ name?: string }> = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-sm flex-shrink-0">
    <span className="text-white text-xs font-semibold">
      {name ? name[0].toUpperCase() : "U"}
    </span>
  </div>
);

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <motion.div
    className="flex items-end gap-2 mb-3"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
  >
    <BotAvatar />
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft">
      <div className="flex gap-1 items-center h-4">
        {[0, 150, 300].map((delay) => (
          <motion.span
            key={delay}
            className="w-2 h-2 rounded-full bg-primary-300"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: delay / 1000 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// ─── Quick reply chip ─────────────────────────────────────────────────────────

const QuickReplyChip: React.FC<{ label: string; onClick: () => void; disabled: boolean }> = ({
  label, onClick, disabled,
}) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className="text-xs px-3 py-1.5 rounded-full border border-primary-200 text-primary-600 bg-white hover:bg-primary-50 hover:border-primary-400 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    whileHover={{ scale: disabled ? 1 : 1.04 }}
    whileTap={{ scale: disabled ? 1 : 0.96 }}
  >
    {label}
  </motion.button>
);

// ─── Crisis banner ────────────────────────────────────────────────────────────

const CrisisBanner: React.FC = () => (
  <div className="bg-red-50 border-l-4 border-red-400 px-4 py-3 mx-3 my-2 rounded-r-xl flex items-start gap-2 flex-shrink-0">
    <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-red-700 leading-snug">
      <strong>If you're in immediate danger:</strong> call <strong>911</strong> or the Suicide &amp; Crisis Lifeline at <strong>988</strong>.
    </p>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center shadow-soft"
    >
      <Heart size={28} className="text-primary-500 fill-primary-200" />
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h4 className="font-semibold text-gray-700 text-base mb-1">Hey, I'm here for you 💙</h4>
      <p className="text-gray-400 text-xs leading-relaxed">
        Your safe, judgement-free space to talk about how you're really feeling.
      </p>
    </motion.div>
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
      onClick={onStart}
      className="mt-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 active:scale-95"
    >
      Start a conversation
    </motion.button>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[10px] text-gray-300">
      Not a licensed therapist · wellness support only
    </motion.p>
  </div>
);

// ─── Bold markdown renderer ───────────────────────────────────────────────────

const renderText = (text: string): React.ReactNode =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );

// ─── Sentiment dot ────────────────────────────────────────────────────────────

const SentimentDot: React.FC<{ sentiment?: number }> = ({ sentiment }) => {
  if (sentiment === undefined) return null;
  const color = sentiment > 0.3 ? "bg-secondary-400" : sentiment < -0.3 ? "bg-red-400" : "bg-warning-500";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} ml-1 align-middle`} />;
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({ userProfile }) => {
  const {
    isOpen, closeChatbot, openChatbot,
    messages, addMessage, clearMessages,
    setConversationPhase,
    unreadCount, resetUnread,
    sessionStarted, setSessionStarted,
  } = useChatbot();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([]);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) { resetUnread(); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [isOpen]);

  useEffect(() => {
    mlChatbotService.initialize().catch(console.error);
    if (userProfile) mlChatbotService.updateUserProfile(userProfile);
  }, []);

  // ── Add bot message with natural typing delay ─────────────────────────────

  const addBotMessage = useCallback(async (
    text: string,
    quickReplies?: string[],
    intent?: string,
    sentiment?: number,
  ) => {
    setIsTyping(true);
    const delay = TYPING_MIN + Math.random() * (TYPING_MAX - TYPING_MIN);
    await new Promise(r => setTimeout(r, delay));
    setIsTyping(false);
    addMessage({ id: uid(), text, sender: "bot", timestamp: new Date(), quickReplies, intent, sentiment });
    setActiveQuickReplies(quickReplies?.length ? quickReplies : []);
  }, [addMessage]);

  // ── Start session ─────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    if (sessionStarted) return;
    setSessionStarted(true);
    setConversationPhase("greeting");
    const name = userProfile?.name;
    const greeting = name
      ? `Hey ${name} 💙 I'm really glad you're here. This is your safe, judgement-free space — no pressure, just support. How are you feeling right now?`
      : `Hey there 💙 I'm your wellness companion. Whether you're having a great day or a really tough one, I'm here to listen — no judgement, no pressure. How are you feeling today?`;
    await addBotMessage(
      greeting,
      ["Amazing 😊", "Pretty good", "Just okay", "Not great", "Really struggling", "Anxious", "Exhausted"],
      "greeting", 0
    );
  }, [sessionStarted, userProfile, addBotMessage]);

  // ── Core message handler ──────────────────────────────────────────────────

  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping) return;

    setInput("");
    setActiveQuickReplies([]);

    addMessage({ id: uid(), text, sender: "user", timestamp: new Date() });
    if (!sessionStarted) setSessionStarted(true);

    const mlHistory: MLChatMessage[] = messages.map(m => ({
      id: m.id, text: m.text, sender: m.sender as "user" | "bot", timestamp: m.timestamp,
    }));

    const result = await getSmartResponse(text, mlHistory, userProfile?.name);

    // Update phase
    if (result.isCrisis) {
      setShowCrisisBanner(true);
      setConversationPhase("crisis");
    } else if (result.sentiment < -0.4) {
      setConversationPhase("support");
    } else if (result.intent === "assessment_response") {
      setConversationPhase("assessment");
    }

    await addBotMessage(result.response, result.quickReplies, result.intent, result.sentiment);

    // Crisis resource card
    if (result.isCrisis) {
      await addBotMessage(
        "🆘 **Immediate support lines:**\n\n• Suicide & Crisis Lifeline: **988** (call or text)\n• Crisis Text Line: text **HOME** to 741741\n• Emergency Services: **911**\n\nYou are not alone — please reach out. 💙",
        ["I'm safe right now", "I want to talk to someone", "Thank you"],
        "crisis", -1
      );
    }
  }, [input, isTyping, messages, sessionStarted, userProfile, addMessage, addBotMessage]);

  const handleQuickReply = useCallback((text: string) => {
    setActiveQuickReplies([]);
    handleSendMessage(text);
  }, [handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleReset = () => {
    clearMessages();
    mlChatbotService.clearConversationContext();
    setShowCrisisBanner(false);
    setActiveQuickReplies([]);
    setInput("");
    setConversationPhase("idle");
  };

  const hasMessages = messages.length > 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => isOpen ? closeChatbot() : openChatbot()}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-medium flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:shadow-chat transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
        whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
        aria-label="Open wellness chat"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={22} /></motion.span>
            : <motion.span key="h" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Heart size={22} className="fill-white" /></motion.span>
          }
        </AnimatePresence>

        <AnimatePresence>
          {!isOpen && unreadCount > 0 && (
            <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.span className="absolute inset-0 rounded-full border-2 border-primary-400"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }} />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat"
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-chat border border-gray-100 bg-gray-50"
            style={{
              bottom: "88px", right: "24px",
              width: "min(380px, calc(100vw - 32px))",
              height: isMinimized ? "auto" : "min(620px, calc(100vh - 120px))",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Heart size={16} className="fill-white text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">MindfulBot</p>
                  <p className="text-[10px] text-white/75">
                    {isTyping
                      ? <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>thinking…</motion.span>
                      : "Wellness companion · always here"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleReset} title="New conversation" className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><RotateCcw size={14} /></button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><Minus size={14} /></button>
                <button onClick={closeChatbot} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><X size={14} /></button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Crisis banner */}
                <AnimatePresence>
                  {showCrisisBanner && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0">
                      <CrisisBanner />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto px-3 py-4 min-h-0"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#C0DFFF transparent" }}
                >
                  {!hasMessages ? (
                    <EmptyState onStart={startSession} />
                  ) : (
                    <>
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-end gap-2 mb-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {msg.sender === "bot"
                            ? <BotAvatar live={idx === messages.length - 1 && !isTyping} />
                            : <UserAvatar name={userProfile?.name} />
                          }
                          <div className={`
                            relative max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-soft
                            ${msg.sender === "user"
                              ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-sm"
                              : msg.intent === "crisis"
                              ? "bg-red-50 text-red-700 border border-red-100 rounded-2xl rounded-bl-sm"
                              : "bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm"
                            }
                          `}>
                            <p className="whitespace-pre-wrap break-words">{renderText(msg.text)}</p>
                            <div className="flex items-center justify-end gap-1 mt-1.5">
                              <span className="text-[10px] opacity-40">{formatTime(msg.timestamp)}</span>
                              {msg.sender === "bot" && <SentimentDot sentiment={msg.sentiment} />}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Quick replies */}
                <AnimatePresence>
                  {activeQuickReplies.length > 0 && !isTyping && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex-shrink-0 overflow-hidden border-t border-gray-100 bg-white"
                    >
                      <div className="flex gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar">
                        {activeQuickReplies.map(r => (
                          <QuickReplyChip key={r} label={r} onClick={() => handleQuickReply(r)} disabled={isTyping} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all duration-150">
                    <Sparkles size={14} className="text-primary-300 flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={sessionStarted ? "Share what's on your mind…" : "Say hello to get started…"}
                      disabled={isTyping}
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:opacity-50 min-w-0"
                    />
                    <motion.button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isTyping}
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    >
                      <Send size={13} />
                    </motion.button>
                  </div>
                  <p className="text-[10px] text-center text-gray-300 mt-1.5">
                    Not a licensed therapist · for wellness support only
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InteractiveChatbot;
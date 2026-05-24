import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  RotateCcw,
  Heart,
  AlertTriangle,
  Minus,
  Sparkles,
} from "lucide-react";
import { mlChatbotService, ChatMessage as MLChatMessage } from "../../services/mlChatbotService";
import { useChatbot, Message } from "../../contexts/ChatbotContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const TYPING_DELAY_BASE = 900;
const TYPING_DELAY_VARIANCE = 700;

// ─── Props ────────────────────────────────────────────────────────────────────

interface InteractiveChatbotProps {
  userProfile?: {
    name?: string;
    age?: number;
    previousAssessments?: any[];
    moodHistory?: any[];
  };
}

// ─── Bot Avatar ───────────────────────────────────────────────────────────────

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

// ─── User Avatar ──────────────────────────────────────────────────────────────

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
    transition={{ duration: 0.2 }}
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

const QuickReplyChip: React.FC<{
  label: string;
  onClick: () => void;
  disabled: boolean;
}> = ({ label, onClick, disabled }) => (
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
  <div className="bg-error-50 border-l-4 border-error-500 px-4 py-3 mx-3 my-2 rounded-r-xl flex items-start gap-2 flex-shrink-0">
    <AlertTriangle size={15} className="text-error-500 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-error-600 leading-snug">
      <strong>If you're in immediate danger:</strong> call{" "}
      <strong>911</strong> or the Suicide & Crisis Lifeline at <strong>988</strong>.
    </p>
  </div>
);

// ─── Empty / welcome state ────────────────────────────────────────────────────

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

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h4 className="font-semibold text-gray-700 text-base mb-1">
        Hey, I'm here for you 💙
      </h4>
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

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-[10px] text-gray-300"
    >
      Not a licensed therapist · wellness support only
    </motion.p>
  </div>
);

// ─── Bold markdown renderer ───────────────────────────────────────────────────

const renderText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

// ─── Sentiment dot ────────────────────────────────────────────────────────────

const SentimentDot: React.FC<{ sentiment?: number }> = ({ sentiment }) => {
  if (sentiment === undefined) return null;
  const color =
    sentiment > 0.3
      ? "bg-secondary-400"   // green = positive
      : sentiment < -0.3
      ? "bg-error-500"       // red = negative
      : "bg-warning-500";    // amber = neutral
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${color} ml-1 align-middle`}
      title={
        sentiment > 0.3 ? "Positive" : sentiment < -0.3 ? "Negative" : "Neutral"
      }
    />
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({ userProfile }) => {
  const {
    isOpen,
    closeChatbot,
    openChatbot,
    messages,
    addMessage,
    clearMessages,
    setConversationPhase,
    unreadCount,
    resetUnread,
    sessionStarted,
    setSessionStarted,
  } = useChatbot();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([]);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Scroll ────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // ── Reset unread + focus input when opened ────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      resetUnread();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── Init ML service once ──────────────────────────────────────────────────

  useEffect(() => {
    mlChatbotService.initialize().catch(console.error);
    if (userProfile) mlChatbotService.updateUserProfile(userProfile);
  }, []);

  // ── Add a bot message with typing delay ──────────────────────────────────

  const addBotMessage = useCallback(
    async (
      text: string,
      quickReplies?: string[],
      intent?: string,
      sentiment?: number,
      confidence?: number
    ) => {
      setIsTyping(true);
      const delay = TYPING_DELAY_BASE + Math.random() * TYPING_DELAY_VARIANCE;
      await new Promise((r) => setTimeout(r, delay));
      setIsTyping(false);

      addMessage({
        id: uid(),
        text,
        sender: "bot",
        timestamp: new Date(),
        quickReplies,
        intent,
        sentiment,
        confidence,
      });

      setActiveQuickReplies(quickReplies?.length ? quickReplies : []);
    },
    [addMessage]
  );

  // ── Start session (welcome message) ──────────────────────────────────────

  const startSession = useCallback(async () => {
    if (sessionStarted) return;
    setSessionStarted(true);
    setConversationPhase("greeting");

    const name = userProfile?.name;
    const greeting = name
      ? `Hey ${name} 💙 I'm really glad you're here. This is your safe, judgement-free space — no pressure, just support. How are you feeling right now?`
      : `Hey there 💙 I'm your wellness companion. This is a safe, judgement-free space. Whether you're having a great day or a really tough one, I'm here to listen. How are you feeling today?`;

    await addBotMessage(
      greeting,
      ["Amazing 😊", "Pretty good", "Just okay", "Not great", "Really struggling", "Anxious", "Exhausted"]
    );
  }, [sessionStarted, userProfile, addBotMessage]);

  // ── Core send handler ─────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isTyping) return;

      setInput("");
      setActiveQuickReplies([]);

      addMessage({
        id: uid(),
        text,
        sender: "user",
        timestamp: new Date(),
      });

      if (!sessionStarted) setSessionStarted(true);

      try {
        const mlHistory: MLChatMessage[] = messages.map((m) => ({
          id: m.id,
          text: m.text,
          sender: m.sender as "user" | "bot",
          timestamp: m.timestamp,
        }));

        const result = await mlChatbotService.processMessage(text, mlHistory);

        // Update phase
        if (result.intent === "crisis") {
          setShowCrisisBanner(true);
          setConversationPhase("crisis");
        } else if (result.intent === "assessment_response" || result.intent === "greeting") {
          setConversationPhase("assessment");
        } else if (result.sentiment !== undefined && result.sentiment <= -0.4) {
          setConversationPhase("support");
        }

        await addBotMessage(
          result.response,
          result.followUpQuestions?.slice(0, 5),
          result.intent,
          result.sentiment,
          result.confidence
        );

        // Crisis resource card
        if (result.intent === "crisis") {
          await addBotMessage(
            "🆘 **Immediate support:**\n\n• Suicide & Crisis Lifeline: **988**\n• Crisis Text Line: text **HOME** to 741741\n• Emergency Services: **911**\n\nYou are not alone — please reach out. 💙",
            ["I'm safe for now", "I need to talk", "Thank you"],
            "crisis"
          );
        }
      } catch (err) {
        console.error("Chatbot error:", err);
        setIsTyping(false);
        addMessage({
          id: uid(),
          text: "I'm so sorry, I had a little trouble there. Could you try sharing that again? I really want to be here for you. 💙",
          sender: "bot",
          timestamp: new Date(),
        });
      }
    },
    [input, isTyping, messages, sessionStarted, addMessage, addBotMessage]
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      setActiveQuickReplies([]);
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      {/* ── FAB button ── */}
      <motion.button
        onClick={() => (isOpen ? closeChatbot() : openChatbot())}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-medium flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:shadow-chat transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open wellness chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Heart size={22} className="fill-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!isOpen && unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!isOpen && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary-400"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-chat border border-gray-100 bg-gray-50"
            style={{
              bottom: "88px",
              right: "24px",
              width: "min(380px, calc(100vw - 32px))",
              height: isMinimized ? "auto" : "min(620px, calc(100vh - 120px))",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Heart size={16} className="fill-white text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">MindfulBot</p>
                  <p className="text-[10px] text-white/75">
                    {isTyping ? (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        thinking…
                      </motion.span>
                    ) : (
                      "Wellness companion · always here"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  title="New conversation"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Reset conversation"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label={isMinimized ? "Expand" : "Minimise"}
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={closeChatbot}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* ── Crisis banner ── */}
                <AnimatePresence>
                  {showCrisisBanner && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex-shrink-0"
                    >
                      <CrisisBanner />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Messages ── */}
                <div
                  className="flex-1 overflow-y-auto px-3 py-4 min-h-0 scroll-smooth"
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
                          transition={{ duration: 0.22 }}
                          className={`flex items-end gap-2 mb-3 ${
                            msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* Avatar */}
                          {msg.sender === "bot" ? (
                            <BotAvatar live={idx === messages.length - 1} />
                          ) : (
                            <UserAvatar name={userProfile?.name} />
                          )}

                          {/* Bubble */}
                          <div
                            className={`
                              relative max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-soft
                              ${
                                msg.sender === "user"
                                  ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-sm"
                                  : msg.intent === "crisis"
                                  ? "bg-error-50 text-error-600 border border-error-100 rounded-2xl rounded-bl-sm"
                                  : "bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm"
                              }
                            `}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {renderText(msg.text)}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1.5">
                              <span className="text-[10px] opacity-40">
                                {formatTime(msg.timestamp)}
                              </span>
                              {msg.sender === "bot" && (
                                <SentimentDot sentiment={msg.sentiment} />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      <AnimatePresence>
                        {isTyping && <TypingIndicator />}
                      </AnimatePresence>

                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* ── Quick replies ── */}
                <AnimatePresence>
                  {activeQuickReplies.length > 0 && !isTyping && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex-shrink-0 overflow-hidden border-t border-gray-100 bg-white"
                    >
                      <div className="flex gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar">
                        {activeQuickReplies.map((r) => (
                          <QuickReplyChip
                            key={r}
                            label={r}
                            onClick={() => handleQuickReply(r)}
                            disabled={isTyping}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Input ── */}
                <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all duration-150">
                    <Sparkles size={14} className="text-primary-300 flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        sessionStarted
                          ? "Share what's on your mind…"
                          : "Say hello to get started…"
                      }
                      disabled={isTyping}
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:opacity-50 min-w-0"
                    />
                    <motion.button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isTyping}
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Send message"
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

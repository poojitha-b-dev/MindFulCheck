import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  X, 
  Send, 
  Maximize2, 
  Minimize2, 
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Lightbulb,
  Heart,
  AlertTriangle
} from "lucide-react";
import { mlChatbotService, ChatMessage } from "../../services/mlChatbotService";

interface InteractiveChatbotProps {
  userProfile?: {
    name?: string;
    age?: number;
    previousAssessments?: any[];
    moodHistory?: any[];
  };
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({ userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentRecommendations, setCurrentRecommendations] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChatbot();
    }
  }, [isOpen, isInitialized]);

  const initializeChatbot = async () => {
    try {
      await mlChatbotService.initialize();
      
      if (userProfile) {
        mlChatbotService.updateUserProfile(userProfile);
      }

      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        text: userProfile?.name 
          ? `Hello ${userProfile.name}! I'm your AI mental health companion. I'm here to listen, support, and help you on your wellness journey. How are you feeling today?`
          : "Hello! I'm your AI mental health companion. I'm here to provide support, listen to your concerns, and help you with your mental wellness. How are you feeling today?",
        sender: "bot",
        timestamp: new Date(),
        intent: "greeting"
      };

      setMessages([welcomeMessage]);
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize chatbot:", error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await mlChatbotService.processMessage(textToSend, messages);
      
      // Simulate typing delay for more natural interaction
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          sender: "bot",
          timestamp: new Date(),
          sentiment: response.sentiment,
          confidence: response.confidence,
          intent: response.intent
        };

        setMessages(prev => [...prev, botMessage]);
        setCurrentRecommendations(response.recommendations);
        setIsTyping(false);

        // Handle crisis situations
        if (response.intent === 'crisis') {
          setTimeout(() => {
            const crisisMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              text: "I want to make sure you get the immediate help you need. Here are some crisis resources:\n\n🆘 National Suicide Prevention Lifeline: 988\n📱 Crisis Text Line: Text HOME to 741741\n🚨 Emergency Services: 911\n\nPlease don't hesitate to reach out to these resources. You matter, and help is available.",
              sender: "bot",
              timestamp: new Date(),
              intent: "crisis"
            };
            setMessages(prev => [...prev, crisisMessage]);
          }, 2000);
        }
      }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    } catch (error) {
      console.error("Error processing message:", error);
      setIsTyping(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your message right now. Please try again, or if you're in crisis, please contact emergency services immediately.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleRecommendationClick = (recommendation: string) => {
    // Handle different types of recommendations
    if (recommendation.includes("assessment")) {
      window.open("/assessment", "_blank");
    } else if (recommendation.includes("mood tracker")) {
      window.open("/mood-tracker", "_blank");
    } else if (recommendation.includes("breathing")) {
      handleSendMessage("Can you guide me through a breathing exercise?");
    } else if (recommendation.includes("meditation")) {
      handleSendMessage("I'd like to try a guided meditation");
    }
  };

  const getSentimentColor = (sentiment?: number) => {
    if (!sentiment) return "text-gray-500";
    if (sentiment > 0.3) return "text-green-500";
    if (sentiment < -0.3) return "text-red-500";
    return "text-yellow-500";
  };

  const getSentimentIcon = (sentiment?: number) => {
    if (!sentiment) return null;
    if (sentiment > 0.3) return <Heart size={12} className="text-green-500" />;
    if (sentiment < -0.3) return <AlertTriangle size={12} className="text-red-500" />;
    return null;
  };

  const toggleChatbot = () => setIsOpen(!isOpen);
  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      <motion.button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle size={28} />
        {!isOpen && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-[450px] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white border border-gray-200"
            style={{ 
              height: isMinimized ? "auto" : "700px",
              maxHeight: "calc(100vh - 120px)",
              top: "auto",
              bottom: "100px"
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header - Always visible and sticky */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-semibold">AI Mental Health Companion</h3>
                  <p className="text-xs opacity-90">
                    {isTyping ? "Typing..." : "Online • Here to help"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMinimize}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
                <button
                  onClick={toggleChatbot}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages - Scrollable area with proper padding */}
                <div className="flex-grow p-4 overflow-y-auto bg-gray-50 min-h-0" style={{ maxHeight: "500px" }}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`mb-4 flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${
                        message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.sender === "user" 
                            ? "bg-primary-500 text-white" 
                            : "bg-white border-2 border-primary-200 text-primary-600"
                        }`}>
                          {message.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.sender === "user"
                            ? "bg-primary-500 text-white"
                            : message.intent === "crisis"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {message.sender === "bot" && message.sentiment !== undefined && (
                              <div className="flex items-center space-x-1">
                                {getSentimentIcon(message.sentiment)}
                                <span className={`text-xs ${getSentimentColor(message.sentiment)}`}>
                                  {message.confidence && `${Math.round(message.confidence * 100)}%`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div 
                      className="flex justify-start mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-primary-200 text-primary-600 flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse delay-75" />
                            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse delay-150" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Recommendations */}
                {currentRecommendations.length > 0 && (
                  <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
                    <div>
                      <p className="text-xs text-gray-500 mb-2 flex items-center">
                        <Lightbulb size={12} className="mr-1" />
                        Recommendations:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentRecommendations.slice(0, 3).map((rec, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecommendationClick(rec)}
                            className="text-xs bg-secondary-50 text-secondary-700 px-3 py-1 rounded-full hover:bg-secondary-100 transition-colors"
                          >
                            {rec}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Input - Always at bottom */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }} 
                  className="border-t border-gray-200 p-3 bg-white flex-shrink-0"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Share what's on your mind..."
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InteractiveChatbot;
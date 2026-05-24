import React, { createContext, useState, useContext, useCallback } from 'react';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sentiment?: number;
  confidence?: number;
  intent?: string;
  quickReplies?: string[];
  isWelcome?: boolean;
}

export type ConversationPhase = 'idle' | 'greeting' | 'assessment' | 'support' | 'crisis';

interface ChatbotContextType {
  isOpen: boolean;
  toggleChatbot: () => void;
  closeChatbot: () => void;
  openChatbot: () => void;
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  conversationPhase: ConversationPhase;
  setConversationPhase: (phase: ConversationPhase) => void;
  unreadCount: number;
  resetUnread: () => void;
  sessionStarted: boolean;
  setSessionStarted: (v: boolean) => void;
}

const ChatbotContext = createContext<ChatbotContextType | null>(null);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) throw new Error('useChatbot must be used within ChatbotProvider');
  return context;
};

const INITIAL_MESSAGES: Message[] = []; // empty — InteractiveChatbot handles the welcome

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('idle');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  const toggleChatbot = useCallback(() => setIsOpen(prev => !prev), []);
  const closeChatbot = useCallback(() => setIsOpen(false), []);
  const openChatbot = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    if (message.sender === 'bot') {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationPhase('idle');
    setSessionStarted(false);
    setUnreadCount(0);
  }, []);

  const resetUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      toggleChatbot,
      closeChatbot,
      openChatbot,
      messages,
      addMessage,
      clearMessages,
      conversationPhase,
      setConversationPhase,
      unreadCount,
      resetUnread,
      sessionStarted,
      setSessionStarted,
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};
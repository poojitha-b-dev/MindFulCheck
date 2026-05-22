import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InteractiveChatbot from '../chatbot/InteractiveChatbot';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const { currentUser } = useAuth();

  // Prepare user profile for chatbot
  const userProfile = currentUser ? {
    name: currentUser.displayName || undefined,
    // In a real app, you'd fetch this data from your database
    previousAssessments: [],
    moodHistory: []
  } : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
      <InteractiveChatbot userProfile={userProfile} />
    </div>
  );
};

export default Layout;
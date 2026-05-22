import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';   // ← NEW
import VerifyEmailPage from './pages/auth/VerifyEmailPage';          // ← NEW
import DashboardPage from './pages/DashboardPage';
import AssessmentPage from './pages/AssessmentPage';
import MoodTrackerPage from './pages/MoodTrackerPage';
import ResourcesPage from './pages/ResourcesPage';
import ProfilePage from './pages/ProfilePage';
import FindHelpPage from './pages/FindHelpPage';
import WellnessZonePage from './pages/WellnessZonePage';
import { ChatbotProvider } from './contexts/ChatbotContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatbotProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />  {/* ← NEW */}

              {/* Email verification page — requires login but NOT verified email */}
              <Route
                path="verify-email"
                element={
                  <ProtectedRoute requireVerification={false}>
                    <VerifyEmailPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes — require login AND verified email */}
              <Route
                path="dashboard"
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
              />
              <Route
                path="assessment"
                element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>}
              />
              <Route
                path="mood-tracker"
                element={<ProtectedRoute><MoodTrackerPage /></ProtectedRoute>}
              />
              <Route
                path="resources"
                element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>}
              />
              <Route
                path="profile"
                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
              />
              <Route
                path="find-help"
                element={<ProtectedRoute><FindHelpPage /></ProtectedRoute>}
              />
              <Route
                path="wellness"
                element={<ProtectedRoute><WellnessZonePage /></ProtectedRoute>}
              />
            </Route>
          </Routes>
        </ChatbotProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

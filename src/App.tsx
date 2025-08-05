import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { SignInPage } from './pages/auth/SignInPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ConfirmEmailPage } from './pages/auth/ConfirmEmailPage';
import { PlansPage } from './pages/subscription/PlansPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Semi-Protected Routes (require auth but not subscription) */}
            <Route 
              path="/confirm-email" 
              element={
                <ProtectedRoute>
                  <ConfirmEmailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plans" 
              element={
                <ProtectedRoute>
                  <PlansPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Fully Protected Routes (require auth and subscription) */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireSubscription>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requireSubscription>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
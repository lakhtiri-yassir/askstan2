// src/App.tsx - COMPLETE ROUTING FIX: All pages with proper protection
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminProtectedRoute } from './components/layout/AdminProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// FIXED: Import all existing pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Subscription and main app pages
const PlansPage = lazy(() => import('./pages/subscription/PlansPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/checkout/CheckoutSuccessPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Legal pages
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage'));

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Simple placeholder for any missing pages
const ComingSoonPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h1>
      <p className="text-gray-600 mb-6">This page is under development.</p>
      <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
        ← Back to Home
      </a>
    </div>
  </div>
);

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// FIXED: Separate admin routes to avoid admin checks on regular user auth
const AdminRoutes = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route 
          path="/" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />
        {/* Catch-all for admin routes */}
        <Route path="*" element={<AdminLoginPage />} />
      </Routes>
    </Suspense>
  </div>
);

// Regular app routes without admin provider
const AppRoutes = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
    <Header />
    
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Legal pages - public access */}
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        
        {/* Protected Routes - require authentication only */}
        <Route 
          path="/plans" 
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout-success" 
          element={
            <ProtectedRoute>
              <CheckoutSuccessPage />
            </ProtectedRoute>
          } 
        />
        
        {/* CRITICAL FIX: Dashboard route now requires subscription */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requireSubscription>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Settings page - requires subscription */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute requireSubscription>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Placeholder routes for any missing functionality */}
        <Route path="/verify-email" element={<ComingSoonPage />} />
        
        {/* Fallback Route - redirect to landing page */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* FIXED: Admin routes are completely separate - no admin overhead for regular users */}
        <Route 
          path="/admin/*" 
          element={
            <AdminAuthProvider>
              <AdminRoutes />
            </AdminAuthProvider>
          } 
        />
        {/* Regular app routes with only AuthProvider */}
        <Route 
          path="*" 
          element={
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
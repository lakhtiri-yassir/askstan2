// src/App.tsx - EFFICIENT FIX: Clean lazy loading without complex fallback logic
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminProtectedRoute } from './components/layout/AdminProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// EFFICIENT FIX: Direct imports with proper destructuring for named exports
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));  // Already has default export
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));  // Already has default export
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Protected pages
const PlansPage = lazy(() => import('./pages/subscription/PlansPage').then(m => ({ default: m.PlansPage })));
const CheckoutSuccessPage = lazy(() => import('./pages/checkout/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Legal pages
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
            {/* Only show Header for non-admin routes */}
            <Routes>
              <Route path="/admin/*" element={null} />
              <Route path="*" element={<Header />} />
            </Routes>
            
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                {/* Legal Pages */}
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                
                {/* Semi-Protected Routes */}
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
                
                {/* Fully Protected Routes */}
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
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route 
                  path="/admin" 
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  } 
                />
                
                {/* Fallback Route */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
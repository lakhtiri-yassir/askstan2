// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminProtectedRoute } from './components/layout/AdminProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage').then(module => ({ default: module.SignUpPage })));
const SignInPage = lazy(() => import('./pages/auth/SignInPage').then(module => ({ default: module.SignInPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const PlansPage = lazy(() => import('./pages/subscription/PlansPage').then(module => ({ default: module.PlansPage })));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage').then(module => ({ default: module.CheckoutSuccessPage })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));

// Legal pages
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then(module => ({ default: module.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));

// Admin pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(module => ({ default: module.AdminLoginPage })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
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
                  
                  {/* Semi-Protected Routes (require auth but not subscription) */}
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
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <AdminProtectedRoute>
                        <AdminDashboard />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  {/* Redirect unknown routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </AuthProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
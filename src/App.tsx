// src/App.tsx - MINIMAL FIX: Only include pages that actually exist
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminProtectedRoute } from './components/layout/AdminProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// FIXED: Only import pages that actually exist
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));

// Only include pages that exist
const PlansPage = lazy(() => import('./pages/subscription/PlansPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/checkout/CheckoutSuccessPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Admin pages that exist
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Simple placeholder for missing pages
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
        
        {/* Placeholder for missing pages */}
        <Route path="/forgot-password" element={<ComingSoonPage />} />
        <Route path="/reset-password" element={<ComingSoonPage />} />
        <Route path="/terms" element={<ComingSoonPage />} />
        <Route path="/privacy" element={<ComingSoonPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Pages that exist */}
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
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute requireSubscription>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback Route */}
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
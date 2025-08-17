// src/components/layout/ProtectedRoute.tsx - SIMPLIFIED WITHOUT TIMEOUT LOGIC
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSubscription = false,
  requireEmailVerification = false,
}) => {
  const { 
    user, 
    subscriptionStatus, 
    loading, 
    hasActiveSubscription, 
    initialized,
    error 
  } = useAuth();
  const location = useLocation();

  console.log("🔍 ProtectedRoute Debug:", {
    requireSubscription,
    loading,
    initialized,
    user: user?.id,
    subscriptionStatus: subscriptionStatus?.status,
    hasActiveSubscription,
    location: location.pathname,
    error
  });

  // Show error state if there's a real initialization error
  if (error && !user && initialized) {
    console.log("❌ Authentication error occurred");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Simple loading state - only while auth is initializing
  if (loading || !initialized) {
    console.log("⏳ Showing loading spinner");
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log("🚫 No user, redirecting to signin");
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerification && !user.email_confirmed_at) {
    console.log("📧 Email verification required");
    return <Navigate to="/verify-email" replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    console.log("💳 Subscription required but not active, redirecting to plans", {
      subscriptionStatus: subscriptionStatus?.status,
      hasActiveSubscription
    });
    return <Navigate to="/plans" replace />;
  }

  console.log("✅ Access granted to protected route");
  return <>{children}</>;
};
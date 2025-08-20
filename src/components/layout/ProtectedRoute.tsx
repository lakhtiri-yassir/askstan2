// src/components/layout/ProtectedRoute.tsx - DEFINITIVE FIX: Remove subscriptionStatus reference
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
    loading, 
    hasActiveSubscription, 
    initialized
  } = useAuth();
  const location = useLocation();

  console.log("🔍 ProtectedRoute:", { 
    loading, 
    initialized, 
    user: !!user, 
    hasActiveSubscription,
    requireSubscription,
    path: location.pathname 
  });

  // Show loading spinner while auth is still loading or not initialized
  if (loading || !initialized) {
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

  // If we're initialized but no user, redirect to signin
  if (initialized && !user) {
    console.log("🚫 No user after initialization, redirecting to signin");
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerification && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  // FIXED: Check subscription requirement using hasActiveSubscription directly
  if (requireSubscription && !hasActiveSubscription) {
    console.log("💳 Subscription required but not active, redirecting to plans");
    return <Navigate to="/plans" replace />;
  }

  // All checks passed - render the protected content
  console.log("✅ ProtectedRoute checks passed, rendering content");
  return <>{children}</>;
};
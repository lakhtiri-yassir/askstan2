// src/components/layout/ProtectedRoute.tsx - FIXED VERSION
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSubscription = false,
  requireEmailVerification = false,
}) => {
  const { user, profile, subscriptionStatus, loading, hasActiveSubscription } = useAuth();
  const location = useLocation();

  // NEW: Enhanced logging for debugging
  console.log('ProtectedRoute check:', {
    path: location.pathname,
    requireSubscription,
    user: !!user,
    loading,
    hasActiveSubscription,
    subscriptionStatus: subscriptionStatus?.status,
    subscription: !!subscriptionStatus?.subscription
  });

  if (loading) {
    console.log('ProtectedRoute: Loading state, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    console.log('ProtectedRoute: Subscription required but not active, redirecting to plans', {
      subscriptionStatus,
      hasActiveSubscription
    });
    return <Navigate to="/plans" replace />;
  }

  console.log('ProtectedRoute: All checks passed, rendering children');
  return <>{children}</>;
};
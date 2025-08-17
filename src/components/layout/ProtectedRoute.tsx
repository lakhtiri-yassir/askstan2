// src/components/layout/ProtectedRoute.tsx - COMPLETELY SIMPLIFIED - NO ERROR MESSAGES
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
    initialized
  } = useAuth();
  const location = useLocation();

  // Simple loading state - only while auth is initializing
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

  // Redirect to signin if not authenticated
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerification && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    return <Navigate to="/plans" replace />;
  }

  // Just render the children - no error handling
  return <>{children}</>;
};
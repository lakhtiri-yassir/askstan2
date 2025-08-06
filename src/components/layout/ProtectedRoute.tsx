// src/components/layout/ProtectedRoute.tsx - ENHANCED VERSION WITH FALLBACK
import React, { ReactNode, useEffect, useState } from 'react';
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
  const [forceLoadingTimeout, setForceLoadingTimeout] = useState(false);

  // Enhanced logging for debugging
  console.log('🛡️ ProtectedRoute check:', {
    path: location.pathname,
    requireSubscription,
    user: !!user,
    userId: user?.id,
    loading,
    hasActiveSubscription,
    subscriptionStatus: subscriptionStatus?.status,
    subscription: !!subscriptionStatus?.subscription,
    forceLoadingTimeout
  });

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading && user) {
      console.log('⏰ ProtectedRoute: Setting emergency timeout for loading state');
      timeoutId = setTimeout(() => {
        console.error('🚨 ProtectedRoute: Emergency timeout - forcing loading to complete');
        setForceLoadingTimeout(true);
      }, 15000); // 15 second emergency timeout
    }
    
    if (!loading && timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, user]);

  // Show loading spinner
  if (loading && !forceLoadingTimeout) {
    console.log('⏳ ProtectedRoute: Loading state, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">
            {requireSubscription ? 'Checking subscription...' : 'Loading...'}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Path: {location.pathname}
          </p>
        </div>
      </div>
    );
  }

  // If we hit the emergency timeout, proceed with checks anyway
  if (forceLoadingTimeout) {
    console.warn('⚠️ ProtectedRoute: Emergency timeout reached, proceeding with current auth state');
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log('🚫 ProtectedRoute: No user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement with fallback
  if (requireSubscription) {
    // If we have a definitive subscription status
    if (subscriptionStatus) {
      if (!hasActiveSubscription) {
        console.log('💳 ProtectedRoute: Subscription required but not active, redirecting to plans', {
          subscriptionStatus,
          hasActiveSubscription
        });
        return <Navigate to="/plans" replace />;
      }
    } else if (forceLoadingTimeout) {
      // If we hit timeout and still no subscription status, assume no subscription
      console.warn('⚠️ ProtectedRoute: No subscription status after timeout, redirecting to plans');
      return <Navigate to="/plans" replace />;
    } else {
      // Still waiting for subscription status
      console.log('⏳ ProtectedRoute: Still waiting for subscription status...');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 font-medium">Checking subscription status...</p>
          </div>
        </div>
      );
    }
  }

  console.log('✅ ProtectedRoute: All checks passed, rendering children');
  return <>{children}</>;
};
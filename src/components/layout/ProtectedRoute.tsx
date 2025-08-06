// src/components/layout/ProtectedRoute.tsx - PRODUCTION READY VERSION
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
  const { user, loading, hasActiveSubscription } = useAuth();
  const location = useLocation();
  const [emergencyTimeout, setEmergencyTimeout] = useState(false);

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.error('🚨 ProtectedRoute: Emergency timeout reached');
        setEmergencyTimeout(true);
      }, 20000); // 20 second emergency timeout

      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Reset emergency timeout when loading changes
  useEffect(() => {
    if (!loading && emergencyTimeout) {
      setEmergencyTimeout(false);
    }
  }, [loading, emergencyTimeout]);

  console.log('🛡️ ProtectedRoute:', {
    path: location.pathname,
    requireSubscription,
    user: !!user,
    loading,
    hasActiveSubscription,
    emergencyTimeout
  });

  // Show loading spinner (with emergency timeout)
  if (loading && !emergencyTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">
            {requireSubscription ? 'Verifying subscription...' : 'Loading...'}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {location.pathname}
          </div>
        </div>
      </div>
    );
  }

  // If emergency timeout is reached, proceed with current auth state
  if (emergencyTimeout) {
    console.warn('⚠️ ProtectedRoute: Proceeding due to emergency timeout');
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log('🚫 ProtectedRoute: No user, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    console.log('💳 ProtectedRoute: Subscription required but not active');
    
    // Special handling for emergency timeout - allow access but show warning
    if (emergencyTimeout) {
      console.warn('⚠️ ProtectedRoute: Allowing access due to emergency timeout');
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> Unable to verify subscription status. 
                  If you should have access, please try refreshing the page or contact support.
                </p>
              </div>
            </div>
          </div>
          {children}
        </div>
      );
    }

    // Normal flow - redirect to plans
    return <Navigate to="/plans" replace />;
  }

  console.log('✅ ProtectedRoute: All checks passed');
  return <>{children}</>;
};
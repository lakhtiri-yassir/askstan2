// src/components/layout/ProtectedRoute.tsx - FIXED VERSION
import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingSpinner } from "../ui/LoadingSpinner";

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
  const { user, subscriptionStatus, loading, hasActiveSubscription } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, []);

  console.log("🔍 ProtectedRoute Debug:", {
    requireSubscription,
    loading,
    user: user?.id,
    subscriptionStatus: subscriptionStatus?.status,
    hasActiveSubscription,
    location: location.pathname,
    loadingTimeout
  });

  // CRITICAL FIX: Better loading state management
  const isLoadingAuth = loading;
  const isLoadingSubscription = requireSubscription && user && subscriptionStatus === null && !loadingTimeout;
  const shouldShowLoading = isLoadingAuth || isLoadingSubscription;

  if (shouldShowLoading) {
    console.log("⏳ Showing loading spinner:", {
      isLoadingAuth,
      isLoadingSubscription,
      loadingTimeout
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          {loadingTimeout && (
            <p className="mt-4 text-red-600">
              Loading is taking longer than expected. 
              <button 
                onClick={() => window.location.reload()} 
                className="ml-2 underline"
              >
                Refresh page
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log("🚫 No user, redirecting to signin");
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement with proper fallback
  if (requireSubscription && !hasActiveSubscription && !loadingTimeout) {
    console.log("💳 Subscription required but not active, redirecting to plans", {
      subscriptionStatus: subscriptionStatus?.status,
      hasActiveSubscription
    });
    return <Navigate to="/plans" replace />;
  }

  // If timeout occurred but we have a user, show the content anyway with a warning
  if (loadingTimeout && user) {
    console.log("⚠️ Loading timeout - showing content with warning");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Loading took longer than expected, but you're authenticated. Some features may not work correctly.{" "}
                <button 
                  onClick={() => window.location.reload()} 
                  className="font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  Refresh page
                </button>
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  console.log("✅ Access granted to protected route");
  return <>{children}</>;
};
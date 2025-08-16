// src/components/layout/ProtectedRoute.tsx - FIXED VERSION WITH BETTER ERROR HANDLING
import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
  const { 
    user, 
    subscriptionStatus, 
    loading, 
    hasActiveSubscription, 
    initialized,
    error 
  } = useAuth();
  const location = useLocation();
  const [showTimeout, setShowTimeout] = useState(false);

  // FIXED: Better timeout handling with longer duration
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !initialized) {
        setShowTimeout(true);
      }
    }, 15000); // FIXED: Increased to 15 seconds

    return () => clearTimeout(timer);
  }, [loading, initialized]);

  console.log("🔍 ProtectedRoute Debug:", {
    requireSubscription,
    loading,
    initialized,
    user: user?.id,
    subscriptionStatus: subscriptionStatus?.status,
    hasActiveSubscription,
    location: location.pathname,
    showTimeout,
    error
  });

  // FIXED: Better loading state logic
  const isLoadingAuth = loading && !initialized;
  const isLoadingSubscription = requireSubscription && user && subscriptionStatus === null && !showTimeout;
  const shouldShowLoading = isLoadingAuth || isLoadingSubscription;

  // FIXED: Show error state if there's an initialization error
  if (error && !user && initialized) {
    console.log("❌ Showing auth error state");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (shouldShowLoading) {
    console.log("⏳ Showing loading spinner:", {
      isLoadingAuth,
      isLoadingSubscription,
      showTimeout
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">
            {isLoadingAuth ? "Initializing..." : "Loading subscription..."}
          </p>
          {showTimeout && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                Loading is taking longer than expected.{" "}
                <button 
                  onClick={() => window.location.reload()} 
                  className="underline hover:text-yellow-800"
                >
                  Refresh page
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user && initialized) {
    console.log("🚫 No user, redirecting to signin");
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement with proper fallback
  if (requireSubscription && user && initialized && !hasActiveSubscription && !showTimeout) {
    console.log("💳 Subscription required but not active, redirecting to plans", {
      subscriptionStatus: subscriptionStatus?.status,
      hasActiveSubscription
    });
    return <Navigate to="/plans" replace />;
  }

  // FIXED: Better timeout handling with more informative message
  if (showTimeout && user) {
    console.log("⚠️ Loading timeout - showing content with warning");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Some features may still be loading. Most functionality should work normally.{" "}
                <button 
                  onClick={() => window.location.reload()} 
                  className="font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  Refresh page
                </button>
                {" "}if you experience issues.
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
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
  const { user, subscriptionStatus, loading, hasActiveSubscription } =
    useAuth();
  const location = useLocation();
  const [subscriptionTimeout, setSubscriptionTimeout] = useState(false);

  // Debug logging with timestamp
  console.log(`🔍 ProtectedRoute [${new Date().toISOString()}]:`, {
    path: location.pathname,
    requireSubscription,
    loading,
    userId: user?.id,
    subscriptionStatus: subscriptionStatus?.status,
    hasActiveSubscription,
    subscriptionIsNull: subscriptionStatus === null,
    subscriptionTimeout
  });

  // Timeout for subscription loading to prevent infinite loops
  useEffect(() => {
    if (requireSubscription && subscriptionStatus === null && user && !loading) {
      console.log("⏰ Starting subscription timeout timer...");
      const timer = setTimeout(() => {
        console.log("⚠️  Subscription loading timeout reached");
        setSubscriptionTimeout(true);
      }, 3000); // 3 second timeout

      return () => clearTimeout(timer);
    }
  }, [requireSubscription, subscriptionStatus, user, loading]);

  // Show loading spinner only for initial auth loading
  if (loading) {
    console.log("⏳ Auth still loading, showing spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log("🚫 No user found, redirecting to signin");
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // For subscription-required routes
  if (requireSubscription) {
    // If subscription status is still null and timeout hasn't occurred, show loading
    if (subscriptionStatus === null && !subscriptionTimeout) {
      console.log("⏳ Subscription status loading...");
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Checking subscription...</p>
          </div>
        </div>
      );
    }

    // If timeout occurred or subscription is not active, redirect to plans
    if (subscriptionTimeout || (subscriptionStatus && !hasActiveSubscription)) {
      console.log("💳 Redirecting to plans page", {
        subscriptionTimeout,
        subscriptionStatus: subscriptionStatus?.status,
        hasActiveSubscription
      });
      return <Navigate to="/plans" replace />;
    }
  }

  console.log("✅ Access granted to protected route:", location.pathname);
  return <>{children}</>;
};
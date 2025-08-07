import React, { ReactNode } from "react";
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

  // Debug logging
  console.log("🔍 ProtectedRoute Debug:", {
    requireSubscription,
    loading,
    user: user?.id,
    subscriptionStatus,
    hasActiveSubscription,
    location: location.pathname
  });

  // Show loading spinner while authentication or subscription data is loading
  if (loading || (requireSubscription && subscriptionStatus === null)) {
    console.log("⏳ Showing loading spinner - loading:", loading, "subscriptionStatus null:", subscriptionStatus === null);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    console.log("🚫 No user, redirecting to signin");
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement - only after data has loaded
  if (requireSubscription && !hasActiveSubscription) {
    console.log("💳 Subscription required but not active, redirecting to plans", {
      subscriptionStatus,
      hasActiveSubscription
    });
    return <Navigate to="/plans" replace />;
  }

  console.log("✅ Access granted to protected route");
  return <>{children}</>;
};
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

  // Show loading spinner while authentication or subscription data is loading
  if (loading || (requireSubscription && subscriptionStatus === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check subscription requirement - only after data has loaded
  if (requireSubscription && !hasActiveSubscription) {
    console.log("Subscription required but not active, redirecting to plans");
    return <Navigate to="/plans" replace />;
  }

  return <>{children}</>;
};

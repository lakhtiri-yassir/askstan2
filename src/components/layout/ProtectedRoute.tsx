import React, { ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  if (loading) {
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


  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    console.log('Subscription required but not active, redirecting to plans');
    return <Navigate to="/plans" replace />;
  }

  return <>{children}</>;
};
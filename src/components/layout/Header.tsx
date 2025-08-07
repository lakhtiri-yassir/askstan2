// src/components/layout/Header.tsx - OPTIMIZED VERSION
import React, { useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import askstanLogo from "../../img/askstanlogo.png";

export const Header: React.FC = React.memo(() => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Memoize computed values to prevent unnecessary re-renders
  const isLandingPage = useMemo(() => location.pathname === '/', [location.pathname]);
  const displayName = useMemo(
    () => profile?.display_name || user?.email?.split("@")[0] || "User",
    [profile?.display_name, user?.email]
  );

  // Memoized handlers to prevent function recreation
  const handleSignOut = useCallback(async () => {
    try {
      console.log('Header: Starting sign out...');
      await signOut();
      console.log('Header: Sign out completed');
    } catch (error) {
      console.error("Header: Sign out error:", error);
      // Force navigation even if signOut fails
      window.location.href = '/';
    }
  }, [signOut]);

  const handleDashboardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Header: Dashboard clicked, navigating...');
    
    // Use replace to prevent back button issues
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    // If user is authenticated and not on landing page, prevent default home navigation
    if (user && !isLandingPage) {
      e.preventDefault();
      // Show confirmation before leaving dashboard
      if (window.confirm('Return to homepage? You can access your dashboard anytime from the header.')) {
        navigate('/');
      }
    }
  }, [user, isLandingPage, navigate]);

  // Render navigation based on context
  const renderNavigation = useMemo(() => {
    // On landing page, always show Sign In/Get Started regardless of auth state
    if (isLandingPage) {
      return (
        <div className="flex items-center space-x-4">
          <Link to="/signin">
            <Button variant="ghost" size="md">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="md">
              Get Started
            </Button>
          </Link>
        </div>
      );
    }
    
    // Authenticated user navigation on other pages
    if (user) {
      return (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 hidden sm:inline">
            Welcome, {displayName}
          </span>

          {/* Dashboard Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDashboardClick}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Go to Dashboard"
          >
            Dashboard
          </motion.button>

          {/* Settings Link */}
          <Link to="/settings" aria-label="Go to Settings">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors hidden sm:block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
            >
              <Settings size={20} />
            </motion.div>
          </Link>

          {/* Sign Out Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-xs sm:text-sm px-3 py-1 text-gray-700 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </motion.button>
        </div>
      );
    }
    
    // Non-authenticated user navigation on other pages
    return (
      <div className="flex items-center space-x-4">
        <Link to="/signin">
          <Button variant="ghost" size="md">
            Sign In
          </Button>
        </Link>
        <Link to="/signup">
          <Button variant="primary" size="md">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }, [isLandingPage, user, displayName, handleDashboardClick, handleSignOut]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
            onClick={handleLogoClick}
            aria-label="AskStan! Home"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="logo-container flex items-center"
            >
              <img 
                src={askstanLogo} 
                alt="AskStan! Logo" 
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // You could replace with a text logo or different image
                }}
              />
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4" role="navigation">
            {renderNavigation}
          </nav>
        </div>
      </div>
    </header>
  );
});
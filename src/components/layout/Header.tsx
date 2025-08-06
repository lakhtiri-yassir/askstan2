// src/components/layout/Header.tsx - FIXED VERSION
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import askstanLogo from "../../img/askstanlogo.png";

export const Header: React.FC = () => {
  const { user, profile, signOut, loading, isAuthenticating } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut();
      // signOut handles navigation and state clearing
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [signOut]);

  // NEW: Handle dashboard navigation properly
  const handleDashboardClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only navigate if user is authenticated and not currently authenticating
    if (user && !loading && !isAuthenticating) {
      navigate('/dashboard');
    }
  }, [user, loading, isAuthenticating, navigate]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="logo-container flex items-center"
            >
              <img src={askstanLogo} alt="AskStan!" className="h-10 w-auto" />
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {/* NEW: Show loading state during authentication */}
            {loading || isAuthenticating ? (
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Welcome,{" "}
                  {profile?.display_name || user.email?.split("@")[0] || "User"}
                </span>

                {/* FIXED: Use proper navigation handler */}
                <button 
                  onClick={handleDashboardClick}
                  className="px-3 py-1 bg-royal-blue text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>

                <Link to="/settings">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="p-2 text-gray-600 hover:text-powder-blue transition-colors hidden sm:block"
                  >
                    <Settings size={20} />
                  </motion.div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-xs sm:text-sm"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
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
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
// src/components/layout/Header.tsx - SIMPLIFIED FUNCTIONAL VERSION
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import askstanLogo from "../../img/askstanlogo.png";

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = React.useCallback(async () => {
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

  const handleDashboardClick = React.useCallback(() => {
    console.log('Header: Dashboard clicked, navigating...');
    navigate('/dashboard');
  }, [navigate]);

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
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Welcome,{" "}
                  {profile?.display_name || user.email?.split("@")[0] || "User"}
                </span>

                {/* Dashboard Button - Direct onClick handler */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleDashboardClick}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-colors"
                >
                  Dashboard
                </motion.button>

                <Link to="/settings">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors hidden sm:block"
                  >
                    <Settings size={20} />
                  </motion.div>
                </Link>

                {/* Sign Out Button - Direct onClick handler */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-xs sm:text-sm px-3 py-1 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </motion.button>
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
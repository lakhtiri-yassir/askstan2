import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatbotEmbed } from '../../components/ChatbotEmbed';

export const DashboardPage: React.FC = () => {
  const { user, profile, subscription } = useAuth();
  const [chatbotLoaded, setChatbotLoaded] = useState(false);

  const handleChatbotLoad = () => {
    setChatbotLoaded(true);
    console.log('Chatbot loaded successfully in dashboard');
  };

  const handleChatbotError = (error: Error) => {
    console.error('Dashboard chatbot error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, <span className="text-powder-blue">{profile?.display_name || user?.email?.split('@')[0] || 'User'}</span>!
                </h1>
                <p className="text-gray-600">
                  Your AI social media coach is ready to help you grow your online presence.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4" />
                  <span className="capitalize">{subscription?.plan_type || 'Free'} Plan</span>
                </div>
                {chatbotLoaded && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>AI Coach Online</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Conversations</p>
                <p className="text-2xl font-bold text-gray-900">Coming Soon</p>
              </div>
              <MessageSquare className="w-8 h-8 text-powder-blue" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Tips Given</p>
                <p className="text-2xl font-bold text-gray-900">Coming Soon</p>
              </div>
              <Sparkles className="w-8 h-8 text-powder-blue" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-2xl font-bold text-green-600">
                  {subscription?.status === 'active' ? 'Active' : 'Free'}
                </p>
              </div>
              <Settings className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </motion.div>

        {/* Main Chatbot Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-navy-blue p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-navy-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">Stan - AI Growth Coach</h3>
                  <p className="text-sm text-white opacity-90">
                    {chatbotLoaded ? 'Ready to help you grow' : 'Loading your personal coach...'}
                  </p>
                </div>
              </div>
              
              {subscription?.status !== 'active' && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm">
                  <span>Free Plan - Limited Features</span>
                </div>
              )}
            </div>
          </div>

          {/* Chatbot Integration Area */}
          <div className="p-6">
            <ChatbotEmbed
              className="w-full"
              onLoad={handleChatbotLoad}
              onError={handleChatbotError}
            />
          </div>
        </motion.div>

        {/* Instructions for Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <h4 className="font-semibold text-navy-blue mb-3">Getting Started with Your AI Coach</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-navy-blue">
            <div>
              <h5 className="font-medium mb-2">What Stan can help you with:</h5>
              <ul className="space-y-1 text-gray-700">
                <li>• Content strategy and optimization</li>
                <li>• Hashtag research and trends</li>
                <li>• Posting schedules and timing</li>
                <li>• Audience growth techniques</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Tips for best results:</h5>
              <ul className="space-y-1 text-gray-700">
                <li>• Be specific about your goals</li>
                <li>• Mention your platform (Instagram, TikTok, etc.)</li>
                <li>• Share your current follower count</li>
                <li>• Ask for actionable advice</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
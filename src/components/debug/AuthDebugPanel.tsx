// src/components/debug/AuthDebugPanel.tsx - On-screen debugging panel
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export const AuthDebugPanel: React.FC = () => {
  const { 
    user, 
    subscription, 
    hasActiveSubscription, 
    loading, 
    initialized, 
    debugSubscriptionStatus,
    refreshSubscription 
  } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  // Add log entry
  const addLog = (level: DebugLog['level'], message: string, data?: any) => {
    const newLog: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
  };

  // Monitor auth state changes
  useEffect(() => {
    addLog('info', 'Auth state changed', {
      hasUser: !!user,
      userEmail: user?.email,
      hasSubscription: !!subscription,
      subscriptionStatus: subscription?.status,
      hasActiveSubscription,
      loading,
      initialized
    });
  }, [user, subscription, hasActiveSubscription, loading, initialized]);

  // Clear logs
  const clearLogs = () => setLogs([]);

  // Manual subscription check
  const handleDebugSubscription = async () => {
    addLog('info', 'Manual subscription debug started');
    try {
      await debugSubscriptionStatus();
      addLog('success', 'Manual subscription debug completed');
    } catch (error) {
      addLog('error', 'Manual subscription debug failed', error);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    addLog('info', 'Manual refresh started');
    try {
      await refreshSubscription();
      addLog('success', 'Manual refresh completed');
    } catch (error) {
      addLog('error', 'Manual refresh failed', error);
    }
  };

  // Get log color
  const getLogColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  // Get log icon
  const getLogIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Toggle Auth Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Bug className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Auth Debug Panel</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-purple-100 rounded"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-purple-100 rounded"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Current State */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-3">Current Auth State</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <div className={`flex items-center ${user ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                        User: {user ? 'Signed In' : 'Not Signed In'}
                      </div>
                      <div className={`flex items-center ${initialized ? 'text-green-600' : 'text-yellow-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                        Initialized: {initialized ? 'Yes' : 'No'}
                      </div>
                      <div className={`flex items-center ${loading ? 'text-yellow-600' : 'text-green-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                        Loading: {loading ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className={`flex items-center ${subscription ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                        Subscription: {subscription ? 'Found' : 'None'}
                      </div>
                      <div className={`flex items-center ${hasActiveSubscription ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                        Active Sub: {hasActiveSubscription ? 'Yes' : 'No'}
                      </div>
                      <div className="text-gray-600">
                        Status: {subscription?.status || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {user && (
                    <div className="mt-3 text-xs text-gray-600">
                      <div>User: {user.email}</div>
                      <div>ID: {user.id}</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Debug Actions</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDebugSubscription}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                    >
                      Debug Subscription
                    </button>
                    <button
                      onClick={handleRefresh}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors flex items-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </button>
                    <button
                      onClick={clearLogs}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>

                {/* Logs */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">Debug Logs ({logs.length})</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {logs.length === 0 ? (
                      <div className="text-gray-500 text-sm text-center py-4">
                        No logs yet. Interact with auth to see logs here.
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="text-xs border-l-2 border-gray-200 pl-2 py-1">
                          <div className={`flex items-center space-x-2 ${getLogColor(log.level)}`}>
                            <span>{getLogIcon(log.level)}</span>
                            <span className="font-mono text-gray-500">{log.timestamp}</span>
                            <span className="flex-1">{log.message}</span>
                          </div>
                          {log.data && (
                            <div className="mt-1 ml-4 p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                              <pre>{JSON.stringify(log.data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
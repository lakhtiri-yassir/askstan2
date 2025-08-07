// src/hooks/useSessionMonitor.ts - SESSION MANAGEMENT MONITORING HOOK
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SessionMetrics {
  renderCount: number;
  lastRenderTime: number;
  loadingStateChanges: number;
  authStateChanges: number;
  subscriptionStateChanges: number;
}

export const useSessionMonitor = (componentName: string) => {
  const { loading, user, subscriptionStatus } = useAuth();
  const metricsRef = useRef<SessionMetrics>({
    renderCount: 0,
    lastRenderTime: Date.now(),
    loadingStateChanges: 0,
    authStateChanges: 0,
    subscriptionStateChanges: 0,
  });
  
  const prevStateRef = useRef({
    loading,
    userId: user?.id,
    subscriptionStatus: subscriptionStatus?.status,
  });

  // Monitor render frequency and detect loops
  const checkRenderLoop = useCallback(() => {
    const metrics = metricsRef.current;
    const now = Date.now();
    
    metrics.renderCount++;
    
    // Detect rapid re-renders (more than 10 renders per second)
    if (now - metrics.lastRenderTime < 100 && metrics.renderCount > 10) {
      console.warn(`🚨 Potential infinite render loop detected in ${componentName}:`, {
        renderCount: metrics.renderCount,
        timeDiff: now - metrics.lastRenderTime,
        metrics
      });
      
      // Log component state for debugging
      console.log(`📊 ${componentName} state:`, {
        loading,
        userId: user?.id,
        subscriptionStatus: subscriptionStatus?.status,
      });
    }
    
    metrics.lastRenderTime = now;
    
    // Reset counter every 5 seconds
    if (metrics.renderCount > 50) {
      metrics.renderCount = 0;
    }
  }, [componentName, loading, user?.id, subscriptionStatus?.status]);

  // Monitor state changes
  useEffect(() => {
    const metrics = metricsRef.current;
    const prevState = prevStateRef.current;
    
    // Track loading state changes
    if (prevState.loading !== loading) {
      metrics.loadingStateChanges++;
      console.log(`🔄 ${componentName} loading state changed:`, {
        from: prevState.loading,
        to: loading,
        changeCount: metrics.loadingStateChanges
      });
      
      // Detect loading state oscillation
      if (metrics.loadingStateChanges > 10) {
        console.warn(`⚠️ Excessive loading state changes in ${componentName}:`, metrics.loadingStateChanges);
      }
      
      prevState.loading = loading;
    }
    
    // Track auth state changes
    if (prevState.userId !== user?.id) {
      metrics.authStateChanges++;
      console.log(`👤 ${componentName} auth state changed:`, {
        from: prevState.userId,
        to: user?.id,
        changeCount: metrics.authStateChanges
      });
      
      prevState.userId = user?.id;
    }
    
    // Track subscription state changes
    if (prevState.subscriptionStatus !== subscriptionStatus?.status) {
      metrics.subscriptionStateChanges++;
      console.log(`💳 ${componentName} subscription state changed:`, {
        from: prevState.subscriptionStatus,
        to: subscriptionStatus?.status,
        changeCount: metrics.subscriptionStateChanges
      });
      
      prevState.subscriptionStatus = subscriptionStatus?.status;
    }
  }, [componentName, loading, user?.id, subscriptionStatus?.status]);

  // Check for render loops on each render
  useEffect(() => {
    checkRenderLoop();
  });

  // Cleanup and report metrics on unmount
  useEffect(() => {
    return () => {
      const metrics = metricsRef.current;
      console.log(`📈 ${componentName} session metrics:`, {
        totalRenders: metrics.renderCount,
        loadingStateChanges: metrics.loadingStateChanges,
        authStateChanges: metrics.authStateChanges,
        subscriptionStateChanges: metrics.subscriptionStateChanges,
      });
      
      // Report potential issues
      if (metrics.loadingStateChanges > 5) {
        console.warn(`⚠️ High loading state changes in ${componentName}: ${metrics.loadingStateChanges}`);
      }
      
      if (metrics.renderCount > 50) {
        console.warn(`⚠️ High render count in ${componentName}: ${metrics.renderCount}`);
      }
    };
  }, [componentName]);

  // Provide debugging utilities
  return {
    metrics: metricsRef.current,
    forceDebugLog: () => {
      console.log(`🔍 ${componentName} debug info:`, {
        metrics: metricsRef.current,
        currentState: {
          loading,
          userId: user?.id,
          subscriptionStatus: subscriptionStatus?.status,
        },
        timestamp: new Date().toISOString(),
      });
    },
    resetMetrics: () => {
      metricsRef.current = {
        renderCount: 0,
        lastRenderTime: Date.now(),
        loadingStateChanges: 0,
        authStateChanges: 0,
        subscriptionStateChanges: 0,
      };
    }
  };
};
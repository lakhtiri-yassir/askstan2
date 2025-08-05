import { useEffect } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  phase: 'mount' | 'update';
}

export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // Flag renders longer than 16ms (60fps threshold)
          console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  });
};

export const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  if (process.env.NODE_ENV === 'development') {
    const metrics: PerformanceMetrics = {
      componentName: id,
      renderTime: actualDuration,
      phase
    };
    
    // Log slow renders
    if (actualDuration > 16) {
      console.warn('🐌 Performance Warning:', metrics);
    }
    
    // Track performance metrics
    if (window.performance && window.performance.mark) {
      window.performance.mark(`${id}-${phase}-${commitTime}`);
    }
  }
};
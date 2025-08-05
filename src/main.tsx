import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/performance').then(({ reportWebVitals }) => {
    reportWebVitals((metric) => {
      console.log('📊 Web Vitals:', metric);
    });
  }).catch(() => {
    console.log('Performance monitoring not available');
  });
}

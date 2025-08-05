import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportWebVitals } from './utils/performance';
import { reportWebVitals } from './utils/performance';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  reportWebVitals((metric) => {
    console.log('📊 Web Vitals:', metric);
  });
}

// Performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  reportWebVitals((metric) => {
    console.log('📊 Web Vitals:', metric);
  });
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';
import './index.css';

const isAdminRoute =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('admin') ||
   window.location.pathname.startsWith('/admin'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </React.StrictMode>
);

// Register Tetik Service Worker for PWA Offline functionality
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // Registered successfully
      })
      .catch((err) => {
        console.warn('[SW] Registration notice:', err);
      });
  });
}


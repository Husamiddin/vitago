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

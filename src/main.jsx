/**
 * src/main.jsx
 * Application entry point importing Bootstrap 5.3 CSS, Bootstrap Icons, and custom theme CSS.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import { initializeDatabase } from './services/db.js';
import App from './App.jsx';

initializeDatabase();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

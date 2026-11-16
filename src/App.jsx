import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/auth.js';
import { ToastProvider } from './components/Toast.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import ReportItem from './pages/ReportItem.jsx';
import ItemDetails from './pages/ItemDetails.jsx';
import MyItems from './pages/MyItems.jsx';
import MyClaims from './pages/MyClaims.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Profile from './pages/Profile.jsx';

import { testConnection } from './services/testConnection';

export default function App() {

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-shell">
            <Navbar />

            <main className="app-main">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/report"
                  element={
                    <ProtectedRoute>
                      <ReportItem />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/items/:id"
                  element={
                    <ProtectedRoute>
                      <ItemDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-items"
                  element={
                    <ProtectedRoute>
                      <MyItems />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-claims"
                  element={
                    <ProtectedRoute>
                      <MyClaims />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
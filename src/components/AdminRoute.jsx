/**
 * src/components/AdminRoute.jsx
 * Route guard restricting the Admin Dashboard exclusively to admin users.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.js';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * src/utils/auth.js
 * Authentication context, session hydration, and role/ownership permission checks.
 * Communicates solely through src/services/db.js.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeDatabase,
  getAll,
  getById,
  insert,
  update,
  getSession,
  setSession,
  clearSession,
} from '../services/db.js';

const AuthContext = createContext(null);

function sanitizeUser(user) {
  if (!user) return null;
  const { password: _ignored, ...safeUser } = user;
  return safeUser;
}

export function canManageItem(user, item) {
  if (!user || !item) return false;
  return user.role === 'admin' || Number(item.user_id) === Number(user.user_id);
}

export function assertCanManageItem(user, item) {
  if (!canManageItem(user, item)) {
    throw new Error('Permission denied: only the item owner or an admin can perform this action.');
  }
}

export function assertAdmin(user) {
  if (!user || user.role !== 'admin') {
    throw new Error('Permission denied: administrator privileges required.');
  }
}

export function assertCanResolveClaim(user, item) {
  if (!user || !item) {
    throw new Error('Permission denied: invalid user or item.');
  }
  if (user.role !== 'admin' && Number(item.user_id) !== Number(user.user_id)) {
    throw new Error('Permission denied: only the item owner or an admin can approve or reject claims.');
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    initializeDatabase();
    const session = getSession();
    if (!session) {
      setUser(null);
      return null;
    }
    const found = getById('users', session.user_id);
    if (!found) {
      clearSession();
      setUser(null);
      return null;
    }
    const safe = sanitizeUser(found);
    setUser(safe);
    return safe;
  }, []);

  useEffect(() => {
    refreshUser();
    setLoading(false);
  }, [refreshUser]);

  const login = useCallback((email, password) => {
    initializeDatabase();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const users = getAll('users');
    const matched = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
    );
    if (!matched) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }
    setSession(matched.user_id);
    const safe = sanitizeUser(matched);
    setUser(safe);
    return safe;
  }, []);

  const register = useCallback(({ name, email, password, role }) => {
    initializeDatabase();
    if (!['student', 'faculty'].includes(role)) {
      throw new Error('Public registration is restricted to Student and Faculty roles.');
    }
    const created = insert('users', {
      name,
      email,
      password,
      role,
    });
    return sanitizeUser(created);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    ({ name, email, password }) => {
      if (!user) {
        throw new Error('You must be logged in to update your profile.');
      }
      const existing = getById('users', user.user_id);
      if (!existing) {
        throw new Error('Active user account no longer exists.');
      }
      const changes = {
        name,
        email,
        password: password ? password : existing.password,
      };
      const updated = update('users', user.user_id, changes);
      const safe = sanitizeUser(updated);
      setUser(safe);
      return safe;
    },
    [user]
  );

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(user && user.role === 'admin'),
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return ctx;
}

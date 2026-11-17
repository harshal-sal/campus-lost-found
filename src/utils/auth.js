import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { supabase } from '../services/supabase.js';

const AuthContext = createContext(null);

// Remove sensitive information before exposing the user to React components.
function sanitizeUser(user) {
  if (!user) return null;

  const { password: _ignored, ...safeUser } = user;
  return safeUser;
}

// Permission checks
export function canManageItem(user, item) {
  if (!user || !item) return false;

  return (
    user.role === 'admin' ||
    Number(item.user_id) === Number(user.user_id)
  );
}

export function assertCanManageItem(user, item) {
  if (!canManageItem(user, item)) {
    throw new Error(
      'Permission denied: only the item owner or an admin can perform this action.'
    );
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

  if (
    user.role !== 'admin' &&
    Number(item.user_id) !== Number(user.user_id)
  ) {
    throw new Error(
      'Permission denied: only the item owner or an admin can approve or reject claims.'
    );
  }
}

// Authentication Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the PostgreSQL profile associated with the authenticated user.
  const fetchProfile = useCallback(async (authUserId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      throw new Error(`Unable to load user profile: ${error.message}`);
    }

    return sanitizeUser(data);
  }, []);

  // Restore the existing Supabase session.
  const refreshUser = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (!session) {
      setUser(null);
      return null;
    }

    const profile = await fetchProfile(session.user.id);
    setUser(profile);

    return profile;
  }, [fetchProfile]);

  // Listen for login, logout and session changes.
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer profile fetching so it doesn't run inside the auth callback.
      setTimeout(async () => {
        if (!mounted) return;

        try {
          if (session) {
            const profile = await fetchProfile(session.user.id);

            if (mounted) setUser(profile);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Authentication session error:', error.message);

          if (mounted) setUser(null);
        } finally {
          if (mounted) setLoading(false);
        }
      }, 0);
    });

    // Check the initial session.
    refreshUser()
      .catch((error) => {
        console.error('Session restoration failed:', error.message);

        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser, fetchProfile]);

  // LOGIN
  const login = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email).trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      const profile = await fetchProfile(data.user.id);

      setUser(profile);

      return profile;
    },
    [fetchProfile]
  );

  // REGISTER
  const register = useCallback(async ({ name, email, password, role }) => {
    if (!['student', 'faculty'].includes(role)) {
      throw new Error(
        'Public registration is restricted to Student and Faculty roles.'
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: String(email).trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          role,
        },
      },
    });

    if (error) throw error;

    return {
      email: data.user?.email,
      confirmationRequired: !data.session,
    };
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
  }, []);

  // UPDATE PROFILE
  const updateProfile = useCallback(
    async ({ name, email, password }) => {
      if (!user) {
        throw new Error('You must be logged in to update your profile.');
      }

      const changes = {};

      if (name !== undefined) changes.name = name.trim();

      if (email !== undefined) {
        changes.email = email.trim().toLowerCase();
      }

      // Update authentication details when requested.
      const authChanges = {};

      if (email) authChanges.email = email.trim().toLowerCase();
      if (password) authChanges.password = password;

      if (Object.keys(authChanges).length > 0) {
        const { error } = await supabase.auth.updateUser(authChanges);

        if (error) throw error;
      }

      // Update the public profile.
      if (Object.keys(changes).length > 0) {
        const { data, error } = await supabase
          .from('users')
          .update(changes)
          .eq('user_id', user.user_id)
          .select()
          .single();

        if (error) throw error;

        const safe = sanitizeUser(data);
        setUser(safe);

        return safe;
      }

      return user;
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

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return ctx;
}
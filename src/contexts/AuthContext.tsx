import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, UserType } from '../types';
import { INITIAL_USERS } from '../data/seedData';
import {
  LOCAL_STORAGE_KEYS,
  loadFromLocalStorage,
  saveToLocalStorage,
  isValidCollegeEmail,
  isSupabaseConfigured,
  supabase,
} from '../services/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password?: string;
    full_name: string;
    user_type: UserType;
    role?: UserRole;
    phone?: string;
    student_staff_id?: string;
    department?: string;
    campus?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  isCollegeEmailValid: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.USERS, INITIAL_USERS)
  );

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUser = loadFromLocalStorage<UserProfile | null>(LOCAL_STORAGE_KEYS.CURRENT_USER, null);
    // If user has a previously authenticated session in storage, use it; otherwise null
    return savedUser !== undefined ? savedUser : null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync users to local storage
  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.USERS, allUsers);
  }, [allUsers]);

  // Sync current user
  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  const isCollegeEmailValid = (email: string): boolean => {
    return isValidCollegeEmail(email);
  };

  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your campus email address.' };
      }

      // If real Supabase configured:
      if (isSupabaseConfigured && supabase && _password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: _password,
        });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
          const profile: UserProfile = found || {
            id: data.user.id,
            email: cleanEmail,
            full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role: (data.user.user_metadata?.role as UserRole) || 'student',
            user_type: (data.user.user_metadata?.user_type as UserType) || 'student',
            created_at: new Date().toISOString(),
          };
          setCurrentUser(profile);
          setIsLoading(false);
          return { success: true };
        }
      }

      // Local / Offline authentic login
      const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        setCurrentUser(existing);
        setIsLoading(false);
        return { success: true };
      }

      // If user doesn't exist in local accounts
      setIsLoading(false);
      return {
        success: false,
        error: 'No campus account found with this email. Please check your spelling or register a new account.',
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (data: {
    email: string;
    password?: string;
    full_name: string;
    user_type: UserType;
    role?: UserRole;
    phone?: string;
    student_staff_id?: string;
    department?: string;
    campus?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = data.email.trim().toLowerCase();

      // Check email format
      if (!isCollegeEmailValid(cleanEmail)) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Please use a valid college email address (e.g. .edu, .ac.in, or campus.edu).',
        };
      }

      // Check existing
      const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        setIsLoading(false);
        return { success: false, error: 'An account with this campus email already exists. Please sign in instead.' };
      }

      const assignedRole: UserRole =
        data.role ||
        (data.user_type === 'staff' || data.user_type === 'faculty' ? 'faculty' : 'student');

      const newUser: UserProfile = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        email: cleanEmail,
        full_name: data.full_name.trim(),
        user_type: data.user_type,
        role: assignedRole,
        phone: data.phone?.trim(),
        student_staff_id: data.student_staff_id?.trim() || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
        department: data.department?.trim() || 'General Studies',
        campus: data.campus?.trim() || 'Main Campus',
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        created_at: new Date().toISOString(),
      };

      setAllUsers((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    saveToLocalStorage(LOCAL_STORAGE_KEYS.CURRENT_USER, null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!currentUser) return false;
    const updated: UserProfile = {
      ...currentUser,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        isCollegeEmailValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

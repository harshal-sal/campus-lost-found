import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client instance (if configured via environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Validates whether an email belongs to an approved campus domain
 */
export function isValidCollegeEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  const configuredDomains = (
    import.meta.env.VITE_ALLOWED_COLLEGE_DOMAINS ||
    'edu,ac.in,campus.edu,university.edu,college.edu'
  )
    .split(',')
    .map((d: string) => d.trim().toLowerCase());

  const domain = email.split('@')[1].toLowerCase();

  return configuredDomains.some((allowed) => {
    if (allowed.startsWith('.')) {
      return domain.endsWith(allowed.slice(1));
    }
    return domain === allowed || domain.endsWith('.' + allowed) || domain.includes(allowed);
  });
}

/**
 * Storage helpers for persisting data in LocalStorage when Supabase is not connected
 */
export const LOCAL_STORAGE_KEYS = {
  USERS: 'campus_lf_users',
  ITEMS: 'campus_lf_items',
  CLAIMS: 'campus_lf_claims',
  MATCHES: 'campus_lf_matches',
  HANDOVERS: 'campus_lf_handovers',
  NOTIFICATIONS: 'campus_lf_notifications',
  SAVED_ITEMS: 'campus_lf_saved_items',
  REPORTS: 'campus_lf_reports',
  CATEGORIES: 'campus_lf_categories',
  LOCATIONS: 'campus_lf_locations',
  AUDIT_LOGS: 'campus_lf_audit_logs',
  CURRENT_USER: 'campus_lf_current_user',
};

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
}

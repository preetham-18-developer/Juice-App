import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Version: 2026.05.14.01 - Final Lint Fix
 
const sanitizeUrl = (url: string) => {
  if (!url || url.includes('placeholder')) return url;
  if ((url.match(/http/g) || []).length > 1) {
    const parts = url.split('http');
    return 'http' + parts[1].replace(/:$/, '');
  }
  return url;
};

const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Detect platform without hard-depending on react-native for web compatibility
const isWeb = typeof window !== 'undefined';

// Custom storage adapter with web fallback for cross-platform support
const SharedStorageAdapter = {
  getItem: async (key: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    // Mobile logic removed for web-only dashboard build
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
  },
  removeItem: async (key: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
  },
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storage: SharedStorageAdapter as any, // Cast to any to satisfy internal Supabase type constraints while maintaining cross-platform logic
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

/**
 * Unified safe query helper with retries and exponential backoff.
 */
export const safeQuery = async <T = unknown>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  retries = 3,
  delay = 500
): Promise<{ data: T | null; error: unknown }> => {
  let lastError: unknown = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result as { data: T | null; error: unknown };
    } catch (err: unknown) {
      lastError = err;
      const error = err as Error;
      const isNetworkError = error.message?.toLowerCase().includes('network') || 
                            error.message?.toLowerCase().includes('fetch');
      
      if (!isNetworkError || i === retries - 1) break;
      
      const backoff = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  return { data: null, error: lastError };
};

export const getUserRole = async (userId: string): Promise<string> => {
  const { data: profile } = await getSupabase()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role || 'customer';
};

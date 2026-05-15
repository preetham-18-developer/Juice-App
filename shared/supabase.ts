import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (url: string) => {
  if (!url || url.includes('placeholder')) return url;
  // Fix for the recursive URL bug seen in production
  if ((url.match(/http/g) || []).length > 1) {
    const parts = url.split('http');
    return 'http' + parts[1].replace(/:$/, ''); // Take the first valid part
  }
  return url;
};

const supabaseUrl = 'https://juozeonesytttmaizdso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1b3plb25lc3l0dHRtYWl6ZHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTk4MjgsImV4cCI6MjA5MzE3NTgyOH0.dfWHMFp62ET2rGdKVlcLQgQ8ZV9PyMzivEexkZVY6n8';

/**
 * Robust Fetch wrapper with retries and timeouts to handle mobile network instability.
 */
const robustFetch = async (url: string | URL | Request, options?: RequestInit, retries = 2, timeout = 5000): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (err: any) {
      clearTimeout(id);
      if (i < retries - 1) {
        // Wait before retrying
        await new Promise(res => setTimeout(res, 500 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('NETWORK_TIMEOUT');
};

// Custom storage adapter - Intelligent Platform Switching
const SharedStorageAdapter = {
  getItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      const AsyncStorageModule = require('@react-native-async-storage/async-storage');
      const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      const AsyncStorageModule = require('@react-native-async-storage/async-storage');
      const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      const AsyncStorageModule = require('@react-native-async-storage/async-storage');
      const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SharedStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: robustFetch,
  },
});

export const safeQuery = async <T>(queryPromise: Promise<{ data: T | null; error: any }>) => {
  try {
    const { data, error } = await queryPromise;
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Database Query Error:', error);
    return { data: null, error };
  }
};

export const getSupabase = () => supabase;

/**
 * Optimized role fetcher with fallback
 */
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data?.role || 'customer';
  } catch (err) {
    console.error('Role Fetch Error:', err);
    return 'customer';
  }
};

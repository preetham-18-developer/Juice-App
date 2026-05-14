import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Version: 2026.05.13.01 - Force Vercel Refresh

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
const supabaseAnonKey = 'sb_publishable__Xiil3pRsK_lcEnv8dEulQ_Saz4tJSU';

/**
 * Robust Fetch wrapper with retries and timeouts to handle mobile network instability.
 */
const robustFetch = async (url: string | URL | Request, options?: RequestInit, retries = 3, timeout = 20000): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), timeout);
      });

      // Race the fetch against the timeout
      const response = await Promise.race([
        fetch(url, options),
        timeoutPromise
      ]);

      return response as Response;
    } catch (err: any) {
      const isRetryable = err.message === 'TIMEOUT' || 
                         err.message?.toLowerCase().includes('network') || 
                         err.message?.toLowerCase().includes('fetch');
      
      if (isRetryable && i < retries - 1) {
        console.warn(`[Network] Retry attempt ${i + 1} for:`, url);
        // Wait before retrying (exponential backoff)
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Network request failed after multiple retries');
};

// Detect platform correctly for both Web and Native
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Custom storage adapter with web fallback for cross-platform support
const SharedStorageAdapter = {
  getItem: async (key: string) => {
    if (isWeb) {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    try {
      // Try SecureStore first
      const SecureStore = require('expo-secure-store');
      const value = await SecureStore.getItemAsync(key);
      if (value) return value;
      
      // Fallback to AsyncStorage
      const AsyncStorageModule = require('@react-native-async-storage/async-storage');
      const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      try {
        const AsyncStorageModule = require('@react-native-async-storage/async-storage');
        const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
        return await AsyncStorage.getItem(key);
      } catch (inner) {
        return null;
      }
    }
  },
  setItem: async (key: string, value: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      try {
        const AsyncStorageModule = require('@react-native-async-storage/async-storage');
        const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
        await AsyncStorage.setItem(key, value);
      } catch (inner) {}
    }
  },
  removeItem: async (key: string) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return;
    }
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      try {
        const AsyncStorageModule = require('@react-native-async-storage/async-storage');
        const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
        await AsyncStorage.removeItem(key);
      } catch (inner) {}
    }
  },
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: SharedStorageAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: robustFetch as any,
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
  let lastError;
  const client = getSupabase();
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result;
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

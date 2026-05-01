import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Primary: read from EAS build env vars
// Fallback: hardcoded production values (safe — anon key is public-facing)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://tzpmsylelpqzjmfvabga.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cG1zeWxlbHBxemptZnZhYmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzQwMTcsImV4cCI6MjA5MjYxMDAxN30.a8pHx5OubH0ODbWHImt0Ejp2Hj3kAtlI5i14YnkKUXk';

console.log('[Supabase] Initializing with URL:', supabaseUrl);
console.log('[Supabase] Key Prefix:', supabaseAnonKey.substring(0, 10) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


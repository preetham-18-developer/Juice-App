import 'react-native-url-polyfill/auto';
import { supabase } from '@juice-shop/shared';
export { supabase, safeQuery, getUserRole, getSupabase } from '@juice-shop/shared';

/**
 * Health check to verify connection to Supabase
 */
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

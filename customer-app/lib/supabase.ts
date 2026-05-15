/**
 * Unified Supabase Client Proxy
 * All core logic is maintained in the shared library for monorepo consistency.
 */
export { supabase, safeQuery, getUserRole, getSupabase } from '../../shared/supabase';

import { supabase } from '../../shared/supabase';

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

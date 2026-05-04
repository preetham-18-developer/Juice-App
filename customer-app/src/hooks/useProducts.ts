import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (supabaseError) throw supabaseError;

      if (data) {
        setProducts(data);
      }
    } catch (err: any) {
      console.error('[useProducts] Error:', err.message);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Enable Spontaneous (Real-time) Updates
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          console.log('[Realtime] Products table changed, re-fetching...');
          fetchProducts(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    refreshing,
    error,
    refresh: () => fetchProducts(true),
    retry: () => fetchProducts(false),
  };
};

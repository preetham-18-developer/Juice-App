import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, safeQuery } from '../../lib/supabase';
import { Product } from '../types';
import { monitor } from '../services/MonitoringService';
import { ProductService } from '../services/ProductService';

const PAGE_SIZE = 12;

export const useProducts = (options?: { category?: string; search?: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);
  
  const category = options?.category === 'all' ? undefined : options?.category;
  const search = options?.search;

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (fetchingRef.current && !isRefresh) return;
    
    if (isRefresh) {
      pageRef.current = 0;
    } else if (!hasMore) {
      return;
    }

    try {
      fetchingRef.current = true;
      if (isRefresh) setRefreshing(true);
      else if (pageRef.current === 0) setLoading(true);
      
      setError(null);

      await monitor.trackPerformance('FetchProducts', async () => {
        const from = pageRef.current * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('products')
          .select('id, name, description, price, price_per_kg, image_url, category, is_available, rating')
          .range(from, to)
          .order('id', { ascending: true });

        if (category) {
          query = query.ilike('category', `%${category}%`);
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error: supabaseError } = await safeQuery(query as any);

        if (supabaseError) throw supabaseError;

        if (data) {
          const typedData = data as Product[];
          setProducts(prev => isRefresh ? typedData : [...prev, ...typedData]);
          setHasMore(typedData.length === PAGE_SIZE);
          pageRef.current += 1;
          
          // Background prefetch for cinematic performance
          ProductService.prefetchImages(typedData);
        }
      });
    } catch (err: unknown) {
      const error = err as Error;
      monitor.log('ERROR', 'useProducts', 'Fetch failed', { error });
      setError(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, [hasMore, category, search]);

  useEffect(() => {
    fetchProducts(true); // Always refresh when filters change

    const channelId = `products-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setProducts(current => current.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        } else if (payload.eventType === 'INSERT') {
          // Only add if it matches current category to avoid mixing
          if (!category || (payload.new.category && payload.new.category.toLowerCase().includes(category.toLowerCase()))) {
            setProducts(current => [payload.new as Product, ...current]);
          }
        } else if (payload.eventType === 'DELETE') {
          setProducts(current => current.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, search]); // Re-run when filters change

  return {
    products,
    loading,
    refreshing,
    error,
    hasMore,
    loadMore: () => fetchProducts(false),
    refresh: () => fetchProducts(true),
    retry: () => fetchProducts(false),
  };
};

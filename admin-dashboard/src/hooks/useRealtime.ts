"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeConfig = {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
};

/**
 * useRealtime hook for optimized Supabase Realtime subscriptions.
 * Prevents duplicate listeners and ensures clean cleanup.
 */
export function useRealtime(configs: RealtimeConfig[]) {
  const configsRef = useRef(configs);
  
  // Keep configs updated without re-triggering effect if possible
  useEffect(() => {
    configsRef.current = configs;
  }, [configs]);

  const configKey = JSON.stringify(configs.map(c => ({ table: c.table, event: c.event, filter: c.filter })));

  useEffect(() => {
    const channelName = `db-changes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);

    configs.forEach((_, index) => {
      channel.on(
        'postgres_changes',
        {
          event: configs[index].event || '*',
          schema: configs[index].schema || 'public',
          table: configs[index].table,
          filter: configs[index].filter,
        },
        (payload) => {
          configsRef.current[index]?.callback(payload);
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [configKey]); // eslint-disable-line react-hooks/exhaustive-deps
}

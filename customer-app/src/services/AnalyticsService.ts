import { supabase } from '../../lib/supabase';
import { monitor } from './MonitoringService';

export interface KPIStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  conversionRate: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Tracks a conversion event (e.g., Add to Cart, Purchase)
   */
  public async trackEvent(userId: string, eventName: string, properties?: Record<string, any>) {
    try {
      // In an enterprise app, we'd log this to a dedicated 'events' table
      monitor.log('INFO', 'Analytics', `Event: ${eventName}`, { userId, properties });
      
      const { error } = await supabase.from('analytics_events').insert({
        user_id: userId,
        event_name: eventName,
        properties: properties || {},
        platform: 'mobile'
      });
      
      if (error) console.warn("[Analytics] Silent failure logging to DB:", error.message);
    } catch (err) {
      // Analytics should never crash the main app
      console.error("[Analytics] Fatal error:", err);
    }
  }

  /**
   * Fetches Real-time KPI stats for the Admin Dashboard
   */
  public async getKPIs(): Promise<KPIStats> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .neq('status', 'cancelled');

      if (error) throw error;

      const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        conversionRate: 2.4, // Mock for now
      };
    } catch (err) {
      monitor.log('ERROR', 'Analytics', 'Failed to fetch KPIs', { err });
      return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, conversionRate: 0 };
    }
  }
}

export const analytics = AnalyticsService.getInstance();

import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'PERF';

class MonitoringService {
  private static instance: MonitoringService;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Log structured events to console (and ideally to Sentry/LogDNA in production)
   */
  public log(level: LogLevel, context: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: `[JuiceShop:${context}]`,
      message,
      ...(data && { data }),
      platform: Platform.OS,
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry, null, 2));
      // In a real enterprise app, we would call Sentry.captureException here
    } else if (level === 'WARN') {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  /**
   * Measure API or Component performance
   */
  public async trackPerformance<T>(name: string, task: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await task();
      const duration = Date.now() - start;
      this.log('PERF', 'Performance', `${name} took ${duration}ms`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.log('ERROR', 'Performance', `${name} failed after ${duration}ms`, { duration, error });
      throw error;
    }
  }

  /**
   * Track specific business conversion metrics
   */
  public trackMetric(name: string, value: number, tags?: Record<string, string>) {
    // Analytics tracking (e.g., PostHog, Mixpanel, or custom DB table)
    this.log('INFO', 'Metric', `Metric tracked: ${name}=${value}`, { tags });
  }
}

export const monitor = MonitoringService.getInstance();

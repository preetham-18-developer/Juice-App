"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Map as MapIcon, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Clock,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryAnalyticsProps {
  orders: any[];
  partners: any[];
}

export default function DeliveryAnalytics({ orders, partners }: DeliveryAnalyticsProps) {
  // Calculate Stats
  const activeOrders = orders.filter(o => o.delivery_status !== 'delivered' && o.delivery_status !== 'cancelled');
  const deliveredToday = orders.filter(o => o.delivery_status === 'delivered');
  const unavailableOrders = orders.filter(o => o.delivery_status === 'cancelled');
  
  const stats = [
    { label: 'Active Zones', value: '3', icon: Navigation, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Avg Delivery Time', value: '22m', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Unavailable Areas', value: unavailableOrders.length.toString(), icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Fleet Efficiency', value: '94%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coverage Chart (Visual Placeholder for now) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Performance</h3>
              <p className="text-sm text-slate-500 font-bold">Volume vs Speed across all zones</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <BarChart3 size={20} className="text-slate-400" />
            </div>
          </div>
          
          <div className="h-[250px] w-full flex items-end gap-3 justify-between">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="w-full max-w-[40px] bg-primary/20 group-hover:bg-primary transition-colors rounded-t-xl relative"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </motion.div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Z-{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Zone Health */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Zone Health</h3>
          <div className="space-y-6">
            {[
              { zone: 'Central Hub', status: 'Optimal', color: 'text-emerald-500', score: 98 },
              { zone: 'West Corridor', status: 'Busy', color: 'text-amber-500', score: 82 },
              { zone: 'East Sector', status: 'Limited', color: 'text-rose-500', score: 45 },
            ].map((z, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{z.zone}</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", z.color)}>{z.status}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${z.score}%` }}
                    className={cn("h-full", z.color.replace('text', 'bg'))} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-400 hover:border-primary hover:text-primary transition-all">
            View Heatmap Details
          </button>
        </div>
      </div>
    </div>
  );
}

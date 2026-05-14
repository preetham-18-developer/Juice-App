"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  IndianRupee,
  Activity,
  ArrowUpRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import Skeleton from '@/components/ui/Skeleton';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  total_orders: number;
  ltv: number;
  last_order: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    avgLTV: 0
  });

  const fetchCustomers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);

      // Parallel Fetching
      const [profilesResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, user_id, total_amount, created_at')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const profiles = profilesResult.data || [];
      const allOrders = ordersResult.data || [];

      // Create Order Analytics Map
      const orderStatsMap = allOrders.reduce((acc, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { count: 0, total: 0, lastOrder: order.created_at };
        }
        acc[order.user_id].count += 1;
        acc[order.user_id].total += Number(order.total_amount || 0);
        if (new Date(order.created_at) > new Date(acc[order.user_id].lastOrder)) {
          acc[order.user_id].lastOrder = order.created_at;
        }
        return acc;
      }, {} as Record<string, { count: number; total: number; lastOrder: string }>);

      const formatted = profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Anonymous Customer',
        email: profile.email || 'N/A',
        phone: profile.phone || 'N/A',
        created_at: profile.created_at,
        total_orders: orderStatsMap[profile.id]?.count || 0,
        ltv: orderStatsMap[profile.id]?.total || 0,
        last_order: orderStatsMap[profile.id]?.lastOrder || null
      }));

      setCustomers(formatted);

      // Calculate Stats
      const total = formatted.length;
      const active = formatted.filter(c => c.total_orders > 0).length;
      const avgLTV = total > 0 ? formatted.reduce((acc, c) => acc + c.ltv, 0) / total : 0;

      setStats({ total, active, avgLTV });

    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchCustomers();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'profiles', callback: () => fetchCustomers(true) },
    { table: 'orders', callback: () => fetchCustomers(true) }
  ]);

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const displayedCustomers = filteredCustomers.slice(0, displayLimit);

  if (!mounted || (loading && customers.length === 0)) {
    return (
      <AdminLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Loading Customer Database...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">CRM</h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">Customer relationship & lifecycle management</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="card-premium p-2 flex-1 md:w-80 flex items-center gap-3">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-full"
            />
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registered</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Buyers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.active}</h3>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Lifetime Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹{stats.avgLTV.toFixed(0)}</h3>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card-premium overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Customer Info</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Activity</th>
                <th className="px-6 py-5">Lifetime Value</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                        {customer.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{customer.full_name}</p>
                        <p className="text-xs text-slate-500">Joined {format(new Date(customer.created_at), 'MMM yyyy')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Mail size={14} className="text-slate-300" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone size={14} className="text-slate-300" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Package size={14} className="text-primary" />
                        {customer.total_orders} Orders
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Last: {customer.last_order ? formatDistanceToNow(new Date(customer.last_order)) + ' ago' : 'Never'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white">₹{customer.ltv.toLocaleString()}</span>
                      <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${Math.min((customer.ltv / (stats.avgLTV * 2)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-300 hover:text-primary transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {displayedCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                        <Users size={32} />
                      </div>
                      <p className="text-slate-500 font-bold">No customers found matching your search criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && filteredCustomers.length > displayLimit && (
        <div className="flex justify-center pb-10">
          <button 
            onClick={() => setDisplayLimit(prev => prev + 10)}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xs hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2"
          >
            Load More Customers
            <ArrowUpRight size={16} />
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

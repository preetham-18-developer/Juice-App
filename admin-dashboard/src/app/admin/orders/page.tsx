"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Clock, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight,
  Package,
  ShoppingCart,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  IndianRupee,
  Activity,
  Zap,
  Printer
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import Skeleton from '@/components/ui/Skeleton';

const orderStatuses = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING', color: 'bg-amber-500' },
  { label: 'Confirmed', value: 'CONFIRMED', color: 'bg-blue-500' },
  { label: 'Preparing', value: 'PREPARING', color: 'bg-purple-500' },
  { label: 'Packed', value: 'PACKED', color: 'bg-orange-500' },
  { label: 'Delivery', value: 'OUT_FOR_DELIVERY', color: 'bg-indigo-500' },
  { label: 'Delivered', value: 'DELIVERED', color: 'bg-emerald-500' },
];

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchOrders();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'orders', callback: () => fetchOrders(true) }
  ]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      toast({
        title: "Order Updated",
        description: `Status changed to ${status.toLowerCase()}`,
        variant: "success",
      });
      fetchOrders(true);
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (!mounted) return null;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Order Terminal</h1>
          <p className="text-slate-500 font-medium font-outfit">Processing & fulfillment hub</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="card-premium p-2 flex-1 md:w-80 flex items-center gap-3">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Search ID, customer name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-full"
            />
          </div>
          <button className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
        {orderStatuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setActiveTab(s.value)}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2",
              activeTab === s.value 
                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-slate-800 hover:border-primary/30"
            )}
          >
            {s.value !== 'all' && <div className={cn("w-2 h-2 rounded-full", s.color)} />}
            {s.label}
            <span className={cn(
              "ml-1 px-2 py-0.5 rounded-full text-[10px]",
              activeTab === s.value ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}>
              {s.value === 'all' ? orders.length : orders.filter(o => o.status === s.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card-premium overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && orders.length === 0 ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6">
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{order.profiles?.full_name || 'Guest User'}</p>
                      <p className="text-[10px] font-medium text-slate-400">{order.profiles?.phone || 'No phone'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={14} className="text-slate-300" />
                      <span className="text-xs font-medium">{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-900 dark:text-white">₹{order.total_amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all cursor-pointer",
                        order.status === 'DELIVERED' ? "bg-emerald-100 text-emerald-600" :
                        order.status === 'PENDING' ? "bg-amber-100 text-amber-600" :
                        "bg-blue-100 text-blue-600"
                      )}
                    >
                      {orderStatuses.filter(s => s.value !== 'all').map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        {updatingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      </button>
                      <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-slate-900 dark:hover:text-white transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-4">
                        <ShoppingCart size={32} />
                      </div>
                      <p className="text-slate-500 font-bold font-outfit">No orders found in this category.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

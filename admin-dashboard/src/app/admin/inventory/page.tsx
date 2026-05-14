"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  RefreshCcw, 
  ArrowUpRight, 
  History, 
  TrendingUp,
  Plus,
  Minus,
  Loader2,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical';
  lastUpdated: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    low: 0,
    out: 0
  });

  const isFetching = useRef(false);

  const fetchInventory = async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, stock_kg, updated_at')
        .order('stock_kg', { ascending: true });
      
      if (error) throw error;
      
      const formatted: InventoryItem[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        stock: p.stock_kg || 0,
        unit: 'KG',
        status: p.stock_kg > 20 ? 'sufficient' : p.stock_kg > 5 ? 'low' : 'critical',
        lastUpdated: p.updated_at
      }));

      setItems(formatted);

      // Update Stats
      setStats({
        total: formatted.length,
        low: formatted.filter(i => i.status === 'low').length,
        out: formatted.filter(i => i.status === 'critical').length
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchInventory();
  }, []);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'products', callback: () => fetchInventory(true) }
  ]);

  const updateStock = async (id: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    if (newStock === currentStock) return;

    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_kg: newStock })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Inventory Updated",
        description: `Stock level adjusted to ${newStock} units.`,
        variant: "success",
      });
      
      // Local update for immediate feedback
      setItems(items.map(item => item.id === id ? { ...item, stock: newStock } : item));
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted || (loading && items.length === 0)) {
    return (
      <AdminLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Scanning Inventory...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventory</h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">Real-time stock level monitoring</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="card-premium p-2 flex-1 md:w-80 flex items-center gap-3">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Search by product name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-full"
            />
          </div>
          <button 
            onClick={() => fetchInventory()}
            className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-premium p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Package size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total SKU</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.low}</h3>
          </div>
        </div>
        <div className="card-premium p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
            <Minus size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical/Out</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.out}</h3>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5">Product Details</th>
                <th className="px-6 py-5">Current Stock</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Last Activity</th>
                <th className="px-6 py-5 text-right">Inventory Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">No products found.</td>
                </tr>
              ) : filteredItems.slice(0, displayLimit).map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{item.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 dark:text-white">{item.stock}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      item.status === 'sufficient' ? "bg-emerald-100 text-emerald-600" :
                      item.status === 'low' ? "bg-amber-100 text-amber-600" :
                      "bg-rose-100 text-rose-600"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-500 font-medium">
                      {format(new Date(item.lastUpdated), 'MMM d, h:mm a')}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateStock(item.id, item.stock, -1)}
                        disabled={updatingId === item.id || item.stock <= 0}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50"
                      >
                        <Minus size={18} />
                      </button>
                      <button 
                        onClick={() => updateStock(item.id, item.stock, 1)}
                        disabled={updatingId === item.id}
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all disabled:opacity-50"
                      >
                        {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  IndianRupee, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Filter,
  Download,
  Zap,
  Clock,
  Activity,
  Plus,
  Loader2,
  RefreshCcw,
  LayoutGrid,
  Menu,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/store/useStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';

// Dynamic imports for charts to prevent hydration issues
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });

const COLORS = ['#84cc16', '#f97316', '#3b82f6', '#8b5cf6'];

interface SalesData {
  name: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  image: string;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  time: string;
}

interface StatusDistribution {
  name: string;
  value: number;
}

const DashboardPage = () => {
  const { currentStore, setCurrentStore } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0
  });

  const isFetching = React.useRef(false);

  const fetchDashboardData = useCallback(async (isBackground = false) => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      if (!isBackground) setLoading(true);

      // Fetch core data in parallel
      const [ordersResult, profilesResult, productsResult, itemsResult] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id'),
        supabase.from('products').select('id'),
        supabase.from('order_items').select('quantity, subtotal, products(name, image_url)')
      ]);

      const orders = ordersResult.data || [];
      const profiles = profilesResult.data || [];
      const products = productsResult.data || [];
      const orderItems = itemsResult.data || [];

      // 1. Core Stats
      const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      setStats({
        revenue: totalRevenue,
        orders: orders.length,
        customers: profiles.length,
        products: products.length
      });

      // 2. Sales Chart Data (Last 7 Days)
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });

      const chartData = last7Days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr);
        return {
          name: format(date, 'EEE'),
          revenue: dayOrders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0)
        };
      });
      setSalesData(chartData);

      // 3. Status Distribution
      const statusCounts = orders.reduce((acc: Record<string, number>, curr) => {
        const status = curr.status || 'Pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      setStatusDistribution(Object.entries(statusCounts).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), 
        value: value as number 
      })));

      // 4. Recent Orders
      const recent = orders.slice(0, 5).map(o => ({
        id: o.id.slice(0, 8),
        customer: 'Customer', // Placeholder since profile join is complex here
        amount: o.total_amount,
        status: o.status,
        time: format(new Date(o.created_at), 'h:mm a')
      }));
      setRecentOrders(recent);

      // 5. Top Products
      const productMap: Record<string, TopProduct> = {};
      orderItems.forEach((item: { quantity: number, subtotal: number, products: any }) => {
        const product = item.products;
        const prod = Array.isArray(product) ? product[0] : product;
        if (!prod?.name) return;
        
        if (!productMap[prod.name]) {
          productMap[prod.name] = { name: prod.name, sales: 0, revenue: 0, image: prod.image_url };
        }
        productMap[prod.name].sales += Number(item.quantity);
        productMap[prod.name].revenue += Number(item.subtotal);
      });

      setTopProducts(Object.values(productMap)
        .sort((a: any, b: any) => b.sales - a.sales)
        .slice(0, 4) as TopProduct[]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    const ensureStore = async () => {
      if (!currentStore) {
        setCurrentStore({ 
          id: 'default', 
          name: 'Main Store',
          image_url: '',
          status: 'open',
          location: 'Mumbai, India'
        });
      }
    };
    
    ensureStore();
    fetchDashboardData();
  }, [currentStore, setCurrentStore, fetchDashboardData]);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'orders', callback: () => fetchDashboardData(true) },
    { table: 'products', callback: () => fetchDashboardData(true) }
  ]);

  if (!mounted) return null;

  if (loading && stats.orders === 0) {
    return (
      <AdminLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Initializing Dashboard Engine...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header with Store Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live System Active</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-slate-500 font-medium font-outfit">Main Store Command Center</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button className="px-6 py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-black shadow-sm">Today</button>
            <button className="px-6 py-2.5 text-slate-500 rounded-xl text-xs font-black">7 Days</button>
            <button className="px-6 py-2.5 text-slate-500 rounded-xl text-xs font-black">30 Days</button>
          </div>
          <button 
            onClick={() => fetchDashboardData()}
            className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Revenue', value: `₹${(stats.revenue / 1000).toFixed(1)}k`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+12.5%' },
          { label: 'Total Orders', value: stats.orders.toString(), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+8.2%' },
          { label: 'New Customers', value: stats.customers.toString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: '+5.4%' },
          { label: 'Catalog SKU', value: stats.products.toString(), icon: Package, color: 'text-rose-500', bg: 'bg-rose-500/10', trend: 'Live' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-premium p-6 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">
                {stat.trend}
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 card-premium p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Revenue Stream</h3>
              <p className="text-xs text-slate-500 font-medium">Performance over last 7 operating days</p>
            </div>
            <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary transition-colors">
              <Download size={18} />
            </button>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    padding: '16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#84cc16" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie */}
        <div className="card-premium p-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Fulfillment</h3>
          <p className="text-xs text-slate-500 font-medium mb-8">Current order lifecycle distribution</p>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            {statusDistribution.map((status, i) => (
              <div key={status.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{status.name}</span>
                <span className="text-[10px] font-black text-slate-900 ml-auto">{status.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* Recent Orders Table */}
        <div className="card-premium p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent Activity</h3>
            <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All Terminal</button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl group hover:bg-primary/5 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">Order #{order.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{order.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white">₹{order.amount}</p>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    order.status === 'DELIVERED' ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="card-premium p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Hot Sellers</h3>
            <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Catalog</button>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl group hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md">
                    <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{product.sales} units moved</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white">₹{product.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Gross Growth</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;

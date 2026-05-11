"use client";
 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Download,
  Calendar,
  Loader2
} from 'lucide-react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppStore } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';
import dynamic from 'next/dynamic';

// Dynamic imports for charts to reduce bundle size and speed up initial load
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

const StatCard = React.memo(({ title, value, icon: Icon, trend, trendValue, color, loading }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="card-premium p-6 flex flex-col gap-4"
  >
    <div className="flex justify-between items-start">
      {loading ? (
        <Skeleton className="w-12 h-12 rounded-2xl" />
      ) : (
        <div className={cn("p-3 rounded-2xl", color)}>
          <Icon size={24} className="text-white" />
        </div>
      )}
      {trend && !loading && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-bold",
          trend === 'up' ? "text-emerald-500" : "text-rose-500"
        )}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
      {loading ? (
        <Skeleton className="h-9 w-28" />
      ) : (
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
      )}
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

const IndianRupee = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="m6 13 8.5 8" />
    <path d="M6 13h3" />
    <path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

const DashboardPage = () => {
  const params = useParams();
  const storeId = params?.storeId as string;
  const { currentStore, setCurrentStore } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState(currentStore?.name || 'Store');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0
  });

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Separate Effect for Store Metadata to avoid loops
  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!storeId) return;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
      if (!isUuid) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .maybeSingle();
      
      if (storeData) {
        setStoreName(storeData.name);
        setCurrentStore(storeData as any);
      }
    };

    fetchStoreDetails();
  }, [storeId, setCurrentStore]);

  const fetchDashboardData = React.useCallback(async (isBackground = false) => {
    if (!storeId) return;
    
    // Validate storeId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
    if (!isUuid) return;

    try {
      if (!isBackground) setLoading(true);

      const [ordersResult, productsResult, profilesResult, orderItemsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*, profiles:user_id(full_name)')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('order_items')
          .select('*, orders!inner(store_id), products:product_id(name, image_url)')
          .eq('orders.store_id', storeId)
      ]);
      
      // Check for errors before processing
      if (ordersResult.error) throw ordersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (orderItemsResult.error) throw orderItemsResult.error;

      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const customerCount = profilesResult.count || 0;
      const orderItems = orderItemsResult.data || [];

      // Process Stats
      const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      setStats({
        revenue: totalRevenue,
        orders: orders.length,
        customers: customerCount,
        products: products.length
      });

      // Process Sales Chart (Last 7 Days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          name: format(date, 'EEE'),
          date: format(date, 'yyyy-MM-dd'),
          sales: 0,
          orders: 0
        };
      });

      orders.forEach(order => {
        try {
          const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd');
          const day = last7Days.find(d => d.date === orderDate);
          if (day) {
            day.sales += Number(order.total_amount) || 0;
            day.orders += 1;
          }
        } catch (e) {
          console.error("Date parsing error for order:", order.id, e);
        }
      });
      setSalesData(last7Days);

      // Process Top Products
      const productStats = orderItems.reduce((acc: any, curr: any) => {
        const prodData = Array.isArray(curr.products) ? curr.products[0] : curr.products;
        const prodName = prodData?.name || 'Unknown';
        if (!acc[prodName]) {
          acc[prodName] = { 
            name: prodName, 
            sales: 0, 
            image: prodData?.image_url || 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=100' 
          };
        }
        acc[prodName].sales += Number(curr.quantity) || 0;
        return acc;
      }, {});
      setTopProducts(Object.values(productStats).sort((a: any, b: any) => b.sales - a.sales).slice(0, 4));

      // Process Recent Orders
      setRecentOrders(orders.slice(0, 5).map(o => {
        const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
        let timeLabel = 'recently';
        try {
          timeLabel = formatDistanceToNow(new Date(o.created_at)) + ' ago';
        } catch (e) {}
        
        return {
          id: o.id.slice(0, 8),
          customer: profile?.full_name || 'Guest',
          status: o.status,
          amount: Number(o.total_amount) || 0,
          time: timeLabel
        };
      }));

      // Process Status Distribution
      const distribution = orders.reduce((acc: any, curr) => {
        const status = curr.status?.toUpperCase() || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const distArray = Object.keys(distribution).map(key => ({
        name: key,
        value: distribution[key]
      }));
      setStatusDistribution(distArray);

    } catch (err) {
      console.error('Critical Error in Dashboard Data Fetch:', err);
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [storeId]); // Only recreate when storeId changes

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // REALTIME AUTO-REFRESH
  useRealtime([
    { table: 'orders', callback: () => fetchDashboardData(true) },
    { table: 'products', callback: () => fetchDashboardData(true) },
    { table: 'profiles', callback: () => fetchDashboardData(true) },
    { table: 'order_items', callback: () => fetchDashboardData(true) }
  ]);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{storeName} Analytics</h1>
          <p className="text-slate-500">Real-time performance overview for this branch</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDashboardData()}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-primary transition-all"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.revenue.toLocaleString()}`} 
          icon={IndianRupee} 
          trend="up" 
          trendValue="+100%" 
          color="bg-emerald-500"
          loading={loading}
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orders.toString()} 
          icon={ShoppingCart} 
          trend="up" 
          trendValue="+100%" 
          color="bg-blue-500" 
          loading={loading}
        />
        <StatCard 
          title="Active Customers" 
          value={stats.customers.toString()} 
          icon={Users} 
          color="bg-purple-500" 
          loading={loading}
        />
        <StatCard 
          title="Stock Items" 
          value={stats.products.toString()} 
          icon={Package} 
          color="bg-orange-500" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 card-premium p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Daily sales performance (7-day trend)</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {loading ? (
              <div className="h-full flex flex-col gap-4">
                <div className="flex justify-between items-end h-full px-4 pb-4">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="w-[10%] bg-primary/10 animate-pulse rounded-t-xl" style={{ height: `${20 + (i * 10)}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      backgroundColor: '#fff' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#84cc16" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Top Products</h3>
          <div className="space-y-6">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : topProducts.length === 0 ? (
              <p className="text-center text-slate-400 py-10">No sales data yet.</p>
            ) : topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-slate-500">Total Units Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{product.sales}</p>
                  <p className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">Sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-premium p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 pr-4">Order ID</th>
                  <th className="pb-4 pr-4">Customer</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      <td className="py-4 pr-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 pr-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-4 pr-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="py-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : recentOrders.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300">#{item.id}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-800 dark:text-white">{item.customer}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        item.status === 'DELIVERED' || item.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 dark:text-white">₹{item.amount.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Order Status Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
              ) : statusDistribution.map((status, i) => (
                <div key={status.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-l-4" style={{ borderColor: COLORS[i % COLORS.length] }}>
                  <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">{status.name}</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{status.value}</span>
                </div>
              ))}
            </div>
            
            <div className="h-[200px] flex items-center justify-center">
              {loading ? (
                <Skeleton className="w-32 h-32 rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
 
export default DashboardPage;

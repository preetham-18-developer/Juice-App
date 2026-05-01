'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, TrendingUp, CheckCircle, Clock } from 'lucide-react';

import { Order } from '@/types';

const KpiCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: '₹0',
    totalOrders: '0',
    completed: '0',
    pending: '0',
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orders) {
        const total = orders.reduce((sum: number, o: Order) => sum + (o.total_amount || 0), 0);
        const completed = orders.filter((o: Order) => o.status === 'completed').length;
        const pending = orders.filter((o: Order) => ['received', 'processing'].includes(o.status)).length;

        setStats({
          totalRevenue: `₹${total.toLocaleString('en-IN')}`,
          totalOrders: String(orders.length),
          completed: String(completed),
          pending: String(pending),
        });
        setRecentOrders((orders as unknown as Order[]).slice(0, 3));
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-600';
      case 'processing': return 'bg-yellow-100 text-yellow-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Revenue" value={loading ? '...' : stats.totalRevenue} icon={TrendingUp} color="bg-red-500" />
        <KpiCard title="Total Orders" value={loading ? '...' : stats.totalOrders} icon={ShoppingBag} color="bg-blue-500" />
        <KpiCard title="Completed" value={loading ? '...' : stats.completed} icon={CheckCircle} color="bg-green-500" />
        <KpiCard title="Pending" value={loading ? '...' : stats.pending} icon={Clock} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No orders yet. Place one from the app!</div>
            ) : recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString()} • {order.payment_type?.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{order.total_amount}</p>
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/orders" className="block w-full mt-6 text-center text-sm text-[#EF4444] font-semibold hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Top Selling Items</h3>
          <div className="space-y-4">
            {[
              { name: 'Apple Juice (Very Pure)', pct: 80 },
              { name: 'Mango (Fruit)', pct: 65 },
              { name: 'Orange Juice (Normal)', pct: 50 },
              { name: 'Watermelon (Fruit)', pct: 40 },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 w-40">{item.name}</span>
                <div className="flex items-center space-x-2 flex-1 ml-4">
                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${item.pct}%` }}></div>
                  </div>
                  <span className="text-xs font-medium w-8">{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

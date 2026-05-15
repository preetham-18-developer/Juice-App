"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  ChevronDown,
  Store,
  Moon,
  Sun,
  Zap,
  Loader2
} from 'lucide-react';
import { useAppStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import { Toaster } from '@/components/ui/Toaster';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const currentStore = useAppStore(state => state.currentStore);
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const [authLoading, setAuthLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isInitialized = React.useRef(false);
  const checkAuthInProgress = React.useRef(false);

  useEffect(() => {
    if (isInitialized.current || checkAuthInProgress.current) return;

    const checkAuth = async () => {
      checkAuthInProgress.current = true;
      try {
        // 1. CHECK FOR SSO TOKENS IN URL FIRST
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!sessionError) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
        const CUSTOMER_APP_URL = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || 
                               (isVercel 
                                 ? `https://${window.location.hostname.replace('admin-dashboard', 'customer-app')}`
                                 : "https://juicy-app.vercel.app");

        if (!session) {
          window.location.href = `${CUSTOMER_APP_URL}/login`;
          return;
        }

        // FETCH ROLE FROM DATABASE (Source of Truth)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role || 'user';
        const isAdmin = role === 'admin' || role === 'super_admin' || role === 'store_admin';

        if (!isAdmin) {
          console.error('Unauthorized admin dashboard access attempt by:', session.user.email);
          
          if (typeof window !== 'undefined') {
            localStorage.clear();
          }
          window.location.href = `${CUSTOMER_APP_URL}/login?error=unauthorized`;
          return;
        }

        // Update store with fresh data
        setUser({
          id: session.user.id,
          name: profile?.full_name || 'Admin User',
          role: role,
          email: session.user.email
        });

        // AUTO-LOAD STORE INFO if not set
        if (!currentStore) {
          useAppStore.getState().setCurrentStore({
            id: 'default',
            name: 'Main Store',
            location: 'Digital Shop',
            image_url: '',
            status: 'open'
          });
        }
        
        isInitialized.current = true;
      } catch (err) {
        console.error("Auth Guard error:", err);
      } finally {
        setAuthLoading(false);
        checkAuthInProgress.current = false;
      }
    };

    checkAuth();
  }, [setUser]); // Reduced dependencies to prevent redundant runs

  useEffect(() => {
    // GLOBAL REALTIME NOTIFICATIONS
    const orderChannel = supabase
      .channel('global-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          toast({
            title: "🚀 New Order Received!",
            description: `A new order (#${payload.new.id.slice(0, 8)}) has been placed for ₹${payload.new.total_amount}.`,
            variant: "success",
          });
          
          // Play a subtle sound if possible or other feedback
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, []);

  // Memoized Sidebar and Navbar to prevent unnecessary re-renders
  const memoizedSidebar = React.useMemo(() => (
    <Sidebar 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed} 
      isOpenMobile={isOpenMobile}
      setIsOpenMobile={setIsOpenMobile}
    />
  ), [isCollapsed, isOpenMobile, user, currentStore]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans selection:bg-primary/10">
      {memoizedSidebar}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => setIsOpenMobile(true)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Menu size={22} />
              </button>
              
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none w-full max-w-md group">
                <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search commands, orders..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-medium"
                />
              </div>

              {/* Removed Mobile Store Badge */}
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
 
 
               <button 
                onClick={() => router.push('/admin/settings')}
                className="flex items-center gap-2 p-1.5 lg:p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {authLoading ? (
                  <Skeleton className="w-8 h-8 rounded-xl" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-black text-xs">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-10 scroll-smooth custom-scrollbar will-change-scroll">
          <AnimatePresence mode="wait">
            {authLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center space-y-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="text-primary animate-pulse" size={24} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Securing Session</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Preparing your dashboard...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto w-full max-w-[1600px]"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mobile Bottom Spacer for Floating Actions */}
          <div className="h-20 lg:hidden" />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

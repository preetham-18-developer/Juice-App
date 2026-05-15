"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Use a more robust production-ready fallback URL
        const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
        const CUSTOMER_APP_URL = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || 
                                (isVercel
                                  ? `https://${window.location.hostname.replace('admin-dashboard', 'customer-app')}`
                                  : "https://juicy-app.vercel.app");

        if (!session) {
          // If we can't find a customer app, just go to a relative login if it exists, 
          // but for this monorepo we usually expect them to be separate.
          // We'll add a check to see if we're on the same domain.
          window.location.href = `${CUSTOMER_APP_URL}/login`;
          return;
        }

        // FETCH ROLE FROM DATABASE (Source of Truth)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role || 'user';
        const isAdmin = role === 'admin' || role === 'super_admin' || role === 'store_admin';

        if (isAdmin) {
          router.replace('/admin/dashboard');
        } else {
          // Not an admin? Send them to the customer experience
          window.location.href = CUSTOMER_APP_URL;
        }
      } catch (err) {
        console.error("Redirect check failed:", err);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium font-outfit">Redirecting you to the right place...</p>
      </div>
    </div>
  );
}

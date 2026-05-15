"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const CUSTOMER_APP_URL = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || "https://juicy-app.vercel.app";

        if (!session) {
          router.push('/login');
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
          router.push('/login');
        }
      } catch (err) {
        console.error("Redirect check failed:", err);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium font-outfit">Redirecting you to the right place...</p>
        </div>
      </div>
    );
  }

  // Only reached if session is null and we are on Vercel with no CUSTOMER_APP_URL configured
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">!</div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Login Required</h1>
        <p className="text-slate-500 font-medium mb-8">Please login via the Customer App to access the Admin Dashboard.</p>
        <a 
          href={process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || "https://juicy-app.vercel.app/login"}
          className="block w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}

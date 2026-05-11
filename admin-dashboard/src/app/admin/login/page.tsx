"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Loader2
} from 'lucide-react';

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'super_admin' || profile?.role === 'store_admin' || profile?.role === 'admin') {
          router.push('/admin/stores');
          return;
        }
      }
      setCheckingSession(false);
    };

    const autoLogin = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const ssoError = searchParams.get('error');

      if (ssoError === 'unauthorized') {
        setError('Access denied. You do not have admin privileges.');
      }

      if (accessToken && refreshToken) {
        setLoading(true);
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) throw sessionError;

          if (data.user) {
            router.push('/admin/stores');
          }
        } catch (err: any) {
          console.error('SSO Error:', err.message);
          setError('Automatic login failed. Please login manually.');
          setCheckingSession(false);
          setLoading(false);
        }
      } else {
        checkExistingSession();
      }
    };

    autoLogin();
  }, [searchParams, router]);

  const validateEmail = (val: string) => {
    if (!val) return "Please enter your email";
    if (!/\S+@\S+\.\S+/.test(val)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return "Please enter your password";
    if (val.length < 6) return "Password must contain at least 6 characters";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    
    if (eErr || pErr) {
      setEmailError(eErr);
      setPasswordError(pErr);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!profile || (profile.role !== 'super_admin' && profile.role !== 'store_admin' && profile.role !== 'admin')) {
        await supabase.auth.signOut();
        throw new Error('Access denied: Unauthorized role');
      }

      router.push('/admin/stores');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/30"
        >
          <Zap size={40} className="text-white" fill="currentColor" />
        </motion.div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Juicy App</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Admin Intelligence Dashboard</p>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full bg-white dark:bg-slate-900 p-8 lg:p-10 relative overflow-hidden rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800"
      >
        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
          <ShieldCheck size={120} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className={cn(
                "absolute left-5 top-1/2 -translate-y-1/2 transition-colors",
                emailError && touched.email ? "text-rose-500" : "text-slate-400 group-focus-within:text-primary"
              )} size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) setEmailError(validateEmail(e.target.value));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, email: true }));
                  setEmailError(validateEmail(email));
                }}
                placeholder="admin@juicyapp.com"
                className={cn(
                  "w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-medium text-slate-800 dark:text-white outline-none transition-all",
                  emailError && touched.email 
                    ? "border-rose-500/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10 focus:ring-rose-500/10" 
                    : "border-transparent focus:ring-4 focus:ring-primary/10"
                )}
              />
            </div>
            <AnimatePresence>
              {emailError && touched.email && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-rose-500 text-[10px] font-bold ml-1 flex items-center gap-1"
                >
                  <AlertCircle size={10} />
                  {emailError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className={cn(
                "absolute left-5 top-1/2 -translate-y-1/2 transition-colors",
                passwordError && touched.password ? "text-rose-500" : "text-slate-400 group-focus-within:text-primary"
              )} size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) setPasswordError(validatePassword(e.target.value));
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, password: true }));
                  setPasswordError(validatePassword(password));
                }}
                placeholder="••••••••"
                className={cn(
                  "w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-medium text-slate-800 dark:text-white outline-none transition-all",
                  passwordError && touched.password 
                    ? "border-rose-500/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10 focus:ring-rose-500/10" 
                    : "border-transparent focus:ring-4 focus:ring-primary/10"
                )}
              />
            </div>
            <AnimatePresence>
              {passwordError && touched.password && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-rose-500 text-[10px] font-bold ml-1 flex items-center gap-1"
                >
                  <AlertCircle size={10} />
                  {passwordError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button 
            type="submit"
            disabled={loading || checkingSession}
            className={cn(
              "w-full py-5 rounded-[2rem] font-black shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]",
              loading || checkingSession
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white shadow-primary/25 hover:scale-[1.02] hover:shadow-primary/40"
            )}
          >
            {loading || checkingSession ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Enter Dashboard</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-slate-400 text-xs font-bold uppercase tracking-widest">
          Secured by Supabase & Juicy App Cloud
        </p>
      </motion.div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Initializing Auth...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
};

export default LoginPage;

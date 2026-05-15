// @ts-nocheck
// Suppressing harmless React 18/19 ReactNode monorepo conflicts
import 'react-native-gesture-handler';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { 
  Outfit_400Regular, 
  Outfit_600SemiBold, 
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  Poppins_400Regular, 
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { 
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold 
} from '@expo-google-fonts/cormorant-garamond';
import { useFonts } from 'expo-font';
import { supabase } from '../lib/supabase';
import { Session, RealtimeChannel } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/store/ThemeContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { IntroSequence } from '../src/components/ui/IntroSequence';
import { Platform, View, StyleSheet } from 'react-native';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import { useRef } from 'react';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn('Splash screen error:', e);
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // INSTRUMENTATION: Render Tracker
  const renderCount = React.useRef(0);
  renderCount.current++;
  console.log(`[RootLayout] Render #${renderCount.current} | Session: ${session ? 'Active' : 'Null'} | Role: ${userRole || 'Pending'}`);

  const [showWebIntro, setShowWebIntro] = useState(() => {
    if (Platform.OS !== 'web') return false;
    try {
      return sessionStorage.getItem('hasSeenIntro') !== 'true';
    } catch {
      return true;
    }
  });
  const segments = useSegments();
  const router = useRouter();
  const toastRef = useRef<ToastHandle>(null);

  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  });

  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    const fTimer = setTimeout(() => {
      console.log('[Boot] Font timeout reached, forcing render');
      setFontTimeout(true);
    }, 800);
    return () => clearTimeout(fTimer);
  }, []);

  useEffect(() => {
    // Safety fallback: if auth takes too long, just initialize
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.log('[Boot] Auth timeout reached, forcing initialization');
        setInitialized(true);
      }
    }, 1000);

    // Check initial session safely
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session) {
        setSession(session);
        
        // Safety timeout for role fetch: if it takes > 2s, default to customer
        const roleTimeout = setTimeout(() => {
          if (!userRole) {
            console.log('[Boot] Role fetch timed out, defaulting to customer');
            setUserRole('customer');
          }
        }, 2000);

        // FETCH ROLE BEFORE INITIALIZING
        try {
          console.log(`[Boot] Fetching role for: ${session.user.id}`);
          const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
          const role = data?.role || 'customer';
          clearTimeout(roleTimeout);
          setUserRole(role);
          console.log(`[Boot] Session active, Role verified: ${role}`);
          setupGlobalNotifications(session.user.id);
        } catch (e) {
          clearTimeout(roleTimeout);
          console.error('[Boot] Role fetch failed:', e);
          setUserRole('customer');
        }
      }
      setInitialized(true);
    }).catch(() => {
      clearTimeout(timeout);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event} | User: ${session?.user?.email || 'None'} | Time: ${new Date().toISOString()}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session?.user) {
          console.log(`[Auth] Fetching role for user: ${session.user.id}`);
          try {
            const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
            const role = data?.role || 'customer';
            console.log(`[Auth] Role verified: ${role}`);
            setUserRole(role);
            setupGlobalNotifications(session.user.id);
          } catch (err) {
            console.error('[Auth] Role fetch error:', err);
            setUserRole('customer');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] Clearing session and role');
        setSession(null);
        setUserRole(null);
        if (orderChannel) {
          supabase.removeChannel(orderChannel);
          orderChannel = null;
        }
      }
    });

    // GLOBAL CUSTOMER NOTIFICATIONS
    let orderChannel: RealtimeChannel | null = null;

    async function setupGlobalNotifications(userId: string) {
      if (orderChannel) {
        await supabase.removeChannel(orderChannel);
      }

      orderChannel = supabase
        .channel(`global_customer_orders_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            const oldStatus = payload.old.status;
            
            if (newStatus !== oldStatus) {
              toastRef.current?.show(`Order Status Update: Your order is now ${newStatus.toUpperCase()}! 🥤`, 'info');
            }
          }
        )
        .subscribe();
    }

    // Initial setup if session already exists
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setupGlobalNotifications(user.id);
    });

    return () => {
      authSubscription.unsubscribe();
      if (orderChannel) supabase.removeChannel(orderChannel);
    };
  }, []);

  useEffect(() => {
    if (!initialized || (!fontsLoaded && !fontTimeout) || showWebIntro) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = !segments.length || segments[0] === 'index';

    if (!session || !session.user) {
      if (!inAuthGroup) {
        console.log("[Auth] No session, redirecting to login");
        router.replace('/login');
      }
    } else {
      // Direct routing based on Role (Source of Truth)
      // IMPORTANT: We wait for userRole to be non-null to avoid flicker misrouting.
      if (userRole === null) {
        console.log("[Auth] Session active, waiting for role for precision routing...");
        return;
      }

      const isAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'store_admin';
      
      if (isAdmin) {
        if (segments[0] !== 'admin') {
          console.log(`[Auth] Admin detected (${userRole}), directing to /admin`);
          router.replace('/admin');
        }
      } else {
        if (inAuthGroup || isRoot || segments[0] === 'admin') {
          console.log(`[Auth] Customer detected (${userRole}), directing to /(tabs)`);
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, initialized, segments, fontsLoaded, fontTimeout, userRole]);

  useEffect(() => {
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  if (!fontsLoaded && !fontError && !fontTimeout) {
    return null;
  }

  // NOTE: We no longer block on "Verifying Administrator Privileges..."
  // The redirect logic in the useEffect handles role-based routing smoothly in the background.
  // This makes the app feel "instant" like an MNC-grade platform.

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <SafeAreaProvider>
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#ffffff',
                  },
                  headerTintColor: '#10b981',
                  headerTitleStyle: {
                    fontFamily: 'Outfit_700Bold',
                    fontWeight: '700',
                  },
                  headerShadowVisible: false,
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false }} />
                <Stack.Screen name="payment" options={{ title: 'Secure Payment' }} />
                <Stack.Screen name="product/[id]" options={{ title: 'Fresh Pick' }} />
                <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
              </Stack>
              <Toast ref={toastRef} />
              {Platform.OS === 'web' && showWebIntro && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 99999, backgroundColor: 'black' }]}>
                  <IntroSequence onComplete={() => setShowWebIntro(false)} />
                </View>
              )}
              <StatusBar style="auto" />
            </View>
          </SafeAreaProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}


import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Outfit_400Regular, 
  Outfit_600SemiBold, 
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  Poppins_400Regular, 
  Poppins_600SemiBold 
} from '@expo-google-fonts/poppins';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/store/ThemeContext';
import { View, StyleSheet } from 'react-native';

import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn('Splash screen error:', e);
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    // Check initial session safely
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    }).catch(err => {
      console.error("Supabase Auth Error on boot:", err);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = !segments.length || segments[0] === 'index';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/signup');
      }
    } else {
      const checkAdmin = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Profile Fetch Error:", error.message);
            if (inAuthGroup || isRoot) {
              router.replace('/(tabs)');
            }
            return;
          }

          if (data?.role === 'admin') {
            if (segments[0] !== 'admin') {
              router.replace('/admin');
            }
          } else if (inAuthGroup || isRoot) {
            router.replace('/(tabs)');
          }
        } catch (err: any) {
          console.error("Layout Role Check Error:", err);
          if (inAuthGroup || isRoot) {
            router.replace('/(tabs)');
          }
        }
      };
      checkAdmin();
    }
  }, [session, initialized, segments, fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
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
                },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="admin/index" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ title: 'Fresh Pick' }} />
              <Stack.Screen name="cart" options={{ title: 'My Basket', presentation: 'modal' }} />
              <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
            </Stack>
          </View>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

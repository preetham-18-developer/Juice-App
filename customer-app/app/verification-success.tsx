import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle, ArrowRight, Mail, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  ZoomIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../src/theme/tokens';

const { width } = Dimensions.get('window');

export default function VerificationSuccessScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleTryNow = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <Animated.View 
          entering={ZoomIn.duration(800).springify()}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={[COLORS.primaryGreen, '#059669']}
            style={styles.iconGradient}
          >
            <CheckCircle size={60} color={COLORS.white} />
          </LinearGradient>
          <Animated.View 
            entering={FadeInUp.delay(400)}
            style={styles.sparkle1}
          >
            <Sparkles size={24} color={COLORS.primaryGreen} opacity={0.6} />
          </Animated.View>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(600).springify()}
          style={styles.textSection}
        >
          <Text style={styles.title}>Email Verified Successfully</Text>
          <Text style={styles.subtitle}>Your account is now fully active</Text>
          <Text style={styles.description}>
            You can now start exploring all features and enjoy fresh harvests delivered to your door.
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(800).springify()}
          style={styles.userContext}
        >
          <View style={styles.contextCard}>
            <Mail size={16} color={COLORS.mutedGray} />
            <Text style={styles.contextText}>Logged in as: <Text style={styles.emailText}>{userEmail}</Text></Text>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(1000).springify()}
          style={styles.footer}
        >
          <TouchableOpacity 
            activeOpacity={0.9}
            style={styles.btnContainer}
            onPress={handleTryNow}
          >
            <LinearGradient
              colors={[COLORS.primaryGreen, '#059669']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Try Now</Text>
              <ArrowRight size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    marginBottom: 40,
    position: 'relative',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    fontSize: 26,
    marginBottom: 12,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.primaryGreen,
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    ...TYPOGRAPHY.subtext,
    textAlign: 'center',
    lineHeight: 22,
    color: COLORS.mutedGray,
  },
  userContext: {
    marginBottom: 60,
    width: '100%',
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  contextText: {
    fontSize: 13,
    color: COLORS.mutedGray,
    fontWeight: '500',
  },
  emailText: {
    color: COLORS.darkText,
    fontWeight: '700',
  },
  footer: {
    width: '100%',
  },
  btnContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
});

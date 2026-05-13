import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { 
  FadeInUp, 
  ZoomIn, 
} from 'react-native-reanimated';
import { 
  XCircle, 
  RefreshCcw, 
  ShoppingBag,
  Headphones,
} from 'lucide-react-native';
import { COLORS } from '../src/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function OrderFailureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { error = 'Payment was declined by the bank.' } = params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.duration(600)} style={styles.iconContainer}>
          <LinearGradient
            colors={['#FECACA', '#EF4444']}
            style={styles.iconGradient}
          >
            <XCircle size={60} color="#FFFFFF" strokeWidth={3} />
          </LinearGradient>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>
            We couldn't process your payment. {error}
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(500).duration(600)}
          style={styles.actions}
        >
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#EF4444', '#B91C1C']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <RefreshCcw size={20} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cartBtn}
            onPress={() => router.replace('/(tabs)/cart')}
          >
            <ShoppingBag size={20} color="#64748b" />
            <Text style={styles.cartBtnText}>Back to Cart</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.helpBox}
        >
          <Headphones size={20} color="#64748b" />
          <Text style={styles.helpText}>
            Need help? Contact our support via WhatsApp
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    marginTop: 48,
    gap: 16,
  },
  retryBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  cartBtnText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700',
  },
  helpBox: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helpText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});

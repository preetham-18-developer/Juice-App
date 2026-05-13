import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { 
  FadeInUp, 
  ZoomIn, 
  SlideInDown,
} from 'react-native-reanimated';
import { 
  CheckCircle2, 
  ShoppingBag, 
  MapPin, 
  ChevronRight,
  ArrowRight,
  Receipt,
} from 'lucide-react-native';
import { COLORS } from '../src/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    orderId, 
    amount, 
    eta = '30-45 mins',
    address = 'Default Address',
    paymentType = 'online'
  } = params;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Animation Section */}
        <View style={styles.header}>
          <Animated.View entering={ZoomIn.duration(600)} style={styles.iconContainer}>
            <LinearGradient
              colors={['#4ADE80', '#22C55E']}
              style={styles.iconGradient}
            >
              <CheckCircle2 size={60} color="#FFFFFF" strokeWidth={3} />
            </LinearGradient>
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your fresh harvest is being prepared with care.
            </Text>
          </Animated.View>
        </View>

        {/* Order Info Card */}
        <Animated.View 
          entering={SlideInDown.delay(500).duration(600)}
          style={styles.card}
        >
          <View style={styles.cardRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Order Number</Text>
              <Text style={styles.infoValue}>#{orderId?.toString().slice(0, 8).toUpperCase() || 'JUICY-123'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Estimated Time</Text>
              <Text style={[styles.infoValue, { color: '#F97316' }]}>{eta}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MapPin size={18} color="#94a3b8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{address}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Receipt size={18} color="#94a3b8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Total Amount Paid</Text>
              <Text style={styles.detailValue}>₹{amount} • {paymentType === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.actions}
        >
          <TouchableOpacity 
            style={styles.trackBtn}
            onPress={() => router.replace(`/orders/${orderId}` as any)}
          >
            <LinearGradient
              colors={[COLORS.primaryGreen || '#3A8C3F', '#2d6a31']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.trackBtnText}>Track Your Order</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.homeBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Freshness Pledge */}
        <Animated.View 
          entering={FadeInUp.delay(1000).duration(600)}
          style={styles.pledgeCard}
        >
          <ShoppingBag size={24} color="#22C55E" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.pledgeTitle}>Freshness Guaranteed</Text>
            <Text style={styles.pledgeDesc}>
              Every item is freshly handpicked and sealed just for you.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  scroll: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: '#22C55E',
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
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  actions: {
    padding: 24,
    marginTop: 12,
  },
  trackBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#3A8C3F',
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
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  homeBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  homeBtnText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '700',
  },
  pledgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    marginHorizontal: 24,
    marginBottom: 40,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  pledgeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
  },
  pledgeDesc: {
    fontSize: 13,
    color: '#166534',
    opacity: 0.8,
    marginTop: 2,
  },
});

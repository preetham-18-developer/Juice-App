import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../src/store/useCartStore';
import { Trash2, Plus, Minus, ChevronRight, ShoppingBag, CreditCard, Banknote, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Toast, ToastHandle } from '../../src/components/ui/Toast';
import { ProductService } from '../../src/services/ProductService';
import AddressPicker, { AddressData } from '../../src/components/AddressPicker';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { NotificationService } from '../../src/services/NotificationService';
import { OrderTrackingService } from '../../src/services/orderTrackingService';
import { COLORS } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

// Memoized Cart Item for ultra-smooth list performance
const CartItem = React.memo(({ item, onUpdateQuantity, onRemove }: any) => {
  const handleQtyChange = (newQty: number) => {
    if (newQty < 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdateQuantity(item.id, newQty);
  };

  return (
    <View style={styles.cartItem}>
      <ExpoImage 
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=200' }} 
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemVariant}>
          {item.category === 'juice' ? `${item.variantName === 'very_pure' ? 'Very Pure' : 'Normal'} • 300ml` : `Fresh • Per kg`}
        </Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{ProductService.formatPrice(item.subtotal)}</Text>
          <View style={styles.quantityControl}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => handleQtyChange(item.quantity - 1)}
            >
              <Minus size={16} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>
              {item.category === 'fruit' ? `${item.quantity}kg` : item.quantity}
            </Text>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => handleQtyChange(item.quantity + 1)}
            >
              <Plus size={16} color="#1e293b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onRemove(item.id);
      }}>
        <Trash2 size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
});

export default function CartScreen() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    getTotal, 
    getGrandTotal, 
    deliveryFee, 
    updateDeliveryFee, 
    placeOrder, 
    clearCart,
    isDeliverable 
  } = useCartStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserProfile(user.id);
      }
    });
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();
      
      if (data?.phone) {
        setPhoneNumber(data.phone);
      }
    } catch (e) {
      console.warn('[Cart] Failed to fetch profile:', e);
    }
  }

  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const toastRef = React.useRef<ToastHandle>(null);

  const handleAddressSelect = useCallback(async (addr: AddressData) => {
    setSelectedAddress(addr);
    if (addr.latitude && addr.longitude) {
      try {
        await updateDeliveryFee(addr.latitude, addr.longitude);
      } catch (err: any) {
        toastRef.current?.show(err.message || "Delivery not available for this location", 'error');
      }
    }
  }, [updateDeliveryFee]);

  // PERFORMANCE: Memoized totals to prevent re-calculation on every keystroke
  const subtotal = useMemo(() => getTotal(), [items]);
  const grandTotal = useMemo(() => getGrandTotal(), [items, deliveryFee]);

  const handleCheckout = async () => {
    if (loading) return;

    if (!isDeliverable) {
      toastRef.current?.show("Delivery is unavailable at your location.", 'error');
      return;
    }

    if (!selectedAddress?.formattedAddress) {
      toastRef.current?.show("Please select a delivery address.", 'error');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      toastRef.current?.show("Enter a valid 10-digit WhatsApp number", 'error');
      return;
    }
    
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await supabase.from('profiles').update({ phone: phoneNumber }).eq('id', user?.id);

      if (paymentMethod === 'online') {
        router.push({
          pathname: '/payment',
          params: {
            amount: grandTotal,
            name: user?.user_metadata?.full_name || 'Customer',
            email: user?.email || '',
            contact: phoneNumber,
            address: selectedAddress.formattedAddress,
            locationData: JSON.stringify(selectedAddress),
            items: JSON.stringify(items),
          }
        });
      } else {
        await processOrder(user.id, selectedAddress.formattedAddress);
      }
    } catch (err: any) {
      toastRef.current?.show("Something went wrong.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const processOrder = async (userId: string, address: string) => {
    try {
      const orderId = await placeOrder(userId, address, 'cod', 'PENDING', selectedAddress || undefined);
      if (orderId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await OrderTrackingService.initializeTracking(orderId);

        const orderPayload = {
          id: orderId,
          customerName: user?.user_metadata?.full_name || 'Valued Customer',
          customerPhone: phoneNumber,
          address: address,
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          total: grandTotal,
          paymentType: 'cod' as const,
          createdAt: new Date().toISOString(),
          latitude: selectedAddress?.latitude || 0,
          longitude: selectedAddress?.longitude || 0,
        };
        
        NotificationService.sendOrderNotification(orderPayload).catch(console.error);
        clearCart();
        router.replace({
          pathname: '/order-success',
          params: { orderId, amount: grandTotal, address, paymentType: 'cod' }
        });
      }
    } catch (err: any) {
      Alert.alert('Order Failed', err.message);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState 
        icon={ShoppingBag}
        title="Your cart is feeling light"
        subtitle="Start your journey to health today!"
        actionLabel="Start Shopping"
        onAction={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Toast ref={toastRef} />
      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
      >
        <View style={styles.itemList}>
          {items.map((item) => (
            <CartItem 
              key={item.id} 
              item={item} 
              onUpdateQuantity={updateQuantity} 
              onRemove={removeItem} 
            />
          ))}
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneIconBox}>
              <Phone size={18} color="#64748b" />
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="10-digit WhatsApp Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Delivery Location</Text>
          <AddressPicker 
            onAddressSelect={handleAddressSelect}
            initialAddress={selectedAddress || { formattedAddress: '' }}
          />
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {[
            { id: 'online', label: 'Online Payment', desc: 'Pay via UPI, Cards or NetBanking', icon: CreditCard, color: '#3b82f6', bg: '#eff6ff' },
            { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when order arrives', icon: Banknote, color: '#10b981', bg: '#f0fdf4' }
          ].map((opt) => (
            <TouchableOpacity 
              key={opt.id}
              style={[styles.paymentOption, paymentMethod === opt.id && styles.paymentOptionSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPaymentMethod(opt.id as any);
              }}
            >
              <View style={[styles.paymentIcon, { backgroundColor: opt.bg }]}>
                <opt.icon size={20} color={opt.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>{opt.label}</Text>
                <Text style={styles.paymentDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, paymentMethod === opt.id && styles.radioSelected]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{ProductService.formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && { color: '#10b981' }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{ProductService.formatPrice(grandTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, (loading || !isDeliverable) && styles.disabledBtn]} 
          onPress={handleCheckout}
          disabled={loading || !isDeliverable}
        >
          <Text style={styles.checkoutBtnText}>
            {!isDeliverable 
              ? 'Delivery Unavailable' 
              : loading 
                ? 'Processing...' 
                : `Proceed to Pay ${ProductService.formatPrice(grandTotal)}`}
          </Text>
          {!loading && isDeliverable && <ChevronRight size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  itemList: { padding: 20 },
  cartItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', elevation: 2 },
  itemImage: { width: 80, height: 80, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  itemVariant: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryGreen },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, padding: 4 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', paddingHorizontal: 8 },
  removeBtn: { padding: 8 },
  paymentSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  paymentOptionSelected: { borderColor: COLORS.primaryGreen, backgroundColor: '#F0FDF4' },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  paymentLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  paymentDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', marginLeft: 12 },
  radioSelected: { borderColor: COLORS.primaryGreen, backgroundColor: COLORS.primaryGreen, borderWidth: 5 },
  summaryContainer: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryGreen },
  footer: { padding: 24, backgroundColor: '#FFFFFF' },
  checkoutBtn: { backgroundColor: COLORS.primaryGreen, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 20, elevation: 8 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  disabledBtn: { opacity: 0.7, backgroundColor: '#9ca3af' },
  addressSection: { paddingHorizontal: 20, marginBottom: 24, backgroundColor: '#FFFFFF', paddingVertical: 20, borderRadius: 24, marginHorizontal: 16, marginTop: 8 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16 },
  phoneIconBox: { marginRight: 12 },
  phoneInput: { flex: 1, height: 54, fontSize: 16, color: '#1e293b', fontWeight: '500' },
});

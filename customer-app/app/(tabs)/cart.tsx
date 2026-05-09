import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../src/store/useCartStore';
import { Trash2, Plus, Minus, ChevronRight, ShoppingBag, CreditCard, Banknote } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Toast, ToastHandle } from '../../src/components/ui/Toast';
import { ProductService } from '../../src/services/ProductService';
import AddressPicker, { AddressData } from '../../src/components/AddressPicker';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { NotificationService } from '../../src/services/NotificationService';
import { OrderTrackingService } from '../../src/services/orderTrackingService';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const { items, removeItem, updateQuantity, getTotal, placeOrder, clearCart } = useCartStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const toastRef = React.useRef<ToastHandle>(null);

  const handleAddressSelect = React.useCallback((addr: AddressData) => {
    setSelectedAddress(addr);
  }, []);

  const handleCheckout = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn("[Checkout] Auth failure:", error?.message);
        toastRef.current?.show('Please login to place an order.', 'error');
        setLoading(false);
        return;
      }

      // 1. Strict Address Validation
      if (!selectedAddress || !selectedAddress.formattedAddress) {
        toastRef.current?.show("Please select or enter a delivery address.", 'error');
        setLoading(false);
        return;
      }

      const { city, state, formattedAddress } = selectedAddress;
      
      if (!city?.trim() || !state?.trim() || formattedAddress.trim().length < 5) {
        toastRef.current?.show("Incomplete address. Please provide area, city and state.", 'error');
        setLoading(false);
        return;
      }

      const totalAmount = getTotal();
      if (totalAmount <= 0) {
        Alert.alert('Invalid Cart', 'Your cart is empty.');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'online') {
        const orderId = await placeOrder(user.id, formattedAddress, 'online', 'pending_payment', selectedAddress); 
        
        if (!orderId) {
          setLoading(false);
          return;
        }

        router.push({
          pathname: '/payment',
          params: {
            amount: totalAmount,
            orderId: orderId,
            name: user.user_metadata?.full_name || 'Customer',
            email: user.email || '',
            contact: user.user_metadata?.phone || '',
          }
        });
      } else {
        await processOrder(user.id, 'COD_PENDING', formattedAddress);
      }
    } catch (err: any) {
      toastRef.current?.show("Something went wrong. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const processOrder = async (userId: string, paymentId: string, addressOverride?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalAddress = addressOverride || selectedAddress?.formattedAddress || user?.user_metadata?.permanent_address || 'Default Address';

      const orderId = await placeOrder(userId, finalAddress, paymentMethod, 'PENDING', selectedAddress || undefined);

      if (orderId) {
        // 1. Initialize tracking immediately
        await OrderTrackingService.initializeTracking(orderId);

        // 2. Send WhatsApp notification (fire & forget)
        const orderPayload = {
          id: orderId,
          customerName: user?.user_metadata?.full_name || 'Valued Customer',
          customerPhone: user?.user_metadata?.phone || 'N/A',
          address: finalAddress,
          landmark: selectedAddress?.landmark,
          latitude: selectedAddress?.latitude || 0,
          longitude: selectedAddress?.longitude || 0,
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          total: getTotal(),
          paymentType: paymentMethod,
          createdAt: new Date().toISOString(),
        };
        console.log('[Checkout] Dispatching notification for COD:', orderPayload.customerPhone);
        NotificationService.sendOrderNotification(orderPayload).catch(e =>
          console.warn('[Checkout] Notification failed silently:', e.message)
        );

        // 3. Clear cart
        clearCart();

        // 4. Navigate to live order tracking screen
        toastRef.current?.show('Order placed! Tracking your delivery...', 'success');
        setTimeout(() => {
          router.replace(`/orders/${orderId}` as any);
        }, 800);
      } else {
        setLoading(false);
        Alert.alert('Order Failed', 'We couldn\'t save your order. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      console.error('[Checkout] processOrder error:', err.message);
      Alert.alert('Error', 'An unexpected error occurred while placing your order.');
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState 
        icon={ShoppingBag}
        title="Your cart is feeling light"
        subtitle="Looks like you haven't added any fresh harvest yet. Start your journey to health today!"
        actionLabel="Start Shopping"
        onAction={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Toast ref={toastRef} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.itemList}>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image 
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=200' }} 
                style={styles.itemImage}
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
                      onPress={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={16} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>
                      {item.category === 'fruit' ? `${item.quantity}kg` : item.quantity}
                    </Text>
                    <TouchableOpacity 
                      style={styles.qtyBtn} 
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} color="#1e293b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <AddressPicker 
            onAddressSelect={handleAddressSelect}
            initialAddress={selectedAddress || { formattedAddress: '' }}
          />
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'online' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('online')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#eff6ff' }]}>
              <CreditCard size={20} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>Online Payment</Text>
              <Text style={styles.paymentDesc}>Pay via GPay, PhonePe, or any UPI app</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'online' && styles.radioSelected]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#f0fdf4' }]}>
              <Banknote size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentLabel}>Cash on Delivery</Text>
              <Text style={styles.paymentDesc}>Pay in cash when your order arrives</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioSelected]} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{ProductService.formatPrice(getTotal())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹0.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{ProductService.formatPrice(getTotal())}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, loading && { opacity: 0.7 }]} 
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutBtnText}>
            {loading ? 'Processing...' : `Proceed to Pay ${ProductService.formatPrice(getTotal())}`}
          </Text>
          {!loading && <ChevronRight size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  itemList: { padding: 20 },
  cartItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f8fafc' },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  itemVariant: { fontSize: 12, color: '#64748b', marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#3A8C3F' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, padding: 4 },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', paddingHorizontal: 8 },
  removeBtn: { padding: 8 },
  paymentSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  paymentOptionSelected: { borderColor: '#3A8C3F', backgroundColor: '#F0FDF4' },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  paymentLabel: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  paymentDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', marginLeft: 12 },
  radioSelected: { borderColor: '#3A8C3F', backgroundColor: '#3A8C3F', borderWidth: 5 },
  summaryContainer: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 8 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#3A8C3F' },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: '#FFFFFF' },
  checkoutBtn: { backgroundColor: '#3A8C3F', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 20, shadowColor: '#3A8C3F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  addressSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCartStore } from '../src/store/useCartStore';
import { supabase } from '../lib/supabase';
import { COLORS, TYPOGRAPHY } from '../src/theme/tokens';
import { ShieldCheck, AlertCircle, RefreshCw, ChevronLeft, CheckCircle2, Download, Home } from 'lucide-react-native';
import { Toast, ToastHandle } from '../src/components/ui/Toast';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { NotificationService, OrderNotificationPayload } from '../src/services/NotificationService';
import { OrderTrackingService } from '../src/services/orderTrackingService';
import { LinearGradient } from 'expo-linear-gradient';

// Conditionally import WebView — not available on web
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://juice-app-9uzq.onrender.com';
const BACKEND_URL = BASE_API_URL.endsWith('/api/payment')
  ? BASE_API_URL
  : `${BASE_API_URL}/api/payment`;

type PaymentState =
  | 'IDLE'
  | 'CREATING_ORDER'
  | 'OPENING_RAZORPAY'
  | 'VERIFYING_PAYMENT'
  | 'PAYMENT_SUCCESS'
  | 'SHOWING_RECEIPT'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    amount, 
    name, 
    email, 
    contact, 
    address, 
    locationData: locationDataStr, 
    items: itemsStr 
  } = params;
  
  const { clearCart, placeOrder } = useCartStore();
  const toastRef = useRef<ToastHandle>(null);

  // All hooks at the top
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);

  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('IDLE');
  const [preloading, setPreloading] = useState(true);

  // Parse complex params
  const items = useMemo(() => itemsStr ? JSON.parse(itemsStr as string) : [], [itemsStr]);
  const locationData = useMemo(() => locationDataStr ? JSON.parse(locationDataStr as string) : null, [locationDataStr]);

  const resolvedKey = useMemo(
    () => (razorpayKey || process.env.EXPO_PUBLIC_RAZORPAY_KEY || '').trim(),
    [razorpayKey]
  );
  const amountInPaise = useMemo(() => Math.round(Number(amount) * 100), [amount]);
  const safeName = useMemo(() => String(name || 'Customer').replace(/['"]/g, ''), [name]);
  const safeEmail = useMemo(() => String(email || '').replace(/['"]/g, ''), [email]);
  const safeContact = useMemo(() => String(contact || '').replace(/['"]/g, ''), [contact]);

  const checkoutHtml = useMemo(() => {
    if (!razorpayOrderId || !resolvedKey) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <script src="https://checkout.razorpay.com/v1/checkout.js"><\/script>
          <style>
            body { margin:0; padding:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#fff; }
            .loader { border:3px solid #f3f3f3; border-top:3px solid #3A8C3F; border-radius:50%; width:30px; height:30px; animation:spin 1s linear infinite; }
            @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          <\/style>
        </head>
        <body>
          <div class="loader"></div>
          <script>
            var options = {
              "key": "${resolvedKey}",
              "amount": ${amountInPaise},
              "currency": "INR",
              "name": "${safeName}",
              "description": "Premium Juice Order",
              "order_id": "${razorpayOrderId}",
              "handler": function(r){ sendToApp("success", r); },
              "prefill": { "name": "${safeName}", "email": "${safeEmail}", "contact": "${safeContact}" },
              "theme": { "color": "#3A8C3F" },
              "modal": { "ondismiss": function(){ sendToApp("cancelled", null); }, "escape": false, "backdropclose": false },
              "retry": { "enabled": true, "max_count": 3 }
            };
            function sendToApp(status, data) {
              var msg = JSON.stringify({ status: status, data: data });
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
              if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*");
            }
            window.onload = function() {
              try {
                var rzp = new Razorpay(options);
                rzp.on("payment.failed", function(resp){ sendToApp("failure", resp.error); });
                rzp.open();
              } catch(e) {
                sendToApp("failure", { description: "SDK error: " + e.message });
              }
            };
          <\/script>
        </body>
      </html>
    `;
  }, [razorpayOrderId, resolvedKey, amountInPaise, safeName, safeEmail, safeContact]);

  // Background preload of Razorpay order
  useEffect(() => {
    let isMounted = true;
    const preloadOrder = async () => {
      try {
        const response = await axios.post(
          `${BACKEND_URL}/create-order`,
          { amount: Number(amount), currency: 'INR', receipt: `rcpt_${Date.now()}` },
          { timeout: 30000 }
        );
        if (isMounted && response.data?.success && response.data?.order_id) {
          setRazorpayOrderId(response.data.order_id);
          setRazorpayKey(response.data.key_id);
        }
      } catch (err) {
        console.warn('[Preload] Order preload failed', err);
      } finally {
        if (isMounted) setPreloading(false);
      }
    };
    preloadOrder();
    return () => { isMounted = false; };
  }, [amount]);

  // Web message listener
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWebMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && ['success', 'cancelled', 'failure'].includes(data.status)) {
          onMessage({ nativeEvent: { data: JSON.stringify(data) } } as any);
        }
      } catch {}
    };
    window.addEventListener('message', handleWebMessage);
    return () => window.removeEventListener('message', handleWebMessage);
  }, []);

  const handlePayNow = async () => {
    if (!['IDLE', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'].includes(paymentState)) return;

    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }

    if (razorpayOrderId && razorpayKey) {
      setPaymentState('OPENING_RAZORPAY');
      return;
    }

    // Fallback: create order on demand
    try {
      setPaymentState('CREATING_ORDER');
      const response = await axios.post(
        `${BACKEND_URL}/create-order`,
        { amount: Number(amount), currency: 'INR', receipt: `rcpt_${Date.now()}` },
        { timeout: 30000 }
      );
      if (response.data?.success && response.data?.order_id) {
        setRazorpayOrderId(response.data.order_id);
        setRazorpayKey(response.data.key_id);
        setPaymentState('OPENING_RAZORPAY');
      } else {
        setPaymentState('PAYMENT_FAILED');
        toastRef.current?.show('Gateway busy. Please try again.', 'error');
      }
    } catch {
      setPaymentState('PAYMENT_FAILED');
      toastRef.current?.show('Connection issue. Try again.', 'error');
    }
  };

  const finalizeOrder = async (razorpayData: any) => {
    if (paymentState === 'VERIFYING_PAYMENT' || paymentState === 'PAYMENT_SUCCESS') return;
    setPaymentState('VERIFYING_PAYMENT');

    try {
      // 1. Verify signature server-side
      const verifyRes = await axios.post(
        `${BACKEND_URL}/verify-payment`,
        {
          razorpay_order_id: razorpayData.razorpay_order_id,
          razorpay_payment_id: razorpayData.razorpay_payment_id,
          razorpay_signature: razorpayData.razorpay_signature,
        },
        { timeout: 30000 }
      );
      if (!verifyRes.data?.success) throw new Error('Payment verification failed. Security alert triggered.');

      // 2. NOW PLACE ORDER IN SUPABASE (RPC)
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User session expired. Please login again.');

      const orderId = await placeOrder(
        userId, 
        address as string, 
        'online', 
        'PENDING', 
        locationData,
        {
          order_id: razorpayData.razorpay_order_id,
          payment_id: razorpayData.razorpay_payment_id,
          signature: razorpayData.razorpay_signature
        }
      );

      if (!orderId) throw new Error('Failed to create order record. Please contact support.');

      // 3. Initialize tracking
      await OrderTrackingService.initializeTracking(orderId);

      // 4. Send notification
      try {
        const orderPayload: OrderNotificationPayload = {
          id: orderId,
          customerName: (name as string) || 'Customer',
          customerPhone: (contact as string) || 'N/A',
          address: (address as string) || 'Online Order',
          landmark: locationData?.landmark || '',
          latitude: locationData?.latitude || 0,
          longitude: locationData?.longitude || 0,
          items: items.map((i: any) => ({ name: i.name || 'Juice Item', quantity: i.quantity, price: i.price })),
          total: Number(amount),
          paymentType: 'online',
          createdAt: new Date().toISOString(),
        };
        NotificationService.sendOrderNotification(orderPayload);
      } catch (notifErr) {
        console.warn('[Payment] Notification skipped:', notifErr);
      }

      setPaymentState('PAYMENT_SUCCESS');
      clearCart();
      
      // Navigate to premium success screen
      setTimeout(() => {
        router.replace({
          pathname: '/order-success',
          params: {
            orderId,
            amount: amount,
            address: address,
            paymentType: 'online'
          }
        });
      }, 1500);
    } catch (err: any) {
      console.error('[Payment] Finalize failed:', err.message);
      setPaymentState('PAYMENT_FAILED');
      router.push({
        pathname: '/order-failure',
        params: { error: err.message }
      });
    }
  };

  const onMessage = (event: any) => {
    try {
      const data =
        typeof event.nativeEvent.data === 'string'
          ? JSON.parse(event.nativeEvent.data)
          : event.nativeEvent.data;
      if (data.status === 'success') {
        finalizeOrder(data.data);
      } else if (data.status === 'cancelled') {
        setPaymentState('PAYMENT_CANCELLED');
        toastRef.current?.show('Payment was cancelled.', 'info');
      } else {
        setPaymentState('PAYMENT_FAILED');
        router.push({
          pathname: '/order-failure',
          params: { error: data.message || 'Payment failed' }
        });
      }
    } catch {
      setPaymentState('PAYMENT_FAILED');
    }
  };

  // ─── Render: Razorpay checkout (WebView / iframe) ───────────────────────
  if (paymentState === 'OPENING_RAZORPAY' && razorpayOrderId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={() => setPaymentState('PAYMENT_CANCELLED')}>
            <ChevronLeft size={24} color={COLORS.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Payment Gateway</Text>
          <View style={{ width: 24 }} />
        </View>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={checkoutHtml}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' } as any}
            title="Razorpay Checkout"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation allow-popups-to-escape-sandbox"
          />
        ) : (
          WebView && (
            <WebView
              ref={webViewRef}
              source={{ html: checkoutHtml, baseUrl: 'https://checkout.razorpay.com' }}
              onMessage={onMessage}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              style={{ flex: 1 }}
            />
          )
        )}
      </SafeAreaView>
    );
  }

  // ─── Render: Verifying ───────────────────────────────────────────────────
  if (paymentState === 'VERIFYING_PAYMENT') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.verifyTitle}>Verifying Secure Payment...</Text>
          <Text style={styles.verifySubtitle}>Please do not exit. This takes a moment.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Success animation ───────────────────────────────────────────
  if (paymentState === 'PAYMENT_SUCCESS') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Animated.View entering={ZoomIn}>
            <CheckCircle2 size={100} color={COLORS.primaryGreen} />
          </Animated.View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Preparing your fresh order...</Text>
          <ActivityIndicator size="small" color={COLORS.primaryGreen} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Main payment screen ─────────────────────────────────────────
  const isBtnLoading = paymentState === 'CREATING_ORDER' || preloading;

  return (
    <SafeAreaView style={styles.container}>
      <Toast ref={toastRef} />
      <View style={styles.main}>
        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={styles.iconBox}>
            <ShieldCheck size={48} color={COLORS.primaryGreen} />
          </View>
          <Text style={styles.title}>Secure Payment</Text>
          <Text style={styles.subtitle}>Complete your transaction safely with Razorpay</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.amountCard}>
          <Text style={styles.amountLabel}>Final Amount</Text>
          <Text style={styles.amountValue}>₹{amount}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified Merchant</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)} style={styles.footerBtns}>
          <TouchableOpacity
            style={[styles.payBtn, isBtnLoading && { opacity: 0.7 }]}
            onPress={handlePayNow}
            disabled={isBtnLoading}
          >
            {isBtnLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>Pay ₹{amount} Securely</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Cancel and Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  main: { flex: 1, padding: 32, justifyContent: 'center' },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  iconBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#f0fdf4', justifyContent: 'center',
    alignItems: 'center', alignSelf: 'center', marginBottom: 24,
  },
  title: { ...TYPOGRAPHY.h1, textAlign: 'center', color: COLORS.darkText },
  subtitle: { ...TYPOGRAPHY.subtext, textAlign: 'center', marginBottom: 40 },
  amountCard: {
    backgroundColor: '#f8fafc', padding: 40, borderRadius: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  amountLabel: { fontSize: 14, color: COLORS.mutedGray, fontWeight: '600', marginBottom: 8 },
  amountValue: { fontSize: 48, fontWeight: '900', color: COLORS.primaryGreen },
  badge: {
    backgroundColor: '#dcfce7', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20, marginTop: 16,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#166534', textTransform: 'uppercase' },
  footerBtns: { marginTop: 60 },
  payBtn: {
    backgroundColor: COLORS.primaryGreen, paddingVertical: 20,
    borderRadius: 20, alignItems: 'center', elevation: 8,
    shadowColor: COLORS.primaryGreen, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 15,
  },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { marginTop: 20, padding: 10, alignItems: 'center' },
  backBtnText: { color: COLORS.mutedGray, fontWeight: '600' },
  verifyTitle: { ...TYPOGRAPHY.h1, marginTop: 24, textAlign: 'center' },
  verifySubtitle: { ...TYPOGRAPHY.subtext, textAlign: 'center', marginTop: 8 },
  successTitle: { ...TYPOGRAPHY.h1, marginTop: 24, color: COLORS.primaryGreen, textAlign: 'center' },
  successSubtitle: { ...TYPOGRAPHY.subtext, marginTop: 8, textAlign: 'center' },
});

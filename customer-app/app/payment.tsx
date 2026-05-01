import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCartStore } from '../src/store/useCartStore';
import { supabase } from '../lib/supabase';

// Use production backend URL.
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'https://razor-pay-backend-u1jy.onrender.com/api/payment';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { amount, name, email, contact } = params;
  const { placeOrder } = useCartStore();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);

  // 1. Create Order in Razorpay
  const handlePayNow = async () => {
    try {
      setLoading(true);
      
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
         Alert.alert('Invalid Amount', 'Please provide a valid amount.');
         setLoading(false);
         return;
      }

      const response = await axios.post(`${BACKEND_URL}/create-order`, {
        amount: parsedAmount, // in INR
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      }, { timeout: 30000 });

      if (response.data && response.data.success && response.data.order_id) {
        setOrderId(response.data.order_id);
        setShowWebView(true);
      } else {
        Alert.alert('Payment Error', response.data?.message || 'Failed to initialize payment.');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      const errorMsg = error.response?.data?.message || 'Cannot reach payment server. Please try again.';
      Alert.alert('Connection Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle WebView Messages (Success/Failure/Cancel)
  const onMessage = async (event: any) => {
    let message;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      console.error("Failed to parse WebView message", e);
      return;
    }

    setShowWebView(false);

    if (message.status === 'success') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = message.data;
      
      // 3. Verify Payment Signature
      try {
        setLoading(true);
        const verifyRes = await axios.post(`${BACKEND_URL}/verify-payment`, {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        }, { timeout: 30000 });

        if (verifyRes.data && verifyRes.data.success) {
          // 4. Place Order in Database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const userAddress = user.user_metadata?.permanent_address || 'Default Address';
            const dbOrderId = await placeOrder(user.id, userAddress, 'online');
            
            if (dbOrderId) {
              Alert.alert('Payment Successful', 'Your order has been placed securely!');
              router.replace('/(tabs)/orders');
            } else {
              Alert.alert('Action Required', 'Payment succeeded but order placement failed. Please contact support with your payment ID: ' + razorpay_payment_id);
              router.replace('/(tabs)/orders');
            }
          } else {
            Alert.alert('Session Expired', 'Please login to view your order.');
            router.replace('/');
          }
        } else {
          Alert.alert('Verification Failed', 'Payment signature is invalid. If money was deducted, it will be refunded.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        Alert.alert('Verification Error', error.response?.data?.message || 'Failed to verify payment status.');
      } finally {
        setLoading(false);
      }
    } else if (message.status === 'cancelled') {
      Alert.alert('Payment Cancelled', 'You cancelled the transaction.');
    } else {
      const failReason = message.data?.description || 'Unknown error occurred';
      Alert.alert('Payment Failed', failReason);
    }
  };

  if (showWebView && orderId) {
    const checkoutUrl = `${BACKEND_URL}/checkout/${orderId}?amount=${Number(amount) * 100}&name=${encodeURIComponent(name as string || '')}&email=${encodeURIComponent(email as string || '')}&contact=${encodeURIComponent(contact as string || '')}`;
    
    return (
      <SafeAreaView style={styles.container}>
        <WebView
          source={{ uri: checkoutUrl }}
          onMessage={onMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => <ActivityIndicator size="large" color="#3A8C3F" style={styles.loader} />}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
            setShowWebView(false);
            Alert.alert("Connection Error", "Failed to load payment gateway.");
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Secure Checkout</Text>
        <Text style={styles.amount}>₹{amount}</Text>
        <Text style={styles.subtitle}>Powered by Razorpay</Text>
        
        <TouchableOpacity 
          style={[styles.payButton, loading && styles.payButtonDisabled]} 
          onPress={handlePayNow}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
           <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 32,
  },
  amount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3A8C3F',
    marginBottom: 8,
  },
  payButton: {
    backgroundColor: '#3A8C3F',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3A8C3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});

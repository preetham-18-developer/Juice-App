import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { monitor } from '../services/MonitoringService';
import { Product, JuiceVariant } from '../types';
import { ProductService } from '../services/ProductService';
import { supabase } from '../../lib/supabase';
import { Alert } from 'react-native';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: 'juice' | 'fruit';
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, variant?: JuiceVariant, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  placeOrder: (userId: string, address: string, paymentType: 'online' | 'cod') => Promise<string | null>;
  reconcilePendingOrder: (paymentData: any) => Promise<boolean>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity = 1) => {
        monitor.log('INFO', 'Cart', `Adding item: ${product.name}`, { productId: product.id });
        const isJuice = product.category === 'juice';
        const variantId = variant?.id;
        const price = ProductService.getPrice(product, variant);
        const cartItemId = isJuice ? `${product.id}-${variantId}` : product.id;

        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            return {
              items: state.items.map((item) => 
                item.id === cartItemId 
                  ? { ...item, quantity: newQuantity, subtotal: newQuantity * price }
                  : item
              )
            };
          }
          const newItem: CartItem = {
            id: cartItemId,
            productId: product.id,
            name: product.name,
            category: product.category,
            variantId,
            variantName: variant?.variant_type,
            quantity,
            price,
            subtotal: price * quantity,
            image: product.image_url,
          };
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return { items: [...state.items, newItem] };
        });
      },
      removeItem: (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }))
      },
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id 
            ? { ...item, quantity, subtotal: quantity * item.price }
            : item
        )
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
      placeOrder: async (userId, address, paymentType) => {
        return await monitor.trackPerformance('PlaceOrder', async () => {
          const { items, getTotal } = get();
          try {
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                user_id: userId,
                total_amount: getTotal(),
                status: 'received',
                payment_type: paymentType,
                address: address,
              })
              .select()
              .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
              order_id: order.id,
              product_id: item.productId,
              variant_id: item.variantId,
              quantity: item.quantity,
              price_at_time: item.price,
              subtotal: item.subtotal
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // In production, we keep items until redirect success
            return order.id;
          } catch (error: any) {
            monitor.log('ERROR', 'Checkout', 'Order placement failed', { error });
            Alert.alert('Checkout Error', error.message || 'Connection failed.');
            return null;
          }
        });
      },
      reconcilePendingOrder: async (paymentData) => {
        return await monitor.trackPerformance('ReconcileOrder', async () => {
          const { items } = get();
          if (items.length === 0) return false;
          
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            // Re-run the order creation logic
            const { data: order, error } = await supabase.from('orders').insert({
              user_id: user.id,
              total_amount: get().getTotal(),
              status: 'received',
              payment_type: 'online',
              payment_id: paymentData.razorpay_payment_id,
              address: user.user_metadata?.permanent_address || 'Reconciled Address'
            }).select().single();

            if (error) throw error;

            const orderItems = items.map(item => ({
              order_id: order.id,
              product_id: item.productId,
              variant_id: item.variantId,
              quantity: item.quantity,
              price_at_time: item.price,
              subtotal: item.subtotal
            }));

            await supabase.from('order_items').insert(orderItems);
            
            set({ items: [] });
            monitor.log('INFO', 'Reconciliation', 'Successfully recovered ghost order', { orderId: order.id });
            return true;
          } catch (err) {
            monitor.log('ERROR', 'Reconciliation', 'Manual recovery failed', { err });
            return false;
          }
        });
      },
    }),
    {
      name: 'juice-shop-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

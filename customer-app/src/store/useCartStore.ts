import { create } from 'zustand';
import { Product, JuiceVariant } from '../types';
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
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product, variant, quantity = 1) => {
    const isJuice = product.category === 'juice';
    const variantId = variant?.id;
    const price = isJuice 
      ? (variant?.price || product.price || 0) 
      : (product.price_per_kg || product.price || 0);
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
      return { items: [...state.items, newItem] };
    });
  },
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
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

      set({ items: [] });
      return order.id;
    } catch (error: any) {
      console.error('Checkout failed:', error.message || error);
      Alert.alert('Checkout Error', error.message || 'Something went wrong while placing your order.');
      return null;
    }
  },
}));

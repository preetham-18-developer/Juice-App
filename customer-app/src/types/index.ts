export type Category = 'juice' | 'fruit' | 'vegetable' | 'other';

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  category: Category;
  is_available: boolean;
  price_per_kg?: number;
  price?: number;
  stock_kg?: number;
  rating?: number;
}

export interface JuiceVariant {
  id: string;
  product_id: string;
  variant_type: 'normal' | 'very_pure';
  price: number;
  stock_units: number;
  ml: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RECEIVED' | 'received' | 'processing' | 'completed' | 'cancelled';
  payment_type: 'online' | 'cod';
  payment_status: string;
  delivery_type: 'delivery' | 'pickup';
  address: string;
  formatted_address?: string;
  landmark?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

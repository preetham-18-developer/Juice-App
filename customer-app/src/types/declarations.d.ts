declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    name: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    order_id?: string;
    subscription_id?: string;
    retry?: {
      enabled: boolean;
      max_count: number;
    };
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<{ razorpay_payment_id: string }>;
    static onExternalWallet(callback: (wallet: any) => void): void;
  }
}

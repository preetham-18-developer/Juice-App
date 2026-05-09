// ─── Order Status Constants ─────────────────────────────────────────────────
// Single source of truth for all order states, labels, timing, and colors.

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'NEARBY'
  | 'DELIVERED'
  | 'CANCELLED';

// Ordered flow — index position = progress
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'NEARBY',
  'DELIVERED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:          'Order Placed',
  CONFIRMED:        'Order Confirmed',
  PREPARING:        'Preparing Your Order',
  PACKED:           'Packed & Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  NEARBY:           'Almost There!',
  DELIVERED:        'Delivered!',
  CANCELLED:        'Cancelled',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  PENDING:          'We\'ve received your order and will confirm it shortly.',
  CONFIRMED:        'Your order is confirmed and being queued.',
  PREPARING:        'Our team is freshly preparing your juices.',
  PACKED:           'Your items are safely packed and sealed.',
  OUT_FOR_DELIVERY: 'Your order is on the way to you.',
  NEARBY:           'Delivery partner is arriving in a few minutes.',
  DELIVERED:        'Enjoy your fresh juices! Thank you 🧃',
  CANCELLED:        'Your order has been cancelled.',
};

// Auto-progression delay in ms for each step (TEST_MODE)
export const STEP_DELAYS_MS: Partial<Record<OrderStatus, number>> = {
  PENDING:          5000,
  CONFIRMED:        5000,
  PREPARING:        5000,
  PACKED:           5000,
  OUT_FOR_DELIVERY: 5000,
  NEARBY:           5000,
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:          '#F59E0B',
  CONFIRMED:        '#3B82F6',
  PREPARING:        '#8B5CF6',
  PACKED:           '#06B6D4',
  OUT_FOR_DELIVERY: '#F97316',
  NEARBY:           '#10B981',
  DELIVERED:        '#22C55E',
  CANCELLED:        '#EF4444',
};

export const STATUS_ICONS = {
  PENDING:          'clipboard-check',
  CONFIRMED:        'check-circle',
  PREPARING:        'chef-hat',
  PACKED:           'package',
  OUT_FOR_DELIVERY: 'truck',
  NEARBY:           'map-pin',
  DELIVERED:        'home',
  CANCELLED:        'x-circle',
} as const;

// Valid transitions (state machine guard)
export const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PREPARING', 'CANCELLED'],
  PREPARING:        ['PACKED', 'CANCELLED'],
  PACKED:           ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['NEARBY'],
  NEARBY:           ['DELIVERED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getStepIndex(status: OrderStatus): number {
  const idx = ORDER_STATUS_FLOW.indexOf(status);
  return idx > -1 ? idx : 0;
}

export function normalizeStatus(raw: string): OrderStatus {
  // Map legacy DB values to new status system
  const map: Record<string, OrderStatus> = {
    received:        'PENDING',
    pending_payment: 'PENDING',
    processing:      'PREPARING',
    completed:       'DELIVERED',
    cancelled:       'CANCELLED',
  };
  return (map[raw] ?? raw) as OrderStatus;
}

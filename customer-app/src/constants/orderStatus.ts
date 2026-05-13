// ─── Order Status Constants ─────────────────────────────────────────────────
// Single source of truth for all order states, labels, timing, and colors.

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'CANCELLED';

// Ordered flow — index position = progress
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'DELIVERED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:          'Order Placed',
  CONFIRMED:        'Order Confirmed',
  DELIVERED:        'Delivered!',
  CANCELLED:        'Cancelled',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  PENDING:          'We\'ve received your order and will confirm it shortly.',
  CONFIRMED:        'Your order is confirmed. Fresh juices are on their way!',
  DELIVERED:        'Enjoy your fresh juices! Thank you 🧃',
  CANCELLED:        'Your order has been cancelled.',
};

// Auto-progression delay in ms for each step (TEST_MODE)
export const STEP_DELAYS_MS: Partial<Record<OrderStatus, number>> = {
  PENDING:          5000,
  CONFIRMED:        10000,
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:          '#F59E0B',
  CONFIRMED:        '#3B82F6',
  DELIVERED:        '#22C55E',
  CANCELLED:        '#EF4444',
};

export const STATUS_ICONS = {
  PENDING:          'clipboard-check',
  CONFIRMED:        'check-circle',
  DELIVERED:        'home',
  CANCELLED:        'x-circle',
} as const;

// Valid transitions (state machine guard)
export const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['DELIVERED', 'CANCELLED'],
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
    confirmed:       'CONFIRMED',
    processing:      'CONFIRMED',
    packed:          'CONFIRMED',
    out_for_delivery: 'CONFIRMED',
    nearby:          'CONFIRMED',
    completed:       'DELIVERED',
    delivered:       'DELIVERED',
    cancelled:       'CANCELLED',
  };
  return (map[raw.toLowerCase()] ?? 'PENDING') as OrderStatus;
}

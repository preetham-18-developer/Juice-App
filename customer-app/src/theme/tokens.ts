export const COLORS = {
  primaryOrange: '#FF7700',
  primaryGreen: '#2E7D32',
  creamBackground: '#FFF7E6',
  white: '#FFFFFF',
  mutedGray: '#6B7280',
  darkText: '#1F2937',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 20,
  full: 999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.darkText,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.darkText,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.darkText,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.darkText,
  },
  subtext: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.mutedGray,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.mutedGray,
  },
};

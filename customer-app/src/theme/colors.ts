export const COLORS = {
  // Brand Colors - Luxury Orange & Gold
  primaryOrange: '#E67E22', 
  gold: '#D4AF37',
  warmGold: '#B8860B',
  
  // Backgrounds
  cream: '#FDFCF0', 
  creamBackground: '#FDFCF0', // Alias for backward compatibility
  white: '#FFFFFF',
  softBeige: '#F9F7F2',
  
  // Typography
  luxuryDark: '#1A1A1A', 
  darkText: '#1A1A1A', // Alias
  mutedGray: '#6B7280',
  lightGray: '#F1F5F9',
  
  // Accents
  primaryGreen: '#2E7D32', 
  primaryGreenLight: '#E8F5E9',
  border: 'rgba(230, 126, 34, 0.1)',
  shadow: 'rgba(26, 26, 26, 0.08)',
  
  // Fallbacks for other used colors
  primaryOrangeLight: '#FFF7ED',
  error: '#EF4444',
  success: '#10B981',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

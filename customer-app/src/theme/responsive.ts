import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Luxury Responsive Breakpoints
export const BREAKPOINTS = {
  TABLET: 600,
  LAPTOP: 1024,
  DESKTOP: 1440,
};

export const getResponsiveCardCount = (width: number) => {
  if (width >= BREAKPOINTS.LAPTOP) return 4; 
  if (width >= BREAKPOINTS.TABLET) return 3;
  return 2.2; // Optimized for mobile 'peek' effect
};

export const getResponsiveCardWidth = (containerWidth: number, gap: number, padding: number) => {
  const count = getResponsiveCardCount(containerWidth);
  const totalGap = gap * (count - 1);
  const availableWidth = containerWidth - (padding * 2);
  return (availableWidth - totalGap) / count;
};

export const isWeb = Platform.OS === 'web';
export const isMobile = !isWeb && SCREEN_WIDTH < BREAKPOINTS.TABLET;

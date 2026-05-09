import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const HORIZONTAL_MARGIN = 20;

export const CAROUSEL_CONFIG = {
  ITEM_WIDTH: width - (HORIZONTAL_MARGIN * 2), // Full width with side margins
  ITEM_HEIGHT: 260, // Taller for luxury feel
  GAP: HORIZONTAL_MARGIN,
  AUTO_PLAY_SPEED: 4000, // Duration per slide in ms
  PAUSE_ON_TOUCH: true,
  INFINITE_LOOP: true,
  BORDER_RADIUS: 32,
  SHADOW_COLOR: '#000',
  SHADOW_OPACITY: 0.12,
  SHADOW_RADIUS: 20,
  SCALE_FACTOR: 1, 
};

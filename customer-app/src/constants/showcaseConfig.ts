import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_MARGIN = 24;

export const SHOWCASE_CONFIG = {
  CARD_WIDTH: SCREEN_WIDTH * 0.85, // Cinematic Peek
  CARD_HEIGHT: 240,
  GAP: 16,
  AUTOPLAY_SPEED: 0.6, // Smoother glide
  GLASS_OPACITY: 0.2,
  BLUR_INTENSITY: 25,
};

export const SHOWCASE_ITEMS = [
  {
    id: 's1',
    title: 'Farm Fresh Vegetables',
    subtitle: 'Crisp & Nutritious',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    category: 'vegetable'
  },
  {
    id: 's2',
    title: 'Flash Squeezed',
    subtitle: 'Freshly Pressed Daily',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800',
    category: 'fresh'
  },
  {
    id: 's3',
    title: 'Premium Glass',
    subtitle: 'Eco-Friendly Packaging',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800',
    category: 'luxury'
  },
  {
    id: 's4',
    title: 'Immunity Boost',
    subtitle: 'Packed with Vitamins',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=800',
    category: 'health'
  }
];

import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeIn,
} from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { Star, ShoppingBag, Heart } from 'lucide-react-native';
import { getProductImageSource } from '../../utils/imageUtils';

interface PremiumCardProps {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  price: number;
  imageUrl: string;
  category?: string;
  rating?: number;
  onPress: () => void;
  onAddToCart?: () => void;
  isAvailable?: boolean;
  isDeliverable?: boolean; // Now passed as prop for optimization
  isSearching?: boolean;
}

/**
 * High-performance image renderer.
 * Uses hardware acceleration on native, native <img> on web.
 */
const SafeProductImage = React.memo(({ 
  name, category, imageUrl 
}: { name: string; category: string; imageUrl: string }) => {
  const [errored, setErrored] = useState(false);
  const source = getProductImageSource(name, category, errored ? undefined : imageUrl);

  if (Platform.OS === 'web') {
    const uri = (source && source.uri) ? source.uri : 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80';
    return (
      <img
        src={uri}
        alt={name}
        onError={() => setErrored(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  return (
    <ExpoImage
      source={source}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      transition={200} // Smooth cross-fade
      cachePolicy="memory-disk"
      onError={() => setErrored(true)}
    />
  );
});

const PremiumCard: React.FC<PremiumCardProps> = ({
  index,
  title,
  price,
  imageUrl,
  category,
  rating = 4.8,
  onPress,
  onAddToCart,
  isAvailable = true,
  isDeliverable = true,
  isSearching = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handleAddToCart = useCallback((e: any) => {
    e.stopPropagation();
    if (!isDeliverable) return;
    onAddToCart?.();
  }, [onAddToCart, isDeliverable]);

  const delay = Math.min((index % 6) * 60, 300);

  return (
    <Animated.View 
      entering={isSearching ? undefined : FadeIn.duration(300).delay(Math.min(delay, 200))}
      style={!isDeliverable ? { opacity: 0.5 } : {}}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable
          onPress={isDeliverable ? onPress : undefined}
          onPressIn={isDeliverable ? handlePressIn : undefined}
          onPressOut={isDeliverable ? handlePressOut : undefined}
          style={styles.card}
        >
          <View style={styles.imageSection}>
            <SafeProductImage
              name={title}
              category={category || 'juice'}
              imageUrl={imageUrl}
            />

            <View style={styles.badgeRow}>
              <View style={styles.ratingBadge}>
                <Star size={10} color={COLORS.primaryOrange} fill={COLORS.primaryOrange} />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
              <Pressable style={styles.heartBtn}>
                <Heart size={14} color={COLORS.mutedGray} />
              </Pressable>
            </View>

            {(!isAvailable || !isDeliverable) && (
              <View style={styles.soldOutOverlay}>
                <Text style={styles.soldOutText}>{!isDeliverable ? 'UNAVAILABLE' : 'RESERVED'}</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text style={styles.category}>{(category || 'COLLECTION').toUpperCase()}</Text>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>

            <View style={styles.footer}>
              <Text style={styles.price}>₹{Math.round(price)}</Text>
              {onAddToCart && isAvailable && isDeliverable && (
                <Pressable
                  onPress={handleAddToCart}
                  style={styles.cartBtn}
                >
                  <ShoppingBag size={16} color={COLORS.white} />
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 6 },
  card: {
    backgroundColor: COLORS.cream,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 260,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px -8px rgba(0,0,0,0.08)' } as any,
      default: {
        elevation: 4,
        shadowColor: COLORS.luxuryDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
    }),
  },
  imageSection: {
    aspectRatio: 1,
    backgroundColor: COLORS.softBeige,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  ratingText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.luxuryDark,
  },
  heartBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  soldOutText: {
    ...TYPOGRAPHY.label,
    color: COLORS.mutedGray,
    fontSize: 10,
    letterSpacing: 2,
  },
  content: { padding: 16, paddingTop: 10 },
  category: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { ...TYPOGRAPHY.price, fontSize: 18 },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: COLORS.primaryOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ULTRA-STRICT MEMOIZATION: Only re-render if the core data changes
export default React.memo(PremiumCard, (prev, next) => {
  return (
    prev.id === next.id &&
    prev.price === next.price &&
    prev.isAvailable === next.isAvailable &&
    prev.isDeliverable === next.isDeliverable &&
    prev.isSearching === next.isSearching &&
    prev.imageUrl === next.imageUrl
  );
});

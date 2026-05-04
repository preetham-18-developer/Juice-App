import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  Platform
} from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../../theme/tokens';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (WINDOW_WIDTH - 48) / 2;

interface JuiceCardProps {
  imageUrl: string;
  category: string;
  title: string;
  price: number;
  onPress: () => void;
  onAddToCart?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export const DestinationCard = ({
  imageUrl,
  category,
  title,
  price,
  onPress,
  onAddToCart,
  onLike,
  isLiked = false,
}: JuiceCardProps) => {
  const [liked, setLiked] = useState(isLiked);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const toggleLike = () => {
    setLiked(!liked);
    if (onLike) onLike();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        />

        <View style={styles.topBadges}>
          <View style={styles.ratingBadge}>
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={toggleLike}
          >
            <Heart
              size={18}
              color={COLORS.white}
              fill={liked ? "#FF5252" : "transparent"}
              strokeWidth={liked ? 0 : 2}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.textContent}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>₹{price}</Text>
              <View style={styles.offerBadge}>
                <Text style={styles.offerText}>Best Seller</Text>
              </View>
            </View>
            {onAddToCart && (
              <TouchableOpacity 
                style={styles.buyButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
              >
                <Text style={styles.buyButtonText}>Buy</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  topBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    padding: 16,
    justifyContent: 'flex-end',
    flex: 1,
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FBD38D',
  },
  offerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  buyButton: {
    backgroundColor: '#FF7700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: '#FF7700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  }
});

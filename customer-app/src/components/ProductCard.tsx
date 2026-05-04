import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../theme/tokens';
import { ShoppingCart, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  onPress: () => void;
  onAddToCart: () => void;
  isAvailable?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  image,
  onPress,
  onAddToCart,
  isAvailable = true,
}) => {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    onAddToCart();
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, !isAvailable && styles.disabledCard]} 
      onPress={onPress} 
      activeOpacity={0.8}
      disabled={!isAvailable}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: image }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <View style={styles.ratingBadge}>
          <Star size={10} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingText}>4.5</Text>
        </View>
        {!isAvailable && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Sold Out</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.unit}>per kg / bottle</Text>
        
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{price}</Text>
            {isAvailable && <Text style={styles.availability}>In Stock</Text>}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.addButton, 
              !isAvailable && styles.disabledAddButton,
              isAdding && { backgroundColor: '#10B981' }
            ]} 
            onPress={handleAdd}
            disabled={!isAvailable || isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <ShoppingCart size={18} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabledCard: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkText,
  },
  unit: {
    fontSize: 10,
    color: COLORS.mutedGray,
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  availability: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: COLORS.primaryGreen,
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledAddButton: {
    backgroundColor: COLORS.mutedGray,
  },
});

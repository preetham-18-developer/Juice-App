import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { COLORS, SPACING } from '../theme/tokens';
import { JuicyLogo } from './JuicyLogo';
import { ShoppingCart, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/useCartStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Header = () => {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FFF7E6', '#FFE0B2']}
      style={[styles.container, { paddingTop: Math.max(insets.top, SPACING.sm) }]}
    >
      <TouchableOpacity 
        style={styles.logoWrapper}
        onPress={() => router.replace('/(tabs)')}
      >
        <JuicyLogo size={42} withText={false} />
      </TouchableOpacity>
      
      <Text style={styles.logoText}>JuicyApp</Text>

      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Bell size={24} color={COLORS.darkText} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/cart')}>
          <ShoppingCart size={24} color={COLORS.darkText} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoWrapper: {
    backgroundColor: COLORS.white,
    padding: 2,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryGreen,
    marginLeft: SPACING.sm,
    flex: 1,
    letterSpacing: -0.5,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primaryOrange,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

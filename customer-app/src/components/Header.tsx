import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { COLORS, SPACING, SHADOWS, RADIUS } from '../theme/tokens';
import { JuicyLogo } from './JuicyLogo';
import { ShoppingCart, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../store/useCartStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';

export const Header = () => {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const insets = useSafeAreaInsets();

  const handleIconPress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  return (
    <View style={[styles.outerContainer, { paddingTop: Math.max(insets.top, SPACING.xs) }]}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(255,247,230,0.8)', 'rgba(255,255,255,0.9)']}
          style={styles.gradient}
        >
          <TouchableOpacity 
            style={styles.logoWrapper}
            onPress={() => router.replace('/(tabs)')}
          >
            <JuicyLogo size={38} withText={false} />
          </TouchableOpacity>
          
          <Text style={styles.logoText}>Juicy<Text style={{ color: COLORS.primaryOrange }}>App</Text></Text>

          <View style={styles.rightIcons}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => handleIconPress('/notifications')}
            >
              <Bell size={22} color={COLORS.darkText} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => handleIconPress('/(tabs)/cart')}
            >
              <ShoppingCart size={22} color={COLORS.darkText} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.creamBackground,
    zIndex: 100,
  },
  blurContainer: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  logoWrapper: {
    backgroundColor: COLORS.white,
    padding: 2,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryGreen,
    marginLeft: SPACING.sm,
    flex: 1,
    letterSpacing: -0.5,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primaryOrange,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },
});

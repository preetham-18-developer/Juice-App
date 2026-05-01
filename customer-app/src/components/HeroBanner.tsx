import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

export const HeroBanner = () => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF1D6', '#FFE4B5']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.leftContent}>
          <Text style={styles.title}>There is a juice for every occasion.</Text>
          <Text style={styles.subtext}>Freshly squeezed with love and care.</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>10%</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Sugar</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>90%</Text>
              <Text style={styles.statLabel}>Vitamins</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
            <Text style={styles.ctaText}>ORDER NOW</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.imageContainer, { transform: [{ translateY: floatAnim }] }]}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=300' }} 
            style={styles.heroImage}
            resizeMode="contain"
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  gradient: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 200,
  },
  leftContent: {
    flex: 1,
    zIndex: 2,
  },
  title: {
    ...TYPOGRAPHY.h2,
    lineHeight: 28,
    marginBottom: SPACING.xs,
  },
  subtext: {
    ...TYPOGRAPHY.subtext,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryOrange,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.mutedGray,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  ctaButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  imageContainer: {
    flex: 0.5,
    alignItems: 'flex-end',
  },
  heroImage: {
    width: 120,
    height: 160,
  },
});

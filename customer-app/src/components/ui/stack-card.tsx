import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate,
  useAnimatedScrollHandler,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../../theme/tokens';
import { useRouter } from 'expo-router';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;

interface CardData {
  emoji: string;
  hueA: number;
  hueB: number;
  id?: string;
  name: string;
}

const food: CardData[] = [
  { emoji: "🍅", hueA: 340, hueB: 10, name: "Tomato" },
  { emoji: "🍊", hueA: 20, hueB: 40, name: "Orange" },
  { emoji: "🍋", hueA: 60, hueB: 90, name: "Lemon" },
  { emoji: "🍐", hueA: 80, hueB: 120, name: "Pear" },
  { emoji: "🍏", hueA: 100, hueB: 140, name: "Apple" },
  { emoji: "🫐", hueA: 205, hueB: 245, name: "Blueberry" },
  { emoji: "🍆", hueA: 260, hueB: 290, name: "Eggplant" },
  { emoji: "🍇", hueA: 290, hueB: 320, name: "Grape" },
];

const hue = (h: number) => `hsl(${h}, 100%, 50%)`;

const Card = ({ item, index, scrollY, onPress }: { item: CardData, index: number, scrollY: Animated.SharedValue<number>, onPress: () => void }) => {
  const cardY = index * (CARD_HEIGHT - 100);
  
  const animatedStyle = useAnimatedStyle(() => {
    // Distance from the top of the viewport
    const distance = cardY - scrollY.value;
    
    // Scale and rotate effect as it enters/leaves
    const scale = interpolate(
      distance,
      [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.5, 0],
      [0.8, 1, 1],
      Extrapolate.CLAMP
    );

    const rotate = interpolate(
      distance,
      [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.5, 0],
      [0, -10, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      distance,
      [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.5, 0],
      [300, 50, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale },
        { rotate: `${rotate}deg` }
      ],
      opacity: interpolate(
        distance,
        [WINDOW_HEIGHT, WINDOW_HEIGHT * 0.7, WINDOW_HEIGHT * 0.3],
        [0, 1, 1],
        Extrapolate.CLAMP
      )
    };
  });

  const background: [string, string] = [hue(item.hueA), hue(item.hueB)];

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <LinearGradient
        colors={background}
        style={styles.splash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={onPress}
        style={styles.card}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.buyBadge}>
           <Text style={styles.buyText}>Tap to Buy {item.name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ScrollTriggered = ({ onSelectProduct }: { onSelectProduct: (name: string) => void }) => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSpacer}>
        <Text style={styles.title}>Seasonal Fruits</Text>
        <Text style={styles.subtitle}>Scroll down to explore fresh picks</Text>
      </View>
      
      {food.map((item, i) => (
        <Card 
          key={item.emoji} 
          item={item} 
          index={i} 
          scrollY={scrollY}
          onPress={() => onSelectProduct(item.name)}
        />
      ))}
      <View style={{ height: 200 }} />
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  headerSpacer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.darkText,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mutedGray,
    marginTop: 4,
  },
  cardContainer: {
    width: WINDOW_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: -80,
  },
  splash: {
    position: 'absolute',
    width: 250,
    height: 350,
    borderRadius: 125,
    opacity: 0.8,
    bottom: 20,
    // Custom clipPath isn't directly supported in RN easily without SVG, 
    // so we use a rounded shape for the mobile "splash" feel.
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT - 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  emoji: {
    fontSize: 140,
  },
  buyBadge: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryGreen,
  },
});

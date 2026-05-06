import React from 'react';
import { 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  View, 
  Platform,
  ViewStyle,
  TextStyle
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme/tokens';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  haptic?: ImpactFeedbackStyle;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  textStyle,
  size = 'md',
  haptic = ImpactFeedbackStyle.Light,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(haptic);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { 
          colors: [COLORS.primaryGreen, '#1b5e20'] as [string, string],
          text: COLORS.white,
          border: 'transparent'
        };
      case 'secondary':
        return { 
          colors: [COLORS.primaryOrange, '#e65100'] as [string, string],
          text: COLORS.white,
          border: 'transparent'
        };
      case 'error':
        return { 
          colors: [COLORS.error, '#c62828'] as [string, string],
          text: COLORS.white,
          border: 'transparent'
        };
      case 'outline':
        return { 
          colors: ['transparent', 'transparent'] as [string, string],
          text: COLORS.primaryGreen,
          border: COLORS.primaryGreen
        };
      case 'ghost':
        return { 
          colors: ['transparent', 'transparent'] as [string, string],
          text: COLORS.primaryGreen,
          border: 'transparent'
        };
      default:
        return { 
          colors: [COLORS.primaryGreen, '#1b5e20'] as [string, string],
          text: COLORS.white,
          border: 'transparent'
        };
    }
  };

  const { colors, text, border } = getVariantStyles();

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 20 : 16;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.touchable,
          { borderColor: border, borderWidth: border !== 'transparent' ? 1.5 : 0 },
          disabled && styles.disabled
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { paddingVertical }]}
        >
          {loading ? (
            <ActivityIndicator color={text} size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.icon}>{icon}</View>}
              <Text style={[styles.text, { color: text, fontSize }, textStyle]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default PremiumButton;

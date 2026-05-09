import { useEffect, useCallback } from 'react';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  cancelAnimation, 
  runOnJS 
} from 'react-native-reanimated';
import { CAROUSEL_CONFIG } from '../constants/carouselConfig';

export const useAutoCarousel = (dataLength: number, totalWidth: number) => {
  const translateX = useSharedValue(0);
  const isPaused = useSharedValue(false);

  const startAnimation = useCallback(() => {
    if (dataLength === 0) return;
    
    // We want to scroll across the entire width of the data
    // Then reset to 0 seamlessly
    translateX.value = withRepeat(
      withTiming(-totalWidth, {
        duration: totalWidth * CAROUSEL_CONFIG.AUTO_PLAY_SPEED,
        easing: Easing.linear,
      }),
      -1, // infinite
      false // do not reverse
    );
  }, [dataLength, totalWidth]);

  useEffect(() => {
    startAnimation();
    return () => cancelAnimation(translateX);
  }, [startAnimation]);

  const pause = () => {
    'worklet';
    isPaused.value = true;
    cancelAnimation(translateX);
  };

  const resume = () => {
    'worklet';
    isPaused.value = false;
    runOnJS(startAnimation)();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return {
    translateX,
    animatedStyle,
    pause,
    resume,
    isPaused
  };
};

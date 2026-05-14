import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Native version of IntroSequence.
 * Skips the vaporize/shimmer intro as it relies on web-only APIs (framer-motion).
 */
export const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    // Immediately complete on native to avoid blocking the app boot
    onComplete();
  }, [onComplete]);

  return null;
};

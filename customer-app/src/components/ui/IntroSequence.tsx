"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntroComponent } from './vapour-text-effect';
import { ShimmerText } from './shimmer-text';
import { Platform, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../../theme/colors';

export const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [phase, setPhase] = useState<'vaporize' | 'shimmer'>('vaporize');

  useEffect(() => {
    // Check if intro has already played in this session to avoid annoyance on refresh
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      onComplete();
      return;
    }

    const timer1 = setTimeout(() => {
      setPhase('shimmer');
    }, 2000);

    const timer2 = setTimeout(() => {
      sessionStorage.setItem('hasSeenIntro', 'true');
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={[styles.fullscreen, { width: windowWidth, height: windowHeight }]}>
      <AnimatePresence mode="wait">
        {phase === 'vaporize' ? (
          <motion.div
            key="vaporize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flex: 1, width: '100%', height: '100%' }}
          >
            <IntroComponent />
          </motion.div>
        ) : (
          <motion.div
            key="shimmer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={styles.shimmerContainerWeb as any}
          >
            <View style={styles.centered}>
              <View style={styles.shimmerWrapper}>
                <ShimmerText 
                  variant="emerald"
                  duration={2}
                >
                  INDIA'S NO.1 JUICE SHOP
                </ShimmerText>
              </View>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Text style={styles.tagline}>CRAFTED WITH PURE NATURE</Text>
              </motion.div>
            </View>
          </motion.div>
        )}
      </AnimatePresence>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99999,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerWrapper: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    color: COLORS.primaryGreen,
    fontWeight: '600',
    letterSpacing: 4,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  // Separate web-only styles for motion.div
  shimmerContainerWeb: {
    flex: 1,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    display: 'flex',
  }
});

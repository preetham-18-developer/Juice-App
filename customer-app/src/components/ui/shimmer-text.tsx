"use client";

import { motion } from "framer-motion";
import React from 'react';
import { Text, Platform, View } from 'react-native';
import { COLORS } from '../../theme/colors';

type Variant =
  | "default"
  | "emerald"
  | "orange"
  | "gold";

interface ShimmerTextProps {
  children: string;
  className?: string; // Keep for interface compatibility but use style for logic
  variant?: Variant;
  duration?: number;
  delay?: number;
}

const colorMap: Record<Variant, string> = {
  default: COLORS.luxuryDark,
  emerald: COLORS.primaryGreen,
  orange: COLORS.primaryOrange,
  gold: COLORS.gold,
};

export function ShimmerText({
  children,
  variant = "default",
  duration = 2,
  delay = 0,
}: ShimmerTextProps) {
  if (Platform.OS !== 'web') {
    return <Text style={{ color: colorMap[variant] }}>{children}</Text>;
  }

  const baseColor = colorMap[variant];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
      <motion.div
        style={{
          display: "inline-block",
          fontWeight: "900",
          color: baseColor,
          WebkitTextFillColor: "transparent",
          background: `currentColor linear-gradient(to right, ${baseColor} 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.7) 60%, ${baseColor} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          backgroundRepeat: "no-repeat",
          backgroundSize: "200% 100%",
        } as React.CSSProperties}
        initial={{ backgroundPositionX: "150%" }}
        animate={{ backgroundPositionX: ["-100%", "200%"] }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "linear",
        }}
      >
        <span style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>{children}</span>
      </motion.div>
    </div>
  );
}

export default ShimmerText;

import React from 'react';
import { Text } from 'react-native';
import { COLORS } from '../../theme/colors';

type Variant =
  | "default"
  | "emerald"
  | "orange"
  | "gold";

interface ShimmerTextProps {
  children: string;
  variant?: Variant;
}

const colorMap: Record<Variant, string> = {
  default: COLORS.luxuryDark,
  emerald: COLORS.primaryGreen,
  orange: COLORS.primaryOrange,
  gold: COLORS.gold,
};

/**
 * Native-safe version of ShimmerText.
 * Renders a standard Text component to avoid framer-motion dependencies.
 */
export const ShimmerText = ({
  children,
  variant = "default",
}: ShimmerTextProps) => {
  return <Text style={{ color: colorMap[variant], fontWeight: '900' }}>{children}</Text>;
};

export default ShimmerText;

import React from 'react';
import Svg, { Rect, Text, G, Path, Defs, ClipPath } from 'react-native-svg';
import { COLORS } from '../theme/tokens';

interface LogoProps {
  size?: number;
  withText?: boolean;
}

export const JuicyLogo: React.FC<LogoProps> = ({ size = 100, withText = true }) => {
  const scale = size / 100;

  return (
    <Svg width={size} height={size * 1.2} viewBox={`0 0 100 120`}>
      {/* App Icon Background */}
      <Rect
        x="0"
        y="0"
        width="100"
        height="100"
        rx="24"
        fill={COLORS.primaryOrange}
      />

      {/* Drip 1 */}
      <Path
        d="M20 95 Q20 120 35 120 Q50 120 50 95"
        fill={COLORS.primaryOrange}
      />
      {/* Drip 2 */}
      <Path
        d="M45 95 Q45 110 55 110 Q65 110 65 95"
        fill={COLORS.primaryOrange}
      />
      {/* Drip 3 */}
      <Path
        d="M70 95 Q70 115 80 115 Q90 115 90 95"
        fill={COLORS.primaryOrange}
      />

      {/* Text */}
      {withText && (
        <G transform="translate(15, 45)">
          <Text
            fill="white"
            fontSize="24"
            fontWeight="900"
          >
            Juicy
          </Text>
          <Text
            y="25"
            fill="white"
            fontSize="24"
            fontWeight="900"
          >
            app
          </Text>
        </G>
      )}
    </Svg>
  );
};

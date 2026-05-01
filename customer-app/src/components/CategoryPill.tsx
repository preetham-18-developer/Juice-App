import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../theme/tokens';

interface CategoryPillProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  label,
  icon,
  active,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        active && styles.activeContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrapper, active && styles.activeIconWrapper]}>
        {icon}
      </View>
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  activeContainer: {
    // Underline effect could go here or filled background
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  activeIconWrapper: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  label: {
    ...TYPOGRAPHY.subtext,
    fontSize: 12,
    fontWeight: '600',
  },
  activeLabel: {
    color: COLORS.primaryGreen,
  },
});

/**
 * Outlined pill badge for labels (e.g. "AI DRIVEN REAL ESTATE INTELLIGENCE").
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, fontSizes } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface PillBadgeProps {
  label: string;
}

export function PillBadge({ label }: PillBadgeProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.pill, { borderColor: colors.primary }]}>
      <Text style={[styles.label, { color: colors.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.s,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

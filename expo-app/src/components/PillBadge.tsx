/**
 * Refined pill badge — warm gold frame on a subtle tinted surface (welcome / labels).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, fontSizes, fontWeights } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface PillBadgeProps {
  label: string;
}

export function PillBadge({ label }: PillBadgeProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.primaryMuted,
          borderColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.primary }]} numberOfLines={1} allowFontScaling>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.85,
    textTransform: 'uppercase',
  },
});

/**
 * Feature row: premium surface + icon well + headline (welcome / onboarding).
 */

import React, { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { spacing, radius, fontSizes, fontWeights, lineHeights, surfaceSubtle } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface FeatureRowProps {
  icon: string;
  /** Short headline (welcome / onboarding). String or nested Text for emphasis. */
  description: ReactNode;
}

export function FeatureRow({ icon, description }: FeatureRowProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        },
        surfaceSubtle,
      ]}
    >
      <View style={[styles.iconWell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SymbolView name={icon as any} tintColor={colors.primary} size={21} />
      </View>
      <Text
        style={[styles.text, { color: colors.text }]}
        allowFontScaling
        maxFontSizeMultiplier={1.35}
      >
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    paddingLeft: spacing.s,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: radius.s,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  text: {
    flex: 1,
    flexShrink: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.lg,
    letterSpacing: -0.15,
  },
});

/**
 * PropFolio wordmark + mark: matches welcome-screen brand language (SF Symbol + text).
 * Use for tab headers and secondary surfaces when a full hero isn’t needed.
 */

import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../theme';
import { useThemeColors } from './useThemeColors';

const LOGO_SIZE = 40;
const SYMBOL_SIZE = 24;

export interface PropFolioBrandHeaderProps {
  /** Extra wrapper style (e.g. horizontal padding from parent) */
  style?: StyleProp<ViewStyle>;
  /** Bottom margin under the lockup; default separates from subtitle */
  marginBottom?: number;
}

export function PropFolioBrandHeader({ style, marginBottom = spacing.m }: PropFolioBrandHeaderProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[styles.row, { marginBottom }, style]}
      accessibilityRole="header"
      accessibilityLabel="PropFolio"
    >
      <View style={[styles.logoMark, { backgroundColor: colors.primary }]} accessibilityElementsHidden>
        <SymbolView name="building.2.fill" tintColor={colors.onPrimary} size={SYMBOL_SIZE} />
      </View>
      <Text style={[styles.wordmark, { color: colors.text }]} numberOfLines={1}>
        PropFolio
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: LOGO_SIZE,
  },
  logoMark: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  wordmark: {
    flex: 1,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.xxl,
    letterSpacing: -0.35,
  },
});

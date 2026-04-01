import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { spacing, radius, fontSizes, fontWeights } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface ScoreBadgeProps extends ViewProps {
  value: number | null;
}

export function ScoreBadge({ value, style, ...rest }: ScoreBadgeProps) {
  const colors = useThemeColors();
  const label = value != null ? Math.round(value).toString() : '—';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.primary,
        },
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.text, { color: colors.onPrimary }]} allowFontScaling>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 40,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
});


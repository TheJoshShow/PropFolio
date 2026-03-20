/**
 * Chip / tag component. Uses theme tokens.
 */

import React from 'react';
import { Pressable, Text, StyleSheet, type ViewProps } from 'react-native';
import { spacing, radius, fontSizes } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface ChipProps extends ViewProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress, style, ...rest }: ChipProps) {
  const colors = useThemeColors();

  const bg = selected ? colors.primaryMuted : colors.surfaceSecondary;
  const fg = selected ? colors.primary : colors.text;

  const content = (
    <Text style={[styles.label, { color: fg }]}>{label}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.base,
          { backgroundColor: bg },
          pressed && { opacity: 0.85 },
          style,
        ]}
        onPress={onPress}
        {...rest}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.base, { backgroundColor: bg }, style]} {...rest}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.s,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});

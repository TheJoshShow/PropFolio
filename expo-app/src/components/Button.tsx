/**
 * Button component. Uses theme tokens. Primary supports pill + glow.
 */

import React from 'react';
import { Pressable, Text, StyleSheet, type PressableProps } from 'react-native';
import { spacing, radius, fontSizes, fontWeights, primaryButtonGlow } from '../theme';
import { useThemeColors } from './useThemeColors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Pill shape (fully rounded). Default true for primary, false for others. */
  pill?: boolean;
  /** Show subtle glow on primary. Default true for primary. */
  glow?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  disabled = false,
  fullWidth,
  pill,
  glow,
  style,
  ...rest
}: ButtonProps) {
  const colors = useThemeColors();

  const isPrimary = variant === 'primary';
  const usePill = pill ?? isPrimary;
  const useGlow = glow ?? isPrimary;

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surfaceSecondary
        : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'secondary' || variant === 'outline' || variant === 'ghost'
        ? colors.text
        : colors.text;
  const borderWidth = variant === 'outline' ? 2 : 0;
  const borderColor = variant === 'outline' ? colors.borderFocus : 'transparent';

  return (
    <Pressable
      style={(state) => [
        styles.base,
        {
          borderRadius: usePill ? radius.pill : radius.m,
          backgroundColor: disabled ? colors.border : bg,
          borderWidth,
          borderColor,
          opacity: state.pressed && !disabled ? 0.9 : 1,
          width: fullWidth ? '100%' : undefined,
          ...(isPrimary && useGlow && !disabled && primaryButtonGlow(colors.glowPrimary)),
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.label, { color: disabled ? colors.textMuted : fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
});

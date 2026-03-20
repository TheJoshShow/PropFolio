/**
 * Surface card with optional padding and border. Uses theme tokens.
 */

import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { spacing, radius, cardShadow } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
}

export function Card({
  padded = true,
  elevated = false,
  style,
  children,
  ...rest
}: CardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...(elevated && cardShadow),
        },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.l,
    borderWidth: 1,
  },
  padded: {
    padding: spacing.m,
  },
});

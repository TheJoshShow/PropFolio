import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { Card } from './Card';
import { spacing, radius } from '../theme';

/**
 * Shared modal container for things like Import Property and auth forms.
 * Centers a frosted card with generous padding and rounded corners.
 */
export interface ModalCardProps extends ViewProps {
  fullWidthOnSmallScreens?: boolean;
}

export function ModalCard({ style, fullWidthOnSmallScreens = true, children, ...rest }: ModalCardProps) {
  return (
    <Card
      elevated
      padded
      style={[
        styles.base,
        fullWidthOnSmallScreens && styles.fullWidthMobile,
        style,
      ]}
      {...rest}
    >
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    maxWidth: 520,
    alignSelf: 'center',
  },
  fullWidthMobile: {
    width: '100%',
  },
});


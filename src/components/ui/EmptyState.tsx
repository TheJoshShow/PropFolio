import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { semantic, spacing, textPresets } from '@/theme';

import { PrimaryButton } from './PrimaryButton';

type Props = {
  title: string;
  message: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

/**
 * Centered empty portfolio / list placeholder.
 */
export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  title: {
    ...textPresets.cardTitle,
    textAlign: 'center',
  },
  message: {
    ...textPresets.bodySecondary,
    textAlign: 'center',
    lineHeight: 24,
    color: semantic.textSecondary,
  },
  btn: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
});

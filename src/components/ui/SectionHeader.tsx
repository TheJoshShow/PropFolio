import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { semantic, spacing, typography } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: ViewStyle;
};

export function SectionHeader({ title, subtitle, right, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.sectionHeader,
  },
  subtitle: {
    ...typography.caption,
    color: semantic.textSecondary,
  },
  right: {
    alignSelf: 'center',
  },
});

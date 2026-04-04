import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { cardPadding, radius, semantic, spacing, textPresets } from '@/theme';
import { shadowStyle, type Elevation } from '@/theme/shadows';

type Props = {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  elevation?: Elevation;
  padding?: keyof typeof cardPadding;
};

/**
 * White grouped card — settings / summary blocks per renders.
 */
export function SectionCard({
  children,
  title,
  style,
  contentStyle,
  elevation = 'sm',
  padding = 'md',
}: Props) {
  const pad = cardPadding[padding];
  return (
    <View style={[styles.outer, shadowStyle(elevation), style]}>
      <View style={[{ padding: pad }, contentStyle]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: semantic.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    overflow: 'hidden',
  },
  title: {
    ...textPresets.sectionTitle,
    marginBottom: spacing.md,
  },
});

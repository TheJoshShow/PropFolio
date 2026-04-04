import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, hitSlop, shadowStyle, spacing } from '@/theme';

type Props = {
  onPress?: () => void;
  icon?: ReactNode;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function FloatingActionButton({ onPress, icon, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        shadowStyle('lg'),
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ?? <Text style={styles.plus}>+</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentCta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 28,
    fontWeight: '400',
    color: colors.onCta,
    marginTop: -spacing.micro,
  },
  pressed: {
    backgroundColor: colors.accentCtaPressed,
    opacity: 0.95,
  },
});

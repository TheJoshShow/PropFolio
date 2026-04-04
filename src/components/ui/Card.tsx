import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { hitSlop, radius, semantic, spacing, type Elevation } from '@/theme';
import { shadowStyle } from '@/theme/shadows';

type CardShape = 'default' | 'sheet';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: Elevation;
  /** `sheet` uses tighter radius from design renders */
  shape?: CardShape;
  testID?: string;
};

export function Card({ children, onPress, style, elevation = 'sm', shape = 'default', testID }: Props) {
  const borderRadius = shape === 'sheet' ? radius.card : radius.lg;
  const flattened = [
    styles.base,
    { borderRadius, backgroundColor: semantic.surface, borderColor: semantic.border },
    shadowStyle(elevation),
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onPress}
        style={({ pressed }) => [flattened, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={flattened}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.96,
  },
});

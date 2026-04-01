import React from 'react';
import { View, Text, StyleSheet, Pressable, type ViewProps } from 'react-native';
import { spacing, fontSizes, fontWeights, headerSpacing, radius } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface AppHeaderProps extends ViewProps {
  title: string;
  onPressBack?: () => void;
  backLabel?: string;
  onPressRight?: () => void;
  rightLabel?: string;
}

/**
 * Shared header for top-of-screen navigation (back + centered title + right action).
 * Purely visual; screens own their navigation logic.
 */
export function AppHeader({
  title,
  onPressBack,
  backLabel = 'Back',
  onPressRight,
  rightLabel,
  style,
  ...rest
}: AppHeaderProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.row,
        {
          paddingTop: headerSpacing.top,
          paddingHorizontal: headerSpacing.horizontal,
          paddingBottom: headerSpacing.bottom,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.side}>
        {onPressBack && (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            style={({ pressed }) => [styles.sideButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.sideLabel, { color: colors.primary }]}>←</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} allowFontScaling>
          {title}
        </Text>
      </View>

      <View style={[styles.side, { alignItems: 'flex-end' }]}>
        {onPressRight && rightLabel ? (
          <Pressable
            onPress={onPressRight}
            accessibilityRole="button"
            accessibilityLabel={rightLabel}
            style={({ pressed }) => [styles.sideButton, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.sideLabel, { color: colors.primary }]}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 72,
    minHeight: 32,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  sideLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
});


import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  heights,
  hitSlop,
  radius,
  semantic,
  spacing,
  textPresets,
} from '@/theme';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
};

/** Outlined / light secondary — white surface + soft border. */
export function SecondaryButton({
  label,
  onPress,
  disabled,
  loading,
  leftIcon,
  style,
  labelStyle,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={semantic.textPrimary} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: heights.buttonMin,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: semantic.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.borderStrong,
  },
  pressed: {
    backgroundColor: semantic.surfaceMuted,
    opacity: 0.96,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...textPresets.button,
    fontWeight: '600',
    color: semantic.textPrimary,
    textAlign: 'center',
  },
});

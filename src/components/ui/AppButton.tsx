import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, heights, hitSlop, radius, semantic, spacing, textPresets } from '@/theme';

import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  leftIcon,
  style,
  labelStyle,
  testID,
}: Props) {
  if (variant === 'primary') {
    return (
      <PrimaryButton
        label={label}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        leftIcon={leftIcon}
        style={style}
        labelStyle={labelStyle}
        testID={testID}
      />
    );
  }
  if (variant === 'secondary') {
    return (
      <SecondaryButton
        label={label}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        leftIcon={leftIcon}
        style={style}
        labelStyle={labelStyle}
        testID={testID}
      />
    );
  }

  const isDisabled = disabled || loading;
  const containerStyles = [
    styles.ghostBase,
    variant === 'ghost' && styles.ghost,
    variant === 'destructive' && styles.destructive,
    isDisabled && styles.disabled,
    style,
  ];
  const textStyles = [
    styles.ghostLabel,
    variant === 'ghost' && styles.labelGhost,
    variant === 'destructive' && styles.labelDestructive,
    isDisabled && styles.labelDisabled,
    labelStyle,
  ];

  const spinnerColor =
    variant === 'destructive' ? colors.danger : semantic.accentGold;

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [containerStyles, pressed && !isDisabled && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyles}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ghostBase: {
    minHeight: heights.buttonMin,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.88,
  },
  ghostLabel: {
    ...textPresets.button,
    textAlign: 'center',
  },
  labelGhost: {
    color: semantic.accentGold,
  },
  labelDestructive: {
    color: colors.danger,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
});

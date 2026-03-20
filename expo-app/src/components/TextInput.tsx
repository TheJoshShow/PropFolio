/**
 * Styled text input. Uses theme tokens.
 */

import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { spacing, radius, fontSizes } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: RNTextInputProps['style'];
}

export function TextInput({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  ...rest
}: TextInputProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          inputStyle,
        ]}
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
        {...rest}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    marginBottom: spacing.xxs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.s,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    fontSize: fontSizes.base,
    minHeight: 44,
  },
  error: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xxs,
  },
});

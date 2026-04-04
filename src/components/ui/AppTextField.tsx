import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, heights, radius, semantic, spacing, textPresets } from '@/theme';

export type TextFieldVariant = 'outline' | 'filled' | 'search';

type Props = {
  label: string;
  errorMessage?: string;
  containerStyle?: ViewStyle;
  variant?: TextFieldVariant;
  leftAccessory?: ReactNode;
  /** Use icon toggle instead of text for password visibility */
  passwordToggleIcon?: boolean;
} & TextInputProps;

export function AppTextField({
  label,
  errorMessage,
  containerStyle,
  style,
  secureTextEntry,
  variant = 'outline',
  leftAccessory,
  passwordToggleIcon = true,
  placeholder,
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(true);
  const isPassword = Boolean(secureTextEntry);
  const isSearch = variant === 'search';

  return (
    <View style={containerStyle}>
      {!isSearch ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          variant === 'outline' && styles.fieldOutline,
          variant === 'filled' && styles.fieldFilled,
          variant === 'search' && styles.fieldSearch,
          errorMessage ? styles.fieldError : null,
        ]}
      >
        {leftAccessory ? <View style={styles.accessory}>{leftAccessory}</View> : null}
        <TextInput
          placeholder={isSearch ? (placeholder ?? label) : placeholder}
          placeholderTextColor={semantic.placeholder}
          style={[styles.input, isSearch && styles.inputSearch, style]}
          secureTextEntry={isPassword ? hidden : false}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />
        {isPassword ? (
          passwordToggleIcon ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              hitSlop={12}
              onPress={() => setHidden((h) => !h)}
              style={styles.iconToggle}
            >
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color={semantic.textTertiary}
              />
            </Pressable>
          ) : (
            <Text
              accessibilityRole="button"
              onPress={() => setHidden((h) => !h)}
              style={styles.toggle}
            >
              {hidden ? 'Show' : 'Hide'}
            </Text>
          )
        ) : null}
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...textPresets.inputLabel,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: heights.inputMin,
  },
  fieldOutline: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  fieldFilled: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    backgroundColor: semantic.surfaceMuted,
  },
  fieldSearch: {
    borderRadius: radius.full,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    minHeight: heights.inputSearch,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  accessory: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...textPresets.body,
    paddingVertical: spacing.sm,
    color: semantic.textPrimary,
  },
  inputSearch: {
    fontSize: 17,
    paddingVertical: spacing.xs,
  },
  toggle: {
    ...textPresets.bodySecondary,
    fontSize: 15,
    color: semantic.accentGold,
    paddingLeft: spacing.sm,
  },
  iconToggle: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    ...textPresets.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

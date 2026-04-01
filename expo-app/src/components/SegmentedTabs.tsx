import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewProps } from 'react-native';
import { spacing, radius, fontSizes, fontWeights } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedTabsProps<T extends string> extends ViewProps {
  value: T;
  options: SegmentedTabOption<T>[];
  onChange: (next: T) => void;
}

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  style,
  ...rest
}: SegmentedTabsProps<T>) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surfaceSecondary,
        },
        style,
      ]}
      {...rest}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.tab,
              isActive && { backgroundColor: colors.surface },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.text : colors.textSecondary },
              ]}
              allowFontScaling
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: spacing.xxxs,
    marginTop: spacing.l,
    marginBottom: spacing.m,
  },
  tab: {
    flex: 1,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
});


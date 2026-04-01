import React from 'react';
import { View, Text, StyleSheet, Pressable, type ViewProps } from 'react-native';
import { spacing, radius, fontSizes, fontWeights } from '../theme';
import { Card } from './Card';
import { useThemeColors } from './useThemeColors';

export interface SettingsRowConfig {
  label: string;
  value?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export interface SettingsGroupCardProps extends ViewProps {
  title: string;
  rows: SettingsRowConfig[];
}

/**
 * Grouped frosted card for settings sections (Account, Preferences, Support).
 * Purely presentational; it receives callbacks from the screen.
 */
export function SettingsGroupCard({ title, rows, style, ...rest }: SettingsGroupCardProps) {
  const colors = useThemeColors();

  return (
    <View style={style} {...rest}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Card padded={false} elevated>
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          const RowComponent = row.onPress ? Pressable : View;
          return (
            <RowComponent
              key={row.label}
              style={[
                styles.row,
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
              {...(row.onPress
                ? {
                    onPress: row.onPress,
                    accessibilityRole: 'button',
                    accessibilityLabel: row.accessibilityLabel ?? row.label,
                  }
                : null)}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{row.label}</Text>
              </View>
              <View style={styles.rowRight}>
                {row.value ? (
                  <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{row.value}</Text>
                ) : null}
                <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
              </View>
            </RowComponent>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: fontSizes.base,
  },
  rowValue: {
    fontSize: fontSizes.sm,
  },
  chevron: {
    fontSize: fontSizes.base,
  },
});


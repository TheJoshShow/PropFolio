/**
 * Feature row: icon in rounded square + description text (welcome / onboarding).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { spacing, radius, fontSizes, fontWeights, lineHeights } from '../theme';
import { useThemeColors } from './useThemeColors';

export interface FeatureRowProps {
  icon: string;
  description: string;
}

export function FeatureRow({ icon, description }: FeatureRowProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { borderColor: colors.border }]}>
        <SymbolView name={icon as any} tintColor={colors.primary} size={20} />
      </View>
      <Text style={[styles.text, { color: colors.text }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  text: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.base,
  },
});

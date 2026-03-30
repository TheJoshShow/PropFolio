/**
 * Development-only checklist for EXPO_PUBLIC_SUPABASE_* (no secret values).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SupabaseAuthEnvPublicDiagnostics } from '../config/env';
import { spacing, fontSizes, lineHeights } from '../theme';

export interface SupabaseAuthEnvDevPanelProps {
  diagnostics: SupabaseAuthEnvPublicDiagnostics;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  surfaceColor: string;
}

export function SupabaseAuthEnvDevPanel({
  diagnostics,
  textColor,
  mutedColor,
  borderColor,
  surfaceColor,
}: SupabaseAuthEnvDevPanelProps) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  return (
    <View
      style={[styles.wrap, { borderColor, backgroundColor: surfaceColor }]}
      accessibilityLabel="Developer Supabase environment checklist"
    >
      <Text style={[styles.title, { color: mutedColor }]}>Developer: Supabase env (this build)</Text>
      {diagnostics.developerSummaryLines.map((line) => (
        <Text key={line} style={[styles.line, { color: textColor }]}>
          {line}
        </Text>
      ))}
      {!diagnostics.validationOk && diagnostics.invalidReasons.length > 0 ? (
        <Text style={[styles.hint, { color: mutedColor }]}>
          See Metro / Xcode console for full invalidReasons (dev only).
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  title: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginBottom: spacing.s,
    lineHeight: lineHeights.xs,
  },
  line: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.sm,
    marginBottom: spacing.xxs,
  },
  hint: {
    fontSize: fontSizes.xs,
    marginTop: spacing.s,
    lineHeight: lineHeights.xs,
  },
});

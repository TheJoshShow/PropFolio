import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { Card } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

import type { PaywallBillingResolution } from './paywallBillingResolution';

if (__DEV__ && Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  resolution: PaywallBillingResolution;
};

/**
 * One calm billing status region: primary message, optional supplementary note, dev diagnostics (expanded).
 */
export function PaywallBillingStatusPanel({ resolution }: Props) {
  const [devOpen, setDevOpen] = useState(false);

  const showPrimary = resolution.reason !== 'NONE';
  const showSupplementary = Boolean(resolution.supplementaryHint);

  if (!showPrimary && !showSupplementary && !__DEV__) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {showPrimary ? (
        <Card elevation="xs" style={styles.primaryCard}>
          <Text style={styles.primaryTitle}>{resolution.userTitle}</Text>
          <Text style={styles.primaryBody}>{resolution.userBody}</Text>
        </Card>
      ) : null}

      {showSupplementary ? (
        <Text style={styles.supplementary} accessibilityRole="text">
          {resolution.supplementaryHint}
        </Text>
      ) : null}

      {__DEV__ ? (
        <View style={styles.devOuter}>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setDevOpen((o) => !o);
            }}
            style={styles.devToggle}
            accessibilityRole="button"
            accessibilityLabel={devOpen ? 'Hide developer billing details' : 'Show developer billing details'}
          >
            <Text style={styles.devToggleText}>{devOpen ? '▼' : '▶'} Developer billing details</Text>
          </Pressable>
          {devOpen ? (
            <Card elevation="xs" style={styles.devCard}>
              <Text style={styles.devMono} selectable>
                {JSON.stringify(
                  {
                    reason: resolution.reason,
                    ...resolution.developerDiagnostics,
                  },
                  null,
                  2,
                )}
              </Text>
            </Card>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  primaryCard: {
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  primaryTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryBody: {
    ...typography.bodySecondary,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  supplementary: {
    ...typography.caption,
    lineHeight: 18,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  devOuter: { gap: spacing.xs },
  devToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignSelf: 'flex-start',
  },
  devToggleText: {
    ...typography.captionSmall,
    color: colors.textMuted,
  },
  devCard: {
    padding: spacing.sm,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  devMono: {
    ...typography.captionSmall,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.textSecondary,
  },
});

import { StyleSheet, Text } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { semantic, spacing, textPresets } from '@/theme';

export default function SettingsCurrencyScreen() {
  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Text style={styles.lead}>
        Currency controls are not available yet. Amounts throughout PropFolio are shown in USD.
      </Text>
      <Card elevation="xs" shape="sheet" style={styles.card}>
        <Text style={styles.label}>Current display</Text>
        <Text style={styles.value}>US Dollar (USD)</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  lead: {
    ...textPresets.bodySecondary,
    lineHeight: 24,
    color: semantic.textSecondary,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    ...textPresets.bodyMedium,
    color: semantic.textPrimary,
  },
});

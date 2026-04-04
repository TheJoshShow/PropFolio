import { StyleSheet, Text } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { semantic, spacing, textPresets } from '@/theme';

export default function SettingsThemeScreen() {
  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Text style={styles.lead}>
        Light and dark theme selection will be available in a future update. The app currently follows your system
        appearance where supported.
      </Text>
      <Card elevation="xs" shape="sheet" style={styles.card}>
        <Text style={styles.label}>Appearance</Text>
        <Text style={styles.value}>System default</Text>
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

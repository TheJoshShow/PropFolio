import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function NotificationsScreen() {
  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Text style={styles.lead}>
        Choose how PropFolio reaches you about deals, score changes, and subscription events.
      </Text>
      <Card elevation="xs" style={styles.card}>
        <Row label="Push notifications" status="Off (coming soon)" />
        <View style={styles.divider} />
        <Row label="Email digests" status="Off (coming soon)" />
        <View style={styles.divider} />
        <Row label="Marketing" status="Off (coming soon)" />
      </Card>
      <Text style={styles.foot}>
        Placeholder — connect Expo push + preference storage; respect opt-in before enabling any channel.
      </Text>
    </Screen>
  );
}

function Row({ label, status }: { label: string; status: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowStatus}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  lead: {
    ...typography.bodySecondary,
    lineHeight: 24,
  },
  card: {
    padding: spacing.lg,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
  },
  rowStatus: {
    ...typography.caption,
    color: colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  foot: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

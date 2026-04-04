import { StyleSheet, Text } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { colors, spacing, typography } from '@/theme';

export default function PersonalInformationScreen() {
  const { user, profile } = useAuth();

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Text style={styles.lead}>
        Your display identity comes from your account. Profile fields will sync from Supabase when the profile API
        is fully wired.
      </Text>
      <Card elevation="xs" style={styles.card}>
        <Text style={styles.label}>Full name</Text>
        <Text style={styles.value}>{profile?.full_name?.trim() || '—'}</Text>
      </Card>
      <Card elevation="xs" style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </Card>
      <Text style={styles.foot}>
        Placeholder screen — add editable fields + validation when `profiles` table and RLS policies are ready.
      </Text>
    </Screen>
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
    gap: spacing.xs,
  },
  label: {
    ...typography.metricLabel,
  },
  value: {
    ...typography.bodyMedium,
  },
  foot: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});

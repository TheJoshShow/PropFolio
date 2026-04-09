import type { User } from '@supabase/supabase-js';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { resolveUserFullNameForDisplay, type ProfileRow } from '@/services/auth';
import { layout, semantic, spacing, typography } from '@/theme';

function displayPhone(profile: ProfileRow | null, user: User | null): string {
  const fromProfile = profile?.phone?.trim();
  if (fromProfile) {
    return fromProfile;
  }
  const raw = user?.user_metadata?.phone;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return '—';
}

export default function AccountDetailsScreen() {
  const { user, profile } = useAuth();
  const fullName = resolveUserFullNameForDisplay(profile, user);
  const email = user?.email ?? '—';
  const phone = displayPhone(profile, user);

  return (
    <Screen
      scroll
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.body}
      testID="propfolio.settings.account"
    >
      <Card elevation="xs" style={styles.card}>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email} numberOfLines={2}>
          {email}
        </Text>
      </Card>

      <Card elevation="xs" style={styles.card}>
        <View style={styles.phoneBlock}>
          <Text style={styles.label}>Phone number</Text>
          <Text style={styles.value}>{phone}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyMedium,
    fontSize: 18,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  email: {
    ...typography.bodySecondary,
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  phoneBlock: {
    gap: spacing.xs,
  },
  label: {
    ...typography.metricLabel,
  },
  value: {
    ...typography.bodyMedium,
    color: semantic.textPrimary,
  },
});

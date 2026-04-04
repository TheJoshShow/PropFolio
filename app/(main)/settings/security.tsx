import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function SecurityScreen() {
  const router = useRouter();

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Text style={styles.lead}>
        Password and MFA are managed through your auth provider. Use a strong, unique password for your PropFolio
        account.
      </Text>
      <Card elevation="xs" style={styles.card}>
        <Text style={styles.cardTitle}>Password</Text>
        <Text style={styles.cardBody}>
          Request a reset link from the sign-in screen if you need to change your password.
        </Text>
        <AppButton label="Open sign-in flow" variant="secondary" onPress={() => router.replace('/')} />
      </Card>
      <Text style={styles.foot}>
        Placeholder — wire “Change password” to Supabase `updateUser` or deep link to hosted account portal when
        product is ready.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  lead: {
    ...typography.bodySecondary,
    lineHeight: 24,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.bodyMedium,
  },
  cardBody: {
    ...typography.bodySecondary,
  },
  foot: {
    ...typography.caption,
    color: colors.textMuted,
  },
});

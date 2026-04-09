import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { BILLING_COPY } from '@/features/billing';
import {
  accessRestrictedBody,
  accessRestrictedTitle,
  useSubscription,
} from '@/features/subscription';
import { colors, spacing, typography } from '@/theme';

export default function AccessRestrictedScreen() {
  const router = useRouter();
  const sub = useSubscription();

  useEffect(() => {
    if (sub.accessHydrated && sub.hasAppAccess) {
      router.replace('/portfolio');
    }
  }, [router, sub.accessHydrated, sub.hasAppAccess]);

  const onSubscribe = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  const onRestore = useCallback(() => {
    void (async () => {
      await sub.restorePurchases();
      await sub.refresh();
    })();
  }, [sub]);

  const onSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const title = accessRestrictedTitle(sub.accessDisplayState);
  const body = accessRestrictedBody(sub.accessDisplayState);

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Card elevation="sm" style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={36} color={colors.accentCta} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.bodyText}>{body}</Text>
      </Card>

      <View style={styles.actions}>
        <AppButton
          label={BILLING_COPY.startMembershipCta}
          onPress={onSubscribe}
          testID="propfolio.access.subscribe"
        />
        <AppButton
          label={sub.isRestoring ? 'Restoring…' : BILLING_COPY.restore}
          variant="secondary"
          onPress={onRestore}
          loading={sub.isRestoring}
          disabled={sub.isRestoring}
          testID="propfolio.access.restore"
        />
        <AppButton label="Settings & account" variant="ghost" onPress={onSettings} />
      </View>

      {sub.lastError ? <Text style={styles.err}>{sub.lastError}</Text> : null}

      <Text style={styles.foot}>
        Help, legal, and account stay under Settings. Credits in your wallet are kept for your next membership—they never
        replace an active membership.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    borderColor: colors.accentCta,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentScoreMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.screenTitleSmall,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  bodyText: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
  err: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  foot: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

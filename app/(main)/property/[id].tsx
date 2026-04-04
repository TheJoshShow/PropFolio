import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton, Card, Screen } from '@/components/ui';
import { PropertyDetailView, usePropertyDetail } from '@/features/property';
import { colors, spacing, typography } from '@/theme';

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { property, loading, error, refresh } = usePropertyDetail(id);

  if (loading && !property) {
    return (
      <Screen
        scroll={false}
        safeAreaEdges={['bottom', 'left', 'right']}
        contentContainerStyle={styles.centered}
        testID="propfolio.property.loading"
      >
        <ActivityIndicator color={colors.accentCta} size="large" accessibilityLabel="Loading property" />
        <Text style={styles.muted}>Loading property…</Text>
      </Screen>
    );
  }

  if (error || !property) {
    return (
      <Screen
        scroll
        safeAreaEdges={['bottom', 'left', 'right']}
        contentContainerStyle={styles.errorWrap}
        testID="propfolio.property.error"
      >
        <Card elevation="sm" style={styles.errorCard}>
          <Text style={styles.errorTitle}>Can’t show this property</Text>
          <Text style={styles.errorBody}>{error ?? 'Something went wrong.'}</Text>
          <AppButton label="Try again" onPress={() => void refresh()} />
          <AppButton label="Back to portfolio" variant="secondary" onPress={() => router.replace('/portfolio')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.fill}
      testID="propfolio.property.detail"
    >
      <PropertyDetailView property={property} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  muted: {
    ...typography.bodySecondary,
    color: colors.textMuted,
  },
  errorWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  errorCard: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.cardTitle,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

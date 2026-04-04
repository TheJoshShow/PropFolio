import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  Card,
  FloatingActionButton,
  PortfolioListSkeleton,
  PortfolioPropertyCard,
  PortfolioSummaryRow,
  Screen,
  formatPortfolioValue,
} from '@/components/ui';
import { buildPortfolioView, usePortfolioHeader, useProperties } from '@/features/portfolio';
import { useSubscription } from '@/features/subscription';
import { colors, layout, semantic, spacing, typography } from '@/theme';

export default function PortfolioScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { properties, loading, error, refresh } = useProperties();
  const sub = useSubscription();

  const onPullRefresh = useCallback(() => {
    void refresh();
    void sub.refresh();
  }, [refresh, sub]);

  const { items, stats } = useMemo(() => buildPortfolioView(properties), [properties]);

  const onImport = useCallback(() => {
    router.push('/import-property');
  }, [router]);

  usePortfolioHeader(navigation, router, onImport);

  const showInitialLoad = loading && properties.length === 0;
  const showEmpty = !loading && properties.length === 0 && !error;
  const showFatalError = !loading && properties.length === 0 && Boolean(error);
  const fabBottom = Math.max(insets.bottom, spacing.md) + spacing.sm;

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.sectionLabel}>My Portfolio</Text>
      </View>
    ),
    [],
  );

  const listFooter = useMemo(
    () => (
      <PortfolioSummaryRow totalValueFormatted={formatPortfolioValue(stats.totalEstimatedValue)} />
    ),
    [stats.totalEstimatedValue],
  );

  if (showInitialLoad) {
    return (
      <Screen
        scroll={false}
        safeAreaEdges={['bottom', 'left', 'right']}
        contentContainerStyle={styles.flex}
        testID="propfolio.portfolio.loading"
      >
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>My Portfolio</Text>
          <PortfolioListSkeleton count={6} />
          <PortfolioSummaryRow totalValueFormatted="—" />
        </View>
      </Screen>
    );
  }

  if (showFatalError) {
    return (
      <Screen
        scroll
        safeAreaEdges={['bottom', 'left', 'right']}
        contentContainerStyle={styles.errorScroll}
        testID="propfolio.portfolio.error"
      >
        <Card elevation="md" style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.errorTitle}>Couldn’t load portfolio</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <AppButton
            label="Try again"
            onPress={() => void refresh()}
            style={styles.errorBtn}
            testID="propfolio.portfolio.retry"
          />
        </Card>
      </Screen>
    );
  }

  if (showEmpty) {
    return (
      <Screen
        scroll={false}
        safeAreaEdges={['bottom', 'left', 'right']}
        contentContainerStyle={styles.flex}
        testID="propfolio.portfolio.empty"
      >
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>My Portfolio</Text>
          <Card elevation="sm" style={styles.emptyCard}>
            <Text style={styles.emptyKicker}>Start here</Text>
            <Text style={styles.emptyTitle}>Your portfolio is empty</Text>
            <Text style={styles.emptyBody}>
              Import a listing or run an address to get a confidence score, cash flow read, and deal signals
              — without MLS lock-in.
            </Text>
            <AppButton
              label="Import a property"
              onPress={onImport}
              leftIcon={<Ionicons name="add" size={22} color={colors.onCta} />}
              testID="propfolio.portfolio.importCta"
            />
          </Card>
          <PortfolioSummaryRow totalValueFormatted="—" />
        </View>
        <FloatingActionButton
          accessibilityLabel="Import property"
          onPress={onImport}
          style={[styles.fab, { bottom: fabBottom }]}
          icon={<Ionicons name="add" size={30} color={colors.onCta} />}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.flex}
      testID="propfolio.portfolio.main"
    >
      {error ? (
        <Pressable onPress={() => void refresh()} style={styles.inlineBanner} accessibilityRole="button">
          <Ionicons name="alert-circle" size={18} color={semantic.danger} />
          <Text style={styles.inlineBannerText} numberOfLines={2}>
            {error} · Tap to retry
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        testID="propfolio.portfolio.list"
        data={items}
        keyExtractor={(item) => item.id}
        removeClippedSubviews={Platform.OS === 'android'}
        windowSize={7}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        renderItem={({ item }) => (
          <PortfolioPropertyCard
            style={styles.cardGap}
            address={item.address}
            rentLabel={item.rentLabel}
            priceLabel={item.priceLabel}
            scoreValue={item.scoreValue}
            scoreLabel={item.scoreLabel}
            scoreLabelColor={item.scoreLabelColor}
            scoreTier={item.scoreTier}
            metricPreviewLabel={item.metricPreviewLabel}
            metricPreviewValue={item.metricPreviewValue}
            onPress={() => router.push(`/property/${item.id}`)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: fabBottom + 56 + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && properties.length > 0}
            onRefresh={onPullRefresh}
            tintColor={semantic.accentGold}
          />
        }
      />

      <FloatingActionButton
        accessibilityLabel="Import property"
        onPress={onImport}
        style={[styles.fab, { bottom: fabBottom }]}
        icon={<Ionicons name="add" size={30} color={colors.onCta} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    flex: 1,
    gap: spacing.lg,
  },
  listHeader: {
    marginBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.sectionHeader,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: spacing.xs,
  },
  cardGap: {
    marginBottom: spacing.md,
  },
  inlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: semantic.surface,
    borderRadius: layout.minTapSize / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    marginBottom: spacing.sm,
  },
  inlineBannerText: {
    ...typography.caption,
    color: semantic.danger,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 0,
  },
  emptyCard: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyKicker: {
    ...typography.sectionHeader,
    color: colors.accentCta,
  },
  emptyTitle: {
    ...typography.cardTitle,
    fontSize: 22,
  },
  emptyBody: {
    ...typography.bodySecondary,
    lineHeight: 24,
  },
  errorScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  errorCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    ...typography.cardTitle,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  errorBtn: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
});

import React, { useCallback, useEffect } from 'react';
import { Text, StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FreeImportsIndicator, PropFolioBrandHeader } from '../../src/components';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { useImportLimit } from '../../src/hooks/useImportLimit';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePortfolioProperties } from '../../src/hooks/usePortfolioProperties';
import { usePortfolioCoordinateBackfill } from '../../src/hooks/usePortfolioCoordinateBackfill';
import { FREE_IMPORT_LIMIT } from '../../src/services/importLimits';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { hrefPortfolioPropertyDetail } from '../../src/utils/appNavigation';
import type { PortfolioListItem } from '../../src/hooks/usePortfolioProperties';
import { cardShadow } from '../../src/theme/shadows';

function formatCurrency(n: number | null): string {
  if (n == null) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function scoreLabel(score: number | null, band: string): string {
  if (score != null) return `${Math.round(score)}`;
  return band === 'insufficientData' ? '—' : '—';
}

function PortfolioCard({ item, onPress }: { item: PortfolioListItem; onPress: () => void }) {
  const colors = useThemeColors();
  const address = [item.streetAddress, item.unit].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.9 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open analysis for ${address}`}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.cardAddressBlock}>
          <Text style={[styles.cardAddress, { color: colors.text }]} numberOfLines={1}>
            {address || 'No address'}
          </Text>
          <Text style={[styles.cardCityState, { color: colors.textSecondary }]} numberOfLines={1}>
            {[item.city, item.state].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.scoreValue, { color: colors.onPrimary }]}>
            {scoreLabel(item.displayedDealScore, item.dealBand)}
          </Text>
        </View>
      </View>

      <View style={styles.cardMidRow}>
        <Text style={[styles.cardMetricLarge, { color: colors.text }]}>
          {formatCurrency(item.rent)} /mo
        </Text>
        <Text style={[styles.cardMetricLarge, { color: colors.text }]}>
          {formatCurrency(item.listPrice)}
        </Text>
      </View>

      <View style={styles.cardBottomRow}>
        <Text style={[styles.cardQuality, { color: colors.textSecondary }]}>
          {item.dealBandLabel}
        </Text>
        <Text style={[styles.cardPercent, { color: colors.textSecondary }]}>
          {item.primaryMetricLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { freeRemaining, isLoading: limitLoading } = useImportLimit();
  const { hasProAccess } = useSubscription();
  const {
    list: portfolioList,
    rawProperties,
    loading: portfolioLoading,
    refresh: refreshPortfolio,
    error,
  } = usePortfolioProperties(session?.id ?? null);

  usePortfolioCoordinateBackfill(session?.id ?? null, rawProperties, refreshPortfolio);

  const handlePressProperty = useCallback(
    (id: string) => {
      const href = hrefPortfolioPropertyDetail(id);
      if (href) router.push(href);
    },
    [router],
  );

  const handlePressImport = () => {
    router.push('/(tabs)/import');
  };

  const handlePressSettings = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <ScreenContainer>
      <View style={[styles.root, { paddingBottom: insets.bottom + spacing.l }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handlePressImport}
            accessibilityRole="button"
            accessibilityLabel="Import a property"
            style={({ pressed }) => [
              styles.headerIconButton,
              { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.headerIconLabel, { color: colors.text }]}>＋</Text>
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <PropFolioBrandHeader />
          </View>

          <Pressable
            onPress={handlePressSettings}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [
              styles.headerIconButton,
              { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.headerIconLabel, { color: colors.text }]}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>My Portfolio</Text>
          <FreeImportsIndicator
            freeRemaining={freeRemaining}
            limit={FREE_IMPORT_LIMIT}
            isPro={hasProAccess}
            isLoading={limitLoading}
            variant="compact"
          />
        </View>

        <FlatList
          data={portfolioList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, responsiveContentContainer]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={portfolioLoading && portfolioList.length > 0}
              onRefresh={() => {
                void refreshPortfolio();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            !portfolioLoading && !error ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add your first property to see it here.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <PortfolioCard item={item} onPress={() => handlePressProperty(item.id)} />
          )}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.l,
    gap: spacing.l,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconLabel: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerCopy: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.title,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.s,
  },
  emptyText: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    borderRadius: radius.l,
    borderWidth: 1,
    padding: spacing.m,
    gap: spacing.s,
    ...cardShadow,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardAddressBlock: {
    flex: 1,
    marginRight: spacing.s,
  },
  cardAddress: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  cardCityState: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xxxs,
  },
  scoreBadge: {
    minWidth: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  cardMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardMetricLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardQuality: {
    fontSize: fontSizes.sm,
  },
  cardPercent: {
    fontSize: fontSizes.sm,
  },
});

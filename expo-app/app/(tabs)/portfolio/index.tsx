/**
 * Portfolio list: saved properties with deal/confidence badges, pull-to-refresh, loading/empty/error.
 */

import React, { useEffect } from 'react';
import {
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/contexts/AuthContext';
import { usePortfolioProperties, type PortfolioListItem } from '../../../src/hooks/usePortfolioProperties';
import { Card, Button, Chip, ImportFab } from '../../../src/components';
import { useThemeColors } from '../../../src/components/useThemeColors';
import { spacing, fontSizes, lineHeights, radius, fontWeights } from '../../../src/theme';
import { responsiveContentContainer } from '../../../src/utils/responsive';
import { IMPORT_FAB_SCROLL_INSET } from '../../../src/constants/fabLayout';
import type { DealScoreBand } from '../../../src/lib/scoring/types';
import type { ConfidenceMeterBand } from '../../../src/lib/confidence/types';
import { trackEvent } from '../../../src/services/analytics';

function formatCurrency(n: number | null): string {
  if (n == null) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function scoreLabel(score: number | null, band: string): string {
  if (score != null) return `${Math.round(score)}`;
  return band === 'insufficientData' ? '—' : '—';
}

function dealBandLabel(band: DealScoreBand): string {
  switch (band) {
    case 'exceptional': return 'Exceptional';
    case 'strong': return 'Strong';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'weak': return 'Weak';
    case 'poor': return 'Poor';
    case 'insufficientData': return 'Insufficient data';
    default: return 'Insufficient data';
  }
}

function confidenceBandLabel(band: ConfidenceMeterBand): string {
  switch (band) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    case 'veryLow': return 'Very low';
    default: return 'Very low';
  }
}

function PropertyRow({
  item,
  onPress,
  colors,
}: {
  item: PortfolioListItem;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const address = [item.streetAddress, item.unit].filter(Boolean).join(', ');
  const cityState = [item.city, item.state].filter(Boolean).join(', ');
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.9 },
      ]}
      onPress={onPress}
      accessibilityLabel={`${address}. Deal score ${scoreLabel(item.displayedDealScore, item.dealBand)}. Confidence ${item.confidenceBand}.`}
      accessibilityRole="button"
    >
      <View style={styles.rowMain}>
        <Text style={[styles.address, { color: colors.text }]} numberOfLines={1}>
          {address || 'No address'}
        </Text>
        {cityState ? (
          <Text style={[styles.cityState, { color: colors.textSecondary }]} numberOfLines={1}>
            {cityState}
          </Text>
        ) : null}
        <View style={styles.badges}>
          <Chip label={`Deal ${scoreLabel(item.displayedDealScore, item.dealBand)}`} style={styles.badge} />
          <Chip label={`${confidenceBandLabel(item.confidenceBand)} conf`} style={styles.badge} />
        </View>
        <View style={styles.metrics}>
          <Text style={[styles.metric, { color: colors.textSecondary }]}>
            Rent {formatCurrency(item.rent)}
          </Text>
          <Text style={[styles.metric, { color: colors.textSecondary }]}>
            CF {formatCurrency(item.monthlyCashFlow)}
          </Text>
          <Text style={[styles.updated, { color: colors.textMuted }]}>
            {formatDate(item.updatedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PortfolioListScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.id ?? null;
  const { list, loading, error, refresh } = usePortfolioProperties(userId);

  const handleRetry = () => {
    refresh();
  };

  const handlePropertyPress = (id: string) => {
    router.push({ pathname: '/(tabs)/portfolio/[id]', params: { id } });
  };

  useEffect(() => {
    if (!loading) {
      trackEvent('portfolio_list_viewed', { metadata: { listCount: list.length } });
    }
  }, [loading]);

  if (loading && list.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your saved properties.</Text>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
          </View>
          <ImportFab />
        </View>
      </SafeAreaView>
    );
  }

  if (error && list.length === 0) {
    const isOffline = /offline|network|fetch|connection/i.test(error);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your saved properties.</Text>
          <Card style={styles.card} elevated>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              {isOffline ? "You're offline" : 'Something went wrong'}
            </Text>
            <Text style={[styles.errorBody, { color: colors.textSecondary }]}>
              {isOffline ? 'Check your connection and try again.' : error}
            </Text>
            <Button title="Retry" onPress={handleRetry} fullWidth variant="secondary" accessibilityLabel="Retry" pill={false} />
          </Card>
          <ImportFab />
        </View>
      </SafeAreaView>
    );
  }

  if (list.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your saved properties.</Text>
          <Card style={styles.card} elevated>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No properties yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Tap the + button to import a listing link or address and save it to your portfolio.
            </Text>
          </Card>
          <ImportFab />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your saved properties.</Text>
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyRow item={item} onPress={() => handlePropertyPress(item.id)} colors={colors} />
          )}
          contentContainerStyle={[styles.listContent, responsiveContentContainer]}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading && list.length > 0} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListFooterComponent={
            error ? (
              <View style={styles.footerError}>
                <Text style={[styles.footerErrorText, { color: colors.error }]}>{error}</Text>
                <Button title="Retry" onPress={handleRetry} variant="secondary" accessibilityLabel="Retry" pill={false} />
              </View>
            ) : null
          }
        />
        <ImportFab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, lineHeight: lineHeights.title, marginBottom: spacing.xxs, paddingHorizontal: spacing.xl },
  subtitle: { fontSize: fontSizes.base, marginBottom: spacing.s, paddingHorizontal: spacing.xl, lineHeight: lineHeights.base },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl + IMPORT_FAB_SCROLL_INSET },
  row: {
    padding: spacing.m,
    borderRadius: radius.l,
    borderWidth: 1,
    marginBottom: spacing.s,
  },
  rowMain: { gap: spacing.xxs },
  address: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, lineHeight: lineHeights.lg },
  cityState: { fontSize: fontSizes.base, lineHeight: lineHeights.base },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  badge: { alignSelf: 'flex-start' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.xs },
  metric: { fontSize: fontSizes.sm },
  updated: { fontSize: fontSizes.sm },
  card: { marginHorizontal: spacing.xl, marginBottom: spacing.l },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, marginBottom: spacing.xs, lineHeight: lineHeights.lg },
  emptyBody: { fontSize: fontSizes.base, marginBottom: spacing.m, lineHeight: lineHeights.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.m, padding: spacing.xl },
  loadingText: { fontSize: fontSizes.base },
  errorTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, marginBottom: spacing.xs },
  errorBody: { fontSize: fontSizes.base, marginBottom: spacing.m },
  footerError: { padding: spacing.xl, alignItems: 'center', gap: spacing.s },
  footerErrorText: { fontSize: fontSizes.sm },
});

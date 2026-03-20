/**
 * Home / Dashboard. Portfolio map + floating import action.
 */

import React from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FreeImportsIndicator,
  PropFolioBrandHeader,
  PortfolioPropertyMap,
  ImportFab,
} from '../../src/components';
import { spacing, fontSizes, lineHeights } from '../../src/theme';
import { useThemeColors } from '../../src/components/useThemeColors';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { useImportLimit } from '../../src/hooks/useImportLimit';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePortfolioProperties } from '../../src/hooks/usePortfolioProperties';
import { usePortfolioCoordinateBackfill } from '../../src/hooks/usePortfolioCoordinateBackfill';
import { FREE_IMPORT_LIMIT } from '../../src/services/importLimits';
import { IMPORT_FAB_SCROLL_INSET } from '../../src/constants/fabLayout';

export default function HomeScreen() {
  const colors = useThemeColors();
  const { session } = useAuth();
  const { freeRemaining, isLoading: limitLoading } = useImportLimit();
  const { hasProAccess } = useSubscription();
  const { list: portfolioList, rawProperties, loading: portfolioLoading, refresh: refreshPortfolio } =
    usePortfolioProperties(session?.id ?? null);

  usePortfolioCoordinateBackfill(session?.id ?? null, rawProperties, refreshPortfolio);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, responsiveContentContainer]}
          showsVerticalScrollIndicator={false}
        >
          <PropFolioBrandHeader marginBottom={spacing.s} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add a property to get a confidence score and analysis.
          </Text>
          <FreeImportsIndicator
            freeRemaining={freeRemaining}
            limit={FREE_IMPORT_LIMIT}
            isPro={hasProAccess}
            isLoading={limitLoading}
            variant="compact"
          />
          <PortfolioPropertyMap properties={portfolioList} loading={portfolioLoading} />
        </ScrollView>
        <ImportFab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingTop: spacing.m, paddingBottom: spacing.xxxl + IMPORT_FAB_SCROLL_INSET },
  subtitle: { fontSize: fontSizes.base, marginBottom: spacing.xl, lineHeight: lineHeights.lg },
});

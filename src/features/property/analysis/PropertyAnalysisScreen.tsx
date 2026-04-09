import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppBackButton,
  headerLeadingInset,
  headerSymmetricCornerSlot,
  headerTrailingInset,
  HeaderTextAction,
} from '@/components/navigation';
import { Card, ScoreBadge } from '@/components/ui';
import { AssumptionsEditorModal } from '@/features/property/detail/AssumptionsEditorModal';
import { investmentStrategyLabel } from '@/lib/investmentStrategy';
import {
  portfolioScoreLabel,
  portfolioScoreLabelColor,
  portfolioScoreTier,
} from '@/lib/portfolioScorePresentation';
import { parseMissingFields, type PropertyRow } from '@/types/property';
import { hitSlop, iconSizes, layout, navigationChrome, semantic, spacing, textPresets } from '@/theme';

import { formatImportNoteMessage } from '../formatImportNoteMessage';
import { AnalysisSummaryCard } from './AnalysisSummaryCard';
import { AnalysisTabSwitcher, type AnalysisTabKey } from './AnalysisTabSwitcher';
import { buildPropertyAnalysisSummary } from './buildPropertyAnalysisSummary';
import { FinancialPanelContainer } from './FinancialPanelContainer';
import { MarketDataPanel } from './panels/MarketDataPanel';
import { RenovationPanel } from './panels/RenovationPanel';
import { financialPanelKindFromStrategy } from './resolveFinancialPanelKind';
import { usePropertyDetailScoring } from '../usePropertyDetailScoring';

type Props = {
  property: PropertyRow;
};

export function PropertyAnalysisScreen({ property }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AnalysisTabKey>('financials');
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const saveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    userOverrides,
    setUserOverrides,
    stressScenario,
    setStressScenario,
    breakdown,
    saveScenario,
    resetToBaseline,
    hasModelingLayer,
  } = usePropertyDetailScoring(property);

  const title =
    property.formatted_address?.trim() || property.snapshot?.address?.formatted || 'Property';

  const snap = property.snapshot;
  const invStrategy = snap?.investmentStrategy;
  const financialKind = financialPanelKindFromStrategy(invStrategy);
  const missingDb = parseMissingFields(property);

  const summaryRows = useMemo(
    () => buildPropertyAnalysisSummary(property, breakdown),
    [property, breakdown],
  );

  const warningLines = useMemo(() => {
    if (!breakdown) {
      return missingDb.map((m) => m.replace(/_/g, ' '));
    }
    const fromConf = breakdown.confidence.penalties.map((p) => p.label);
    const fromDb = missingDb.map((m) => m.replace(/_/g, ' '));
    return [...new Set([...fromDb, ...fromConf])];
  }, [breakdown, missingDb]);

  const importNote = useMemo(
    () => formatImportNoteMessage(property.last_import_error),
    [property.last_import_error],
  );

  const tier = breakdown
    ? portfolioScoreTier(breakdown.confidence.score, property.status)
    : 'needs_review';
  const qualityLabel = portfolioScoreLabel(tier);
  const qualityColor = portfolioScoreLabelColor(tier);

  const openEditor = useCallback(() => setEditorOpen(true), []);
  const closeEditor = useCallback(() => setEditorOpen(false), []);

  const handlePersistScenario = useCallback(async () => {
    await saveScenario();
    if (saveHintTimerRef.current) {
      clearTimeout(saveHintTimerRef.current);
    }
    setSaveHint('Saved on this device');
    saveHintTimerRef.current = setTimeout(() => {
      setSaveHint(null);
      saveHintTimerRef.current = null;
    }, 2500);
  }, [saveScenario]);

  useEffect(
    () => () => {
      if (saveHintTimerRef.current) {
        clearTimeout(saveHintTimerRef.current);
      }
    },
    [],
  );

  const headerTitleNode = useCallback(
    () => (
      <Text
        style={styles.headerTitleText}
        numberOfLines={2}
        ellipsizeMode="tail"
        accessibilityRole="header"
      >
        {title}
      </Text>
    ),
    [title],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: headerTitleNode,
      headerTitleAlign: 'center',
      headerLargeTitle: false,
      headerShadowVisible: false,
      headerLeftContainerStyle: headerLeadingInset(insets.left),
      headerRightContainerStyle: headerTrailingInset(insets.right),
      headerLeft: () => (
        <View style={headerSymmetricCornerSlot('leading')}>
          <AppBackButton onPress={() => navigation.goBack()} testID="propfolio.property.header.back" />
        </View>
      ),
      headerRight: () => (
        <View style={headerSymmetricCornerSlot('trailing')}>
          <HeaderTextAction
            label="Adjust"
            onPress={openEditor}
            accessibilityLabel="Adjust assumptions"
            testID="propfolio.property.header.adjust"
            style={styles.headerTrailingTextAction}
          />
        </View>
      ),
    });
  }, [navigation, headerTitleNode, openEditor, insets.left, insets.right]);

  const strategyLine =
    invStrategy != null ? investmentStrategyLabel(invStrategy) : 'Strategy not set';

  return (
    <>
      <ScrollView
        testID="propfolio.property.scroll"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.strategyPill}>{strategyLine}</Text>

        {property.status === 'draft' ? (
          <Card elevation="xs" style={styles.draftCard}>
            <View style={styles.warnHead}>
              <Ionicons name="alert-circle-outline" size={22} color={semantic.accentGold} />
              <Text style={styles.warnTitle}>Incomplete import (draft)</Text>
            </View>
            <Text style={styles.warnBody}>
              Core listing fields are still missing (for example beds, baths, square footage, or rent estimate). Open
              Adjust to enter assumptions, or confirm the address and try importing again. Metrics below use defaults
              where the engine does not yet have real values.
            </Text>
          </Card>
        ) : null}

        {property.status === 'error' ? (
          <Card elevation="xs" style={styles.errorCard}>
            <View style={styles.warnHead}>
              <Ionicons name="close-circle-outline" size={22} color={semantic.warning} />
              <Text style={styles.warnTitle}>Import could not build a full address</Text>
            </View>
            <Text style={styles.warnBody}>
              Re-import after selecting a full street address from search, or paste a listing link that includes
              enough location detail for the app to resolve the property.
            </Text>
          </Card>
        ) : null}

        {!breakdown ? (
          <View style={styles.scoringLoading} testID="propfolio.property.scoring.loading">
            <ActivityIndicator color={semantic.accentGold} accessibilityLabel="Computing scores" />
            <Text style={styles.loadingCaption}>Preparing analysis…</Text>
          </View>
        ) : (
          <View style={styles.scoreStrip}>
            <ScoreBadge score={breakdown.confidence.score} size="md" />
            <Text style={[styles.quality, { color: qualityColor }]}>{qualityLabel}</Text>
          </View>
        )}

        <AnalysisSummaryCard rows={summaryRows} />

        {warningLines.length > 0 ? (
          <Card elevation="xs" style={styles.warnCard}>
            <View style={styles.warnHead}>
              <Ionicons name="information-circle-outline" size={22} color={semantic.warning} />
              <Text style={styles.warnTitle}>Data gaps affecting confidence</Text>
            </View>
            <Text style={styles.warnBody}>
              Fill missing fields in Adjust → property & operating to clear warnings. Engine uses defaults for
              unknowns — labels below show what each metric still needs.
            </Text>
            <View style={styles.warnList}>
              {warningLines.slice(0, 8).map((line) => (
                <Text key={line} style={styles.warnItem}>
                  · {line}
                </Text>
              ))}
            </View>
          </Card>
        ) : null}

        {importNote ? <Text style={styles.importErr}>Import note: {importNote}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionChip}
            onPress={openEditor}
            accessibilityRole="button"
            hitSlop={hitSlop}
          >
            <Ionicons name="options-outline" size={18} color={semantic.accentGold} />
            <Text style={styles.actionChipText}>Assumptions & what-if</Text>
          </Pressable>
          {hasModelingLayer ? (
            <>
              <Pressable
                style={styles.actionChipSecondary}
                onPress={() => void handlePersistScenario()}
                accessibilityRole="button"
                hitSlop={hitSlop}
                testID="propfolio.property.saveScenario"
              >
                <Text style={styles.actionChipSecondaryText}>Save</Text>
              </Pressable>
              <Pressable
                style={styles.actionChipSecondary}
                onPress={() => void resetToBaseline()}
                accessibilityRole="button"
                hitSlop={hitSlop}
              >
                <Text style={styles.actionChipSecondaryText}>Reset</Text>
              </Pressable>
            </>
          ) : null}
        </View>
        {saveHint ? <Text style={styles.saveHint}>{saveHint}</Text> : null}

        <AnalysisTabSwitcher selectedKey={tab} onSelect={setTab} style={styles.tabBar} />

        <View style={styles.panelWrap}>
          {tab === 'market' ? (
            <MarketDataPanel snapshot={snap} />
          ) : tab === 'renovation' ? (
            <RenovationPanel
              property={property}
              userOverrides={userOverrides}
              breakdown={breakdown}
              stressScenario={stressScenario}
              setStressScenario={setStressScenario}
            />
          ) : !breakdown ? (
            <Text style={styles.panelFallback}>Metrics will appear when analysis is ready.</Text>
          ) : (
            <FinancialPanelContainer kind={financialKind} property={property} breakdown={breakdown} />
          )}
        </View>

        <Text style={styles.aiNote}>
          AI summary (when enabled) is narrative-only — it will never invent these numbers.
        </Text>
      </ScrollView>

      <AssumptionsEditorModal
        visible={editorOpen}
        onClose={closeEditor}
        snapshot={snap}
        userOverrides={userOverrides}
        onApply={setUserOverrides}
        onResetToImport={() => {
          void resetToBaseline().then(() => closeEditor());
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: layout.listContentBottom,
  },
  strategyPill: {
    ...textPresets.caption,
    fontWeight: '600',
    textAlign: 'center',
    color: semantic.textSecondary,
    marginBottom: spacing.sm,
  },
  scoringLoading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingCaption: {
    ...textPresets.caption,
    color: semantic.textTertiary,
  },
  scoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quality: {
    ...textPresets.captionSmall,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitleText: {
    ...textPresets.bodyMedium,
    fontSize: 17,
    fontWeight: '600',
    color: semantic.textPrimary,
    textAlign: 'center',
    maxWidth: 220,
    alignSelf: 'center',
  },
  headerTrailingTextAction: {
    paddingHorizontal: 6,
    minWidth: navigationChrome.headerActionSlotWidth,
  },
  draftCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.accentGold,
    backgroundColor: semantic.surface,
  },
  errorCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.warning,
    backgroundColor: semantic.surface,
  },
  warnCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderColor: semantic.warning,
    backgroundColor: semantic.surface,
  },
  warnHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  warnTitle: {
    ...textPresets.bodyMedium,
    flex: 1,
    color: semantic.textPrimary,
  },
  warnBody: {
    ...textPresets.bodySecondary,
    marginBottom: spacing.sm,
    color: semantic.textSecondary,
  },
  warnList: {
    gap: spacing.xxs,
  },
  warnItem: {
    ...textPresets.caption,
    color: semantic.textSecondary,
  },
  importErr: {
    ...textPresets.caption,
    color: semantic.warning,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: semantic.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.accentGold,
  },
  actionChipText: {
    ...textPresets.bodyMedium,
    color: semantic.accentGold,
    fontSize: 15,
  },
  actionChipSecondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: semantic.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  actionChipSecondaryText: {
    ...textPresets.caption,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  saveHint: {
    ...textPresets.caption,
    color: semantic.success,
    marginBottom: spacing.sm,
  },
  tabBar: {
    marginBottom: spacing.md,
  },
  panelWrap: {
    minHeight: 120,
  },
  panelFallback: {
    ...textPresets.bodySecondary,
    color: semantic.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  aiNote: {
    ...textPresets.caption,
    color: semantic.textTertiary,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
});

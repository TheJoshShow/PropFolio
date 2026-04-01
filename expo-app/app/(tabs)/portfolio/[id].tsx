/**
 * Property Detail — production-ready iPhone-first screen.
 * Hero, score section, key metrics grid, strengths, risks, assumptions, footer.
 * Uses runPropertyDetailAnalysis (simulation + existing engines); loading skeleton; error fallback.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  Pressable,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useSubscription } from '../../../src/contexts/SubscriptionContext';
import { getPropertyById, type PropertyRow } from '../../../src/services/portfolio';
import { getSupabase } from '../../../src/services/supabase';
import { logErrorSafe } from '../../../src/services/diagnostics';
import { recordFlowIssue } from '../../../src/services/monitoring/flowInstrumentation';
import { SCORE_SURFACE_DISCLAIMER, DISCLAIMER_COPY } from '../../../src/lib/propertyAnalysis';
import {
  DEAL_BREAKDOWN_INTRO,
  WHAT_CONFIDENCE_MEANS,
  RECOMMENDED_ACTIONS_FOOTER,
  ACCORDION_HOW_CALCULATED,
  ACCORDION_ESTIMATED_FIELDS,
  ACCORDION_WHY_CAPPED,
} from '../../../src/lib/propertyAnalysis';
import { runPropertyDetailAnalysis } from '../../../src/features/property-analysis';
import { resolveFactorBreakdownState } from '../../../src/features/property-analysis/factorBreakdownState';
import {
  buildAnalysisInputWithWhatIf,
  createInitialWhatIfDraft,
  sanitizeWhatIfDraft,
  type PropertyWhatIfDraft,
} from '../../../src/features/property-analysis/whatIfAssumptions';
import type { PropertyDetailAnalysisResult } from '../../../src/features/property-analysis';
import type { DealScoreBand, DealScoreFactor } from '../../../src/lib/scoring/types';
import type { ConfidenceMeterBand } from '../../../src/lib/confidence/types';
import { Button, Card, TextInput } from '../../../src/components';
import { useThemeColors } from '../../../src/components/useThemeColors';
import { spacing, fontSizes, lineHeights, radius, fontWeights } from '../../../src/theme';
import { responsiveContentContainer } from '../../../src/utils/responsive';
import { parsePortfolioPropertyIdParam } from '../../../src/utils/appNavigation';
import { trackEvent } from '../../../src/services/analytics';
import {
  getPropertyWhatIfOverrides,
  setPropertyWhatIfOverrides,
  clearPropertyWhatIfOverrides,
} from '../../../src/services/propertyWhatIfOverrides';

const MIN_TAP_TARGET = 44;
const FACTOR_BREAKDOWN_PREMIUM_ONLY = false;

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

function safeStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === 'string');
}

function safeDealScoreComponents(
  dealScore: PropertyDetailAnalysisResult['dealScore']
): PropertyDetailAnalysisResult['dealScore']['components'] {
  const raw = dealScore?.components;
  return Array.isArray(raw) ? raw : [];
}

function dealScoreFactorLabel(factor: DealScoreFactor): string {
  switch (factor) {
    case 'capRate': return 'Cap rate';
    case 'monthlyCashFlow': return 'Monthly cash flow';
    case 'annualCashFlow': return 'Annual cash flow';
    case 'cashOnCashReturn': return 'Cash-on-cash return';
    case 'dscr': return 'DSCR';
    case 'expenseRatio': return 'Expense ratio';
    case 'vacancySensitivity': return 'Vacancy sensitivity';
    case 'renovationBurden': return 'Renovation burden';
    case 'purchaseDiscount': return 'Purchase discount';
    case 'rentCoverageStrength': return 'Rent coverage strength';
    case 'dataConfidence': return 'Data confidence';
    case 'marketTailwinds': return 'Market tailwinds';
    case 'downsideResilience': return 'Downside resilience';
    default: return factor;
  }
}

function formatCurrency(n: number | null): string {
  if (n == null) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function formatPercent(n: number | null): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
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

function parseOptionalNumber(raw: string): number | null | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t.replace(/[,$\s]/g, ''));
  if (!Number.isFinite(n)) return null;
  return n;
}

function fullAddress(row: PropertyRow): string {
  const street = [row.street_address, row.unit].filter(Boolean).join(', ');
  const loc = [row.city, row.state, row.postal_code].filter(Boolean).join(', ');
  return [street, loc].filter(Boolean).join('\n');
}

function buildAnalysisFromRow(row: PropertyRow): PropertyDetailAnalysisResult {
  return runPropertyDetailAnalysis({
    listPrice: row.list_price ?? null,
    rent: row.rent ?? null,
    streetAddress: row.street_address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    postalCode: row.postal_code ?? '',
    unitCount: 1,
    bedrooms: row.bedrooms ?? null,
    bathrooms: row.bathrooms ?? null,
    sqft: row.sqft ?? null,
    geocodeStatus: row.geocode_status ?? null,
    geocodeError: row.geocode_error ?? null,
  });
}

// ----- Loading skeleton -----

function SkeletonBlock({
  width = '100%',
  height = 20,
  style,
}: {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  style?: ViewStyle;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        { width, height, backgroundColor: colors.surfaceSecondary, borderRadius: radius.xs },
        style,
      ]}
    />
  );
}

function DetailSkeleton() {
  const colors = useThemeColors();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, responsiveContentContainer]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <SkeletonBlock height={MIN_TAP_TARGET} width={60} style={{ marginBottom: spacing.l }} />
        <SkeletonBlock height={28} width="90%" style={{ marginBottom: spacing.xs }} />
        <SkeletonBlock height={18} width="70%" style={{ marginBottom: spacing.m }} />
        <View style={styles.skeletonBadges}>
          <SkeletonBlock width={80} height={28} />
          <SkeletonBlock width={90} height={28} />
        </View>
        <View style={styles.skeletonCards}>
          <SkeletonBlock width="48%" height={88} />
          <SkeletonBlock width="48%" height={88} />
        </View>
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBlock key={i} height={40} style={{ marginBottom: spacing.xs }} />
          ))}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ----- Main screen -----

export default function PropertyDetailScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rawParams = useLocalSearchParams<{ id?: string | string[] }>();
  const id = parsePortfolioPropertyIdParam(rawParams.id);
  const { session, isLoading: authLoading } = useAuth();
  const { hasProAccess: subscriptionPro, entitlementBootstrapPending } = useSubscription();
  const userId = session?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyRow, setPropertyRow] = useState<PropertyRow | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PropertyDetailAnalysisResult | null>(null);
  const [expandedDealBreakdown, setExpandedDealBreakdown] = useState(false);
  const [expandedConfidenceExplanation, setExpandedConfidenceExplanation] = useState(false);
  const [expandedAccordionId, setExpandedAccordionId] = useState<'how' | 'estimated' | 'capped' | null>(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfDraft, setWhatIfDraft] = useState<PropertyWhatIfDraft | null>(null);
  const [debouncedDraft, setDebouncedDraft] = useState<PropertyWhatIfDraft | null>(null);
  const [whatIfSaveMessage, setWhatIfSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'financials' | 'market' | 'renovation'>('financials');

  const fetchProperty = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('Missing property id');
      return;
    }
    if (!userId) {
      // Avoid showing a misleading auth error while auth is still restoring session.
      if (authLoading) return;
      setLoading(false);
      setError('Please sign in to view this property');
      setPropertyRow(null);
      setAnalysisResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setPropertyRow(null);
    setAnalysisResult(null);
    try {
      // `getPropertyById` handles both Supabase and local/offline storage.
      const row = await getPropertyById(getSupabase(), userId, id);
      if (!row) {
        setError('Property not found');
        recordFlowIssue('nav_property_not_found', { screen: 'portfolio_detail' });
      } else {
        setPropertyRow(row);
        try {
          const analysis = buildAnalysisFromRow(row);
          if (analysis.pipelineError) {
            recordFlowIssue('analysis_detail_pipeline_failed', {
              screen: 'portfolio_detail',
              recoverable: true,
            });
            setError('Could not analyze this property.');
            setAnalysisResult(null);
          } else {
            setAnalysisResult(analysis);
          }
        } catch (e) {
          logErrorSafe('PropertyDetail buildAnalysisFromRow', e);
          recordFlowIssue('analysis_detail_build_threw', { screen: 'portfolio_detail', recoverable: true });
          setError('Could not analyze this property.');
          setAnalysisResult(null);
        }
      }
    } catch (e) {
      logErrorSafe('PropertyDetail fetchProperty', e);
      setError(e instanceof Error ? e.message : 'Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [id, userId, authLoading]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  useEffect(() => {
    if (!propertyRow || !userId) return;
    let cancelled = false;
    (async () => {
      const saved = await getPropertyWhatIfOverrides(
        userId,
        propertyRow.id,
        propertyRow.updated_at ?? propertyRow.fetched_at ?? null
      );
      if (cancelled) return;
      const initial = saved ?? createInitialWhatIfDraft(propertyRow);
      const sanitized = sanitizeWhatIfDraft(initial);
      setWhatIfDraft(sanitized);
      setDebouncedDraft(sanitized);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyRow?.id, userId]);

  useEffect(() => {
    if (!whatIfDraft) return;
    const t = setTimeout(() => setDebouncedDraft(sanitizeWhatIfDraft(whatIfDraft)), 220);
    return () => clearTimeout(t);
  }, [whatIfDraft]);

  const whatIfAnalysis = useMemo(() => {
    if (!propertyRow || !analysisResult || !debouncedDraft) return analysisResult;
    if (!showWhatIf) return analysisResult;
    const baseInput = {
      listPrice: propertyRow.list_price ?? null,
      rent: propertyRow.rent ?? null,
      streetAddress: propertyRow.street_address ?? '',
      city: propertyRow.city ?? '',
      state: propertyRow.state ?? '',
      postalCode: propertyRow.postal_code ?? '',
      unitCount: 1,
      bedrooms: propertyRow.bedrooms ?? null,
      bathrooms: propertyRow.bathrooms ?? null,
      sqft: propertyRow.sqft ?? null,
      geocodeStatus: propertyRow.geocode_status ?? null,
      geocodeError: propertyRow.geocode_error ?? null,
    };

    const whatIf = runPropertyDetailAnalysis(buildAnalysisInputWithWhatIf(baseInput, debouncedDraft));
    if (whatIf.pipelineError) {
      recordFlowIssue('analysis_whatif_pipeline_failed', { screen: 'portfolio_detail', recoverable: true });
      return analysisResult;
    }
    return whatIf;
  }, [
    analysisResult,
    showWhatIf,
    propertyRow,
    debouncedDraft,
  ]);

  const lastUpdated = useMemo(() => {
    if (!propertyRow) return '';
    return formatDate(propertyRow.updated_at ?? propertyRow.fetched_at);
  }, [propertyRow]);

  useEffect(() => {
    if (!id || !analysisResult) return;
    trackEvent('property_detail_viewed', { resourceType: 'property' });
    if (
      analysisResult.confidence.band === 'medium' ||
      analysisResult.confidence.band === 'low' ||
      analysisResult.confidence.band === 'veryLow'
    ) {
      trackEvent('low_confidence_warning_shown', {
        metadata: { confidenceBand: analysisResult.confidence.band },
      });
    }
  }, [id, analysisResult]);

  const topStrengths = useMemo(
    () => (whatIfAnalysis?.strengthFlags ?? []).slice(0, 3),
    [whatIfAnalysis?.strengthFlags]
  );
  const topRisks = useMemo(
    () => (whatIfAnalysis?.riskFlags ?? []).slice(0, 3),
    [whatIfAnalysis?.riskFlags]
  );
  const updateWhatIfField = useCallback(
    (key: keyof PropertyWhatIfDraft, raw: string) => {
      const parsed = parseOptionalNumber(raw);
      setWhatIfSaveMessage(null);
      setWhatIfDraft((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (parsed === undefined) {
          delete (next as Partial<PropertyWhatIfDraft>)[key];
        } else if (parsed !== null) {
          (next as Record<string, unknown>)[key] = parsed;
        }
        return next;
      });
    },
    []
  );
  const resetWhatIfField = useCallback((key: keyof PropertyWhatIfDraft) => {
    setWhatIfSaveMessage(null);
    setWhatIfDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete (next as Partial<PropertyWhatIfDraft>)[key];
      return next;
    });
  }, []);

  const saveWhatIfScenario = useCallback(async () => {
    if (!userId || !propertyRow || !whatIfDraft) return;
    await setPropertyWhatIfOverrides(
      userId,
      propertyRow.id,
      sanitizeWhatIfDraft(whatIfDraft),
      propertyRow.updated_at ?? propertyRow.fetched_at ?? null
    );
    setWhatIfSaveMessage('Scenario saved');
  }, [userId, propertyRow?.id, whatIfDraft]);

  const resetWhatIfAll = useCallback(async () => {
    if (!propertyRow) return;
    const reset = createInitialWhatIfDraft(propertyRow);
    setWhatIfDraft(reset);
    setDebouncedDraft(reset);
    if (userId) await clearPropertyWhatIfOverrides(userId, propertyRow.id);
    setWhatIfSaveMessage('Assumptions reset');
  }, [propertyRow?.id, userId]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error && !whatIfAnalysis) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.errorWrap}>
          <Card style={styles.card} elevated>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load property</Text>
            <Text style={[styles.errorBody, { color: colors.textSecondary }]}>{error}</Text>
            <Button
              title="Back"
              onPress={() => router.back()}
              variant="secondary"
              fullWidth
              accessibilityLabel="Back"
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (!whatIfAnalysis || !propertyRow) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.errorWrap}>
          <Card style={styles.card} elevated>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load property</Text>
            <Text style={[styles.errorBody, { color: colors.textSecondary }]}>
              {error || 'Something went wrong. Try again or go back.'}
            </Text>
            <Button
              title="Back"
              onPress={() => router.back()}
              variant="secondary"
              fullWidth
              accessibilityLabel="Back"
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const a = whatIfAnalysis;
  const m = a.keyMetrics;
  const row = propertyRow;
  const address = fullAddress(row);
  const purchasePrice = a.normalizedInputs.listPrice ?? null;
  const estimatedRent = a.normalizedInputs.rent ?? null;
  const dealScore = a.dealScore;
  const confidence = a.confidence;
  const dealComponents = safeDealScoreComponents(dealScore);
  const missingRequirements = safeStringList(a.missingRequirements);
  const analysisWarnings = safeStringList(a.warnings);
  const recommendedActions = safeStringList(confidence.recommendedActions);
  const confidenceScoreDisplay = Number.isFinite(confidence.score) ? Math.round(confidence.score) : null;
  const subscriptionEntitlementLoading =
    FACTOR_BREAKDOWN_PREMIUM_ONLY && !!session?.id && entitlementBootstrapPending;
  const factorBreakdownState = resolveFactorBreakdownState({
    isLoading: loading,
    isPremiumOnly: FACTOR_BREAKDOWN_PREMIUM_ONLY,
    componentCount: dealComponents.length,
    subscriptionEntitlementLoading,
    hasProAccess: subscriptionPro,
  });
  const unavailableBreakdownReason =
    missingRequirements.length > 0
      ? `Not enough data yet: ${missingRequirements.join(', ')}`
      : 'Factor details are not available yet. Analysis may still be processing.';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: styles.content.paddingBottom + insets.bottom },
            responsiveContentContainer,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={[styles.backText, { color: colors.primary }]} allowFontScaling>← Back</Text>
        </Pressable>

        {/* Hero */}
        <Text style={[styles.heroAddress, { color: colors.text }]} allowFontScaling>
          {address || 'No address'}
        </Text>
        <Text style={[styles.heroSummary, { color: colors.textSecondary }]} numberOfLines={2} allowFontScaling>
          {dealScore.explanationSummary || 'Insufficient data'}
        </Text>
        <View style={styles.heroBadges}>
          <View style={[styles.badgePill, { backgroundColor: colors.primaryMuted }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]} allowFontScaling>
              Deal {dealScore.totalScore != null ? Math.round(dealScore.totalScore) : '—'}/100
            </Text>
          </View>
          <View style={[styles.badgePill, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.badgeText, { color: colors.text }]} allowFontScaling>
              {confidenceBandLabel(confidence.band)} confidence
            </Text>
          </View>
        </View>

        {/* Score section */}
        <View style={styles.scoreRow}>
          <Card style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.scoreValue, { color: colors.text }]} allowFontScaling>
              {dealScore.totalScore != null ? Math.round(dealScore.totalScore) : '—'}
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]} allowFontScaling>
              {dealBandLabel(dealScore.band)}
            </Text>
          </Card>
          <Card style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.scoreValue, { color: colors.text }]} allowFontScaling>
              {confidenceScoreDisplay != null ? confidenceScoreDisplay : '—'}
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]} allowFontScaling>
              {confidenceBandLabel(confidence.band)}
            </Text>
          </Card>
        </View>
        {dealScore.wasCappedByConfidence ? (
          <Text style={[styles.capNote, { color: colors.warning }]} allowFontScaling>
            Score capped by low data confidence.
          </Text>
        ) : null}
        <Text style={[styles.scoreDisclaimer, { color: colors.textMuted }]} allowFontScaling>
          {SCORE_SURFACE_DISCLAIMER}
        </Text>

        {/* Deal score summary */}
        <Text style={[styles.dealSummaryLine, { color: colors.textSecondary }]} allowFontScaling>
          {dealScore.explanationSummary || 'Insufficient data'}
        </Text>
        {missingRequirements.length > 0 && (
          <Text style={[styles.dealSummaryLine, { color: colors.warning }]} allowFontScaling>
            Missing to score: {missingRequirements.join(', ')}
          </Text>
        )}
        {analysisWarnings.length > 0 && (
          <Card style={styles.card}>
            {analysisWarnings.slice(0, 3).map((w, i) => (
              <Text key={`${i}-${w}`} style={[styles.factorDesc, { color: colors.textSecondary }]} allowFontScaling>
                • {w}
              </Text>
            ))}
          </Card>
        )}

        {/* Expandable factor breakdown (available to all users). */}
        <Pressable
          onPress={() => {
            if (factorBreakdownState === 'loading') return;
            setExpandedDealBreakdown((v) => {
              if (!v) trackEvent('score_explanation_opened', {});
              return !v;
            });
          }}
          style={({ pressed }) => [styles.factorBreakdownHeader, pressed && { opacity: 0.8 }]}
          accessibilityLabel={expandedDealBreakdown ? 'Collapse factor breakdown' : 'Expand factor breakdown'}
          accessibilityRole="button"
        >
          <Text style={[styles.factorBreakdownTitle, { color: colors.text }]} allowFontScaling>
            Factor breakdown
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]} allowFontScaling>
            {expandedDealBreakdown ? '▲' : '▼'}
          </Text>
        </Pressable>
        {expandedDealBreakdown && (
          <View style={styles.factorBreakdownContent}>
            {factorBreakdownState === 'available' ? (
              <>
                <Text style={[styles.factorBreakdownIntro, { color: colors.textMuted }]} allowFontScaling>
                  {DEAL_BREAKDOWN_INTRO}
                </Text>
                {dealComponents.map((c, idx) => {
                  if (!c || typeof c.id !== 'string') return null;
                  const label = dealScoreFactorLabel(c.id as DealScoreFactor);
                  const subLabel = Number.isFinite(c.subScore) ? Math.round(c.subScore) : '—';
                  const weightLabel = Number.isFinite(c.weight) ? `${(c.weight * 100).toFixed(0)}%` : '—';
                  return (
                    <View key={c.id || `deal-factor-${idx}`} style={styles.factorBreakdownItem}>
                      <Text style={[styles.factorBreakdownItemLabel, { color: colors.text }]} allowFontScaling>
                        {label}{c.rawValue ? ` — ${c.rawValue}` : ''}
                      </Text>
                      <Text style={[styles.factorBreakdownItemText, { color: colors.textSecondary }]} allowFontScaling>
                        Sub-score {subLabel}/100 • Weight {weightLabel}
                      </Text>
                    </View>
                  );
                })}
              </>
            ) : factorBreakdownState === 'premium_only' ? (
              <Text style={[styles.factorBreakdownIntro, { color: colors.textSecondary }]} allowFontScaling>
                Factor breakdown is currently a Pro-only feature.
              </Text>
            ) : factorBreakdownState === 'loading' ? (
              <Text style={[styles.factorBreakdownIntro, { color: colors.textSecondary }]} allowFontScaling>
                Factor breakdown is loading...
              </Text>
            ) : (
              <Text style={[styles.factorBreakdownIntro, { color: colors.textSecondary }]} allowFontScaling>
                {unavailableBreakdownReason}
              </Text>
            )}
          </View>
        )}

        {/* Confidence explained (expandable); track when opened */}
        <View style={styles.confidenceBlock}>
          <Pressable
            onPress={() => {
              setExpandedConfidenceExplanation((v) => {
                if (!v) trackEvent('confidence_explanation_opened', {});
                return !v;
              });
            }}
            style={({ pressed }) => [styles.factorBreakdownHeader, pressed && { opacity: 0.8 }]}
            accessibilityLabel={expandedConfidenceExplanation ? 'Collapse confidence explanation' : 'Expand confidence explanation'}
            accessibilityRole="button"
          >
            <Text style={[styles.factorBreakdownTitle, { color: colors.text }]} allowFontScaling>
              Confidence explained
            </Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]} allowFontScaling>
              {expandedConfidenceExplanation ? '▲' : '▼'}
            </Text>
          </Pressable>
          {expandedConfidenceExplanation && (
            <>
              <Text style={[styles.confidenceBlockTitle, { color: colors.text }]} allowFontScaling>
                What confidence means
              </Text>
              <Text style={[styles.confidenceParagraph, { color: colors.textSecondary }]} allowFontScaling>
                {WHAT_CONFIDENCE_MEANS}
              </Text>
              {(confidence.band === 'medium' || confidence.band === 'low' || confidence.band === 'veryLow') && (
                <>
                  <Text style={[styles.recommendedTitle, { color: colors.text }]} allowFontScaling>
                    Recommended next steps
                  </Text>
                  {recommendedActions.map((step, i) => (
                    <View key={i} style={styles.recommendedItem}>
                      <Text style={[styles.recommendedBullet, { color: colors.primary }]}>•</Text>
                      <Text style={[styles.recommendedText, { color: colors.textSecondary }]} allowFontScaling>
                        {step}
                      </Text>
                    </View>
                  ))}
                  <Text style={[styles.recommendedFooter, { color: colors.textMuted }]} allowFontScaling>
                    {RECOMMENDED_ACTIONS_FOOTER}
                  </Text>
                </>
              )}
            </>
          )}
        </View>

        {/* Segmented tabs for detail sections */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setActiveTab('financials')}
            style={({ pressed }) => [
              styles.tabPill,
              activeTab === 'financials' && styles.tabPillActive,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'financials' ? colors.onPrimary : colors.textSecondary },
              ]}
              allowFontScaling
            >
              Financials
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('market')}
            style={({ pressed }) => [
              styles.tabPill,
              activeTab === 'market' && styles.tabPillActive,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'market' ? colors.onPrimary : colors.textSecondary },
              ]}
              allowFontScaling
            >
              Market Data
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('renovation')}
            style={({ pressed }) => [
              styles.tabPill,
              activeTab === 'renovation' && styles.tabPillActive,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === 'renovation' ? colors.onPrimary : colors.textSecondary },
              ]}
              allowFontScaling
            >
              Renovation
            </Text>
          </Pressable>
        </View>

        {/* Financials tab content: What If + key metrics */}
        {activeTab === 'financials' && (
          <>
            {/* What If assumptions: editable inputs with live recalculation */}
            <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>
              What If
            </Text>
            <Card style={styles.card}>
              <Pressable
                onPress={() => setShowWhatIf((v) => !v)}
                style={({ pressed }) => [styles.factorBreakdownHeader, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel={
                  showWhatIf ? 'Collapse What If assumptions' : 'Expand What If assumptions'
                }
              >
                <Text style={[styles.factorBreakdownTitle, { color: colors.text }]} allowFontScaling>
                  Edit assumptions and recalculate
                </Text>
                <Text style={[styles.chevron, { color: colors.textSecondary }]} allowFontScaling>
                  {showWhatIf ? '▲' : '▼'}
                </Text>
              </Pressable>
              {showWhatIf && (
                <View style={styles.whatIfGrid}>
                  <Text style={[styles.factorDesc, { color: colors.textMuted }]} allowFontScaling>
                    Imported values are prefilled. Edited fields become user overrides.
                  </Text>
                  <TextInput
                    label="Purchase price (USD)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.listPrice != null ? String(Math.round(whatIfDraft.listPrice)) : ''
                    }
                    onChangeText={(v) => updateWhatIfField('listPrice', v)}
                  />
                  <Button
                    title="Reset purchase price"
                    onPress={() => resetWhatIfField('listPrice')}
                    variant="secondary"
                    fullWidth
                    pill={false}
                  />
                  <TextInput
                    label="Monthly rent (USD)"
                    keyboardType="numeric"
                    value={whatIfDraft?.rent != null ? String(Math.round(whatIfDraft.rent)) : ''}
                    onChangeText={(v) => updateWhatIfField('rent', v)}
                  />
                  <Button
                    title="Reset rent"
                    onPress={() => resetWhatIfField('rent')}
                    variant="secondary"
                    fullWidth
                    pill={false}
                  />
                  <TextInput
                    label="Down payment (%)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.downPaymentPercent != null
                        ? String(whatIfDraft.downPaymentPercent)
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('downPaymentPercent', v)}
                  />
                  <TextInput
                    label="Interest rate (%)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.interestRatePercent != null
                        ? String(whatIfDraft.interestRatePercent)
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('interestRatePercent', v)}
                  />
                  <TextInput
                    label="Loan term (years)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.amortizationTermYears != null
                        ? String(whatIfDraft.amortizationTermYears)
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('amortizationTermYears', v)}
                  />
                  <TextInput
                    label="Vacancy (%)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.vacancyRatePercent != null
                        ? String(whatIfDraft.vacancyRatePercent)
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('vacancyRatePercent', v)}
                  />
                  <TextInput
                    label="Operating expense ratio (%)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.operatingExpenseRatioPercent != null
                        ? String(whatIfDraft.operatingExpenseRatioPercent)
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('operatingExpenseRatioPercent', v)}
                  />
                  <TextInput
                    label="Operating expenses (annual USD)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.operatingExpensesAnnual != null
                        ? String(Math.round(whatIfDraft.operatingExpensesAnnual))
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('operatingExpensesAnnual', v)}
                  />
                  <TextInput
                    label="Taxes (annual USD)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.taxesAnnual != null
                        ? String(Math.round(whatIfDraft.taxesAnnual))
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('taxesAnnual', v)}
                  />
                  <TextInput
                    label="Insurance (annual USD)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.insuranceAnnual != null
                        ? String(Math.round(whatIfDraft.insuranceAnnual))
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('insuranceAnnual', v)}
                  />
                  <TextInput
                    label="Closing costs (USD)"
                    keyboardType="numeric"
                    value={
                      whatIfDraft?.closingCosts != null
                        ? String(Math.round(whatIfDraft.closingCosts))
                        : ''
                    }
                    onChangeText={(v) => updateWhatIfField('closingCosts', v)}
                  />
                  <Button
                    title={whatIfDraft?.useOverrides ? 'Use imported defaults' : 'Use What If overrides'}
                    onPress={() =>
                      setWhatIfDraft((prev) =>
                        prev ? { ...prev, useOverrides: !prev.useOverrides } : prev,
                      )
                    }
                    variant="secondary"
                    fullWidth
                    pill={false}
                  />
                  <Button
                    title="Save scenario"
                    onPress={() => void saveWhatIfScenario()}
                    fullWidth
                    pill={false}
                  />
                  <Button
                    title="Reset assumptions"
                    onPress={() => void resetWhatIfAll()}
                    variant="secondary"
                    fullWidth
                    pill={false}
                  />
                  {whatIfSaveMessage ? (
                    <Text style={[styles.factorDesc, { color: colors.success }]} allowFontScaling>
                      {whatIfSaveMessage}
                    </Text>
                  ) : null}
                </View>
              )}
            </Card>

            {/* Key metrics grid */}
            <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>
              Key metrics
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]} allowFontScaling>
                  Purchase price
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
                  {formatCurrency(purchasePrice)}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]} allowFontScaling>
                  Est. rent
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
                  {formatCurrency(estimatedRent)}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]} allowFontScaling>
                  Monthly cash flow
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
                  {formatCurrency(m.monthlyCashFlow)}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]} allowFontScaling>
                  Cap rate
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
                  {formatPercent(m.capRate)}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]} allowFontScaling>
                  Cash-on-cash
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
                  {formatPercent(m.cashOnCashReturn)}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]} allowFontScaling>
                  DSCR
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]} allowFontScaling>
                  {m.dscr != null ? `${m.dscr.toFixed(2)}×` : '—'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Market tab content: strengths, risks, assumptions */}
        {activeTab === 'market' && (
          <>
            {/* Strengths */}
            {topStrengths.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>
                  Strengths
                </Text>
                <Card style={styles.card}>
                  {topStrengths.map((s) => (
                    <View key={s.id} style={styles.factorRow}>
                      <Text style={[styles.factorBullet, { color: colors.success }]}>•</Text>
                      <View style={styles.factorContent}>
                        <Text style={[styles.factorLabel, { color: colors.text }]} allowFontScaling>
                          {s.label}
                        </Text>
                        {s.description ? (
                          <Text
                            style={[styles.factorDesc, { color: colors.textSecondary }]}
                            allowFontScaling
                          >
                            {s.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Risks / watch items */}
            {topRisks.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>
                  Risks & watch items
                </Text>
                <Card style={styles.card}>
                  {topRisks.map((r) => (
                    <View key={r.id} style={styles.factorRow}>
                      <Text
                        style={[
                          styles.factorBullet,
                          { color: r.severity === 'high' ? colors.error : colors.warning },
                        ]}
                      >
                        •
                      </Text>
                      <View style={styles.factorContent}>
                        <Text style={[styles.factorLabel, { color: colors.text }]} allowFontScaling>
                          {r.label}
                        </Text>
                        {r.description ? (
                          <Text
                            style={[styles.factorDesc, { color: colors.textSecondary }]}
                            allowFontScaling
                          >
                            {r.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Assumptions */}
            {a.assumptions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>
                  Assumptions
                </Text>
                <Card style={styles.card}>
                  {a.assumptions.map((x) => (
                    <View key={x.id} style={styles.assumptionRow}>
                      <Text style={[styles.assumptionLabel, { color: colors.text }]} allowFontScaling>
                        {x.label}
                      </Text>
                      <View style={styles.assumptionRight}>
                        <Text
                          style={[styles.assumptionValue, { color: colors.textSecondary }]}
                          allowFontScaling
                        >
                          {x.value}
                        </Text>
                        {(x.source === 'default' || x.source === 'inferred') && (
                          <Text
                            style={[styles.assumptionSource, { color: colors.textMuted }]}
                            allowFontScaling
                          >
                            {x.source === 'inferred' ? ' (estimated)' : ' (default)'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}
          </>
        )}

        {/* Renovation tab content: simple explanatory panel */}
        {activeTab === 'renovation' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>
              Renovation impact
            </Text>
            <Card style={styles.card}>
              <Text style={[styles.factorDesc, { color: colors.textSecondary }]} allowFontScaling>
                Renovation scenarios are evaluated using the same deterministic engine that powers your
                deal score and cash flow metrics. Use the What If controls under the Financials tab to
                explore different renovation budgets, rent changes, and timelines without relying on AI
                for any calculations.
              </Text>
            </Card>
          </>
        )}

        {/* Explanation accordion */}
        <Text style={[styles.sectionTitle, { color: colors.text }]} allowFontScaling>About these scores</Text>
        <View style={styles.accordion}>
          <View style={styles.accordionItem}>
            <Pressable
              onPress={() => setExpandedAccordionId((prev) => (prev === 'how' ? null : 'how'))}
              style={({ pressed }) => [styles.accordionHeader, pressed && { opacity: 0.8 }]}
              accessibilityLabel={expandedAccordionId === 'how' ? 'Collapse how the score is calculated' : 'Expand how the score is calculated'}
              accessibilityRole="button"
            >
              <Text style={[styles.accordionHeaderText, { color: colors.text }]} allowFontScaling>
                How the score is calculated
              </Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]} allowFontScaling>
                {expandedAccordionId === 'how' ? '▲' : '▼'}
              </Text>
            </Pressable>
            {expandedAccordionId === 'how' && (
              <Text style={[styles.accordionBody, { color: colors.textSecondary }]} allowFontScaling>
                {ACCORDION_HOW_CALCULATED}
              </Text>
            )}
          </View>
          <View style={styles.accordionItem}>
            <Pressable
              onPress={() => setExpandedAccordionId((prev) => (prev === 'estimated' ? null : 'estimated'))}
              style={({ pressed }) => [styles.accordionHeader, pressed && { opacity: 0.8 }]}
              accessibilityLabel={expandedAccordionId === 'estimated' ? 'Collapse which fields are estimated' : 'Expand which fields are estimated'}
              accessibilityRole="button"
            >
              <Text style={[styles.accordionHeaderText, { color: colors.text }]} allowFontScaling>
                Which fields are estimated
              </Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]} allowFontScaling>
                {expandedAccordionId === 'estimated' ? '▲' : '▼'}
              </Text>
            </Pressable>
            {expandedAccordionId === 'estimated' && (
              <Text style={[styles.accordionBody, { color: colors.textSecondary }]} allowFontScaling>
                {ACCORDION_ESTIMATED_FIELDS}
              </Text>
            )}
          </View>
          <View style={styles.accordionItem}>
            <Pressable
              onPress={() => setExpandedAccordionId((prev) => (prev === 'capped' ? null : 'capped'))}
              style={({ pressed }) => [styles.accordionHeader, pressed && { opacity: 0.8 }]}
              accessibilityLabel={expandedAccordionId === 'capped' ? 'Collapse why the score may be capped' : 'Expand why the score may be capped'}
              accessibilityRole="button"
            >
              <Text style={[styles.accordionHeaderText, { color: colors.text }]} allowFontScaling>
                Why the score may be capped
              </Text>
              <Text style={[styles.chevron, { color: colors.textSecondary }]} allowFontScaling>
                {expandedAccordionId === 'capped' ? '▲' : '▼'}
              </Text>
            </Pressable>
            {expandedAccordionId === 'capped' && (
              <Text style={[styles.accordionBody, { color: colors.textSecondary }]} allowFontScaling>
                {ACCORDION_WHY_CAPPED}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerDisclaimer, { color: colors.textMuted }]} allowFontScaling>
            {DISCLAIMER_COPY}
          </Text>
          {lastUpdated ? (
            <Text style={[styles.footerUpdated, { color: colors.textMuted }]} allowFontScaling>
              Last updated {lastUpdated}
            </Text>
          ) : null}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  backButton: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    marginBottom: spacing.l,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingRight: spacing.s,
  },
  backText: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold },
  heroAddress: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.title,
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  heroSummary: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.base,
    marginBottom: spacing.m,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.xl,
  },
  badgePill: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  scoreCard: {
    flex: 1,
    padding: spacing.l,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  scoreValue: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, marginBottom: spacing.xxs },
  scoreLabel: { fontSize: fontSizes.sm },
  capNote: { fontSize: fontSizes.sm, marginBottom: spacing.xs },
  scoreDisclaimer: { fontSize: fontSizes.xs, marginBottom: spacing.m },
  dealSummaryLine: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginBottom: spacing.m,
  },
  factorBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TAP_TARGET,
    paddingVertical: spacing.s,
    marginBottom: spacing.xs,
  },
  factorBreakdownTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, flex: 1 },
  chevron: { fontSize: fontSizes.sm, marginLeft: spacing.s },
  factorBreakdownContent: { marginBottom: spacing.xl, paddingLeft: 0 },
  factorBreakdownIntro: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginBottom: spacing.m,
  },
  factorBreakdownItem: { marginBottom: spacing.m },
  factorBreakdownItemLabel: { fontSize: fontSizes.base, fontWeight: fontWeights.medium, marginBottom: spacing.xxs },
  factorBreakdownItemText: { fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
  whatIfGrid: { marginTop: spacing.xs },
  confidenceBlock: { marginBottom: spacing.xl },
  confidenceBlockTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, marginBottom: spacing.xs },
  confidenceParagraph: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginBottom: spacing.m,
  },
  recommendedTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, marginBottom: spacing.xs },
  recommendedItem: { flexDirection: 'row', marginBottom: spacing.xs },
  recommendedBullet: { marginRight: spacing.xs, fontSize: fontSizes.base },
  recommendedText: { flex: 1, fontSize: fontSizes.sm, lineHeight: lineHeights.sm },
  recommendedFooter: {
    fontSize: fontSizes.xs,
    fontStyle: 'italic',
    marginTop: spacing.s,
  },
  accordion: { marginBottom: spacing.xl },
  accordionItem: { marginBottom: spacing.s },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TAP_TARGET,
    paddingVertical: spacing.s,
    paddingRight: spacing.xs,
  },
  accordionHeaderText: { fontSize: fontSizes.base, fontWeight: fontWeights.medium, flex: 1 },
  accordionBody: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    paddingLeft: 0,
    paddingBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: spacing.xxxs,
    marginTop: spacing.l,
    marginBottom: spacing.m,
    backgroundColor: '#00000020',
  },
  tabPill: {
    flex: 1,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#ffffff30',
  },
  tabLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xl,
  },
  metricCell: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.s,
    paddingRight: spacing.m,
  },
  metricLabel: { fontSize: fontSizes.xs, marginBottom: spacing.xxs },
  metricValue: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, flexShrink: 1 },
  card: { marginBottom: spacing.l },
  factorRow: { flexDirection: 'row', marginBottom: spacing.s },
  factorBullet: { marginRight: spacing.xs, fontSize: fontSizes.lg },
  factorContent: { flex: 1 },
  factorLabel: { fontSize: fontSizes.base, fontWeight: fontWeights.medium },
  factorDesc: { fontSize: fontSizes.sm, marginTop: spacing.xxs },
  assumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  assumptionLabel: { fontSize: fontSizes.base, flex: 1, paddingRight: spacing.s },
  assumptionRight: { flex: 1, alignItems: 'flex-end' },
  assumptionValue: { fontSize: fontSizes.base },
  assumptionSource: { fontSize: fontSizes.xs, fontStyle: 'italic', marginTop: spacing.xxs },
  footer: { marginTop: spacing.l, paddingTop: spacing.l },
  footerDisclaimer: { fontSize: fontSizes.sm, lineHeight: lineHeights.sm, fontStyle: 'italic', marginBottom: spacing.s },
  footerUpdated: { fontSize: fontSizes.xs },
  errorWrap: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  errorTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, marginBottom: spacing.xs },
  errorBody: { fontSize: fontSizes.base, marginBottom: spacing.m },
  skeletonBadges: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.xl },
  skeletonCards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.l },
  skeletonGrid: { marginBottom: spacing.xl },
});

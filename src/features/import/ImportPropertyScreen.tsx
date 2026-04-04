import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  AuthBootView,
  Card,
  Screen,
} from '@/components/ui';
import { useAuth } from '@/features/auth';
import { ImportCreditNotice } from '@/features/billing';
import { useImportGate, useSubscription } from '@/features/subscription';
import type { InvestmentStrategy } from '@/lib/investmentStrategy';
import { investmentStrategyLabel } from '@/lib/investmentStrategy';
import { generateUuid } from '@/lib/uuid';
import { propertyImportService } from '@/services/property-import';
import type { PropertyImportResult, ResolvedPlaceDto } from '@/services/property-import';
import { sanitizePastedUrl, isNonEmptyUrl } from '@/services/import/sanitize';
import { tryGetSupabaseClient } from '@/services/supabase';
import { hitSlop, iconSizes, radius, semantic, spacing, textPresets } from '@/theme';

type Step = 'method' | 'strategy' | 'input';
type ImportKind = 'listing' | 'manual';

function isNeedsAddress(r: PropertyImportResult): r is Extract<PropertyImportResult, { code: 'NEEDS_ADDRESS' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'NEEDS_ADDRESS'
  );
}

function isSuccess(r: PropertyImportResult): r is Extract<PropertyImportResult, { ok: true }> {
  return r != null && typeof r === 'object' && 'ok' in r && (r as { ok: boolean }).ok === true;
}

function isInsufficientCredits(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'INSUFFICIENT_CREDITS' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'INSUFFICIENT_CREDITS'
  );
}

function isSubscriptionRequired(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'SUBSCRIPTION_REQUIRED' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'SUBSCRIPTION_REQUIRED'
  );
}

function isCreditConsumeFailed(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'CREDIT_CONSUME_FAILED' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'CREDIT_CONSUME_FAILED'
  );
}

export function ImportPropertyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isReady, isSignedIn, needsEmailVerification } = useAuth();
  const sub = useSubscription();
  const { ensureCanImport } = useImportGate();

  const sessionTokenRef = useRef(generateUuid());
  const correlationIdRef = useRef(generateUuid());

  const [step, setStep] = useState<Step>('method');
  const [importKind, setImportKind] = useState<ImportKind | null>(null);
  const [strategy, setStrategy] = useState<InvestmentStrategy | null>(null);

  const [linkUrl, setLinkUrl] = useState('');
  const [pendingListingUrl, setPendingListingUrl] = useState<string | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [predictions, setPredictions] = useState<{ placeId: string; text: string }[]>([]);
  const [selected, setSelected] = useState<ResolvedPlaceDto | null>(null);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configured = Boolean(tryGetSupabaseClient());

  useFocusEffect(
    useCallback(() => {
      void sub.refresh();
    }, [sub]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Import Property',
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={hitSlop}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={iconSizes.xl} color={semantic.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const runAutocomplete = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setPredictions([]);
        return;
      }
      setSearching(true);
      setError(null);
      try {
        const res = await propertyImportService.placesAutocomplete(
          q,
          sessionTokenRef.current,
          correlationIdRef.current,
        );
        setPredictions(res.predictions ?? []);
      } catch (e) {
        setPredictions([]);
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (step !== 'input' || importKind !== 'manual') {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void runAutocomplete(addressQuery);
    }, 320);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [addressQuery, step, importKind, runAutocomplete]);

  const selectPrediction = useCallback(
    async (placeId: string) => {
      setError(null);
      setSearching(true);
      try {
        const res = await propertyImportService.placesResolve(placeId, correlationIdRef.current);
        setSelected({
          placeId: res.placeId,
          formattedAddress: res.formattedAddress,
          latitude: res.latitude,
          longitude: res.longitude,
        });
        setPredictions([]);
        setAddressQuery(res.formattedAddress);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not resolve address');
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  const finishImport = useCallback(
    async (result: PropertyImportResult) => {
      if (isNeedsAddress(result)) {
        setPendingListingUrl(sanitizePastedUrl(linkUrl));
        setImportKind('manual');
        setStep('input');
        setBanner('Confirm the property address to complete this listing import.');
        return;
      }
      if (isInsufficientCredits(result)) {
        await sub.refresh();
        throw new Error(
          result.message ??
            'Not enough credits. Buy a pack from Settings or wait for your monthly included credit.',
        );
      }
      if (isSubscriptionRequired(result)) {
        await sub.refresh();
        throw new Error(
          result.message ??
            'You need an active PropFolio membership to import. Open Membership from Settings.',
        );
      }
      if (isCreditConsumeFailed(result)) {
        await sub.refresh();
        throw new Error(result.message ?? 'Could not confirm your credit with the server. Try again.');
      }
      if (isSuccess(result)) {
        await sub.refresh();
        router.replace(`/property/${result.propertyId}`);
        return;
      }
      if (result && typeof result === 'object' && 'error' in result) {
        const err = (result as { error?: string }).error;
        if (typeof err === 'string' && err.length) {
          throw new Error(err);
        }
      }
      throw new Error('Import could not be completed.');
    },
    [linkUrl, router, sub],
  );

  const requireStrategy = useCallback((): InvestmentStrategy => {
    if (!strategy) {
      throw new Error('Choose an investment strategy to continue.');
    }
    return strategy;
  }, [strategy]);

  const onImportLink = useCallback(async () => {
    let s: InvestmentStrategy;
    try {
      s = requireStrategy();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Choose a strategy');
      return;
    }
    const url = sanitizePastedUrl(linkUrl);
    if (!isNonEmptyUrl(url)) {
      setError('Paste a Zillow or Redfin listing link.');
      return;
    }
    if (!(await ensureCanImport())) {
      setError('You need 1 import credit. Open Buy credits or Membership from Settings.');
      return;
    }
    setError(null);
    setBanner(null);
    setImporting(true);
    try {
      const result = await propertyImportService.importFromListingUrl(
        url,
        null,
        s,
        correlationIdRef.current,
      );
      await finishImport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [linkUrl, finishImport, ensureCanImport, requireStrategy]);

  const onImportAddress = useCallback(async () => {
    let s: InvestmentStrategy;
    try {
      s = requireStrategy();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Choose a strategy');
      return;
    }
    if (!selected?.placeId) {
      setError('Select an address from the suggestions.');
      return;
    }
    if (!(await ensureCanImport())) {
      setError('You need 1 import credit. Open Buy credits or Membership from Settings.');
      return;
    }
    setError(null);
    setImporting(true);
    try {
      let result: PropertyImportResult;
      if (pendingListingUrl) {
        result = await propertyImportService.importFromListingUrl(
          pendingListingUrl,
          selected,
          s,
          correlationIdRef.current,
        );
        setPendingListingUrl(null);
        setBanner(null);
      } else {
        result = await propertyImportService.importFromManualPlace(
          selected,
          s,
          correlationIdRef.current,
        );
      }
      await finishImport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [selected, pendingListingUrl, finishImport, ensureCanImport, requireStrategy]);

  const linkDisabled = useMemo(
    () =>
      !configured ||
      !isNonEmptyUrl(sanitizePastedUrl(linkUrl)) ||
      importing ||
      sub.creditsLoading ||
      sub.creditBalance < 1,
    [configured, linkUrl, importing, sub.creditsLoading, sub.creditBalance],
  );

  const addressDisabled = useMemo(
    () =>
      !configured || !selected || importing || sub.creditsLoading || sub.creditBalance < 1,
    [configured, selected, importing, sub.creditsLoading, sub.creditBalance],
  );

  const goListingPath = useCallback(() => {
    setError(null);
    setImportKind('listing');
    setStep('strategy');
    setStrategy(null);
  }, []);

  const goManualPath = useCallback(() => {
    setError(null);
    setImportKind('manual');
    setStep('strategy');
    setStrategy(null);
  }, []);

  const chooseStrategyAndContinue = useCallback((next: InvestmentStrategy) => {
    setError(null);
    setStrategy(next);
    setStep('input');
  }, []);

  const backToMethod = useCallback(() => {
    setStep('method');
    setImportKind(null);
    setStrategy(null);
    setError(null);
    setBanner(null);
  }, []);

  const backToStrategy = useCallback(() => {
    setStep('strategy');
    setStrategy(null);
    setError(null);
  }, []);

  const backFromManualInput = useCallback(() => {
    if (pendingListingUrl) {
      setPendingListingUrl(null);
      setBanner(null);
      setImportKind('listing');
      setStep('input');
      setSelected(null);
      setAddressQuery('');
      setPredictions([]);
      setError(null);
      return;
    }
    setStep('strategy');
    setStrategy(null);
    setError(null);
  }, [pendingListingUrl]);

  if (!isReady) {
    return <AuthBootView testID="propfolio.import.boot" />;
  }

  if (!isSignedIn || needsEmailVerification) {
    return <Redirect href="/" />;
  }

  if (!sub.accessHydrated) {
    return <AuthBootView testID="propfolio.import.subscriptionBoot" />;
  }

  if (!sub.hasAppAccess) {
    return <Redirect href="/access-restricted" />;
  }

  return (
    <Screen
      scroll={false}
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.flex}
      testID="propfolio.import.screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!configured ? (
            <Text style={styles.warn}>Add Supabase credentials to import properties.</Text>
          ) : null}

          {step === 'method' ? (
            <>
              <Text style={styles.helper}>
                Add a property from a listing link or by address. Data is enriched on our servers — your keys stay
                private.
              </Text>
              <View style={styles.optionStack}>
                <Card
                  elevation="sm"
                  shape="sheet"
                  onPress={goListingPath}
                  style={styles.optionCard}
                  testID="propfolio.import.method.zillow"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="home-outline" size={iconSizes.xl + 4} color={semantic.navy} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Import from Zillow</Text>
                    <Text style={styles.optionSub}>Paste a listing URL (Zillow or Redfin supported)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
                </Card>
                <Card
                  elevation="sm"
                  shape="sheet"
                  onPress={goManualPath}
                  style={styles.optionCard}
                  testID="propfolio.import.method.manual"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="location-outline" size={iconSizes.xl + 4} color={semantic.navy} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Enter Address Manually</Text>
                    <Text style={styles.optionSub}>Search and select the property location</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
                </Card>
              </View>
            </>
          ) : null}

          {step === 'strategy' ? (
            <>
              <Text style={styles.helper}>
                Choose how you plan to invest. This drives which financial lens we use on the analysis screen. You
                must pick one before import can finish.
              </Text>
              <View style={styles.optionStack}>
                <Card
                  elevation="sm"
                  shape="sheet"
                  onPress={() => chooseStrategyAndContinue('buy_hold')}
                  style={styles.optionCard}
                  testID="propfolio.import.strategy.buy_hold"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="trending-up-outline" size={iconSizes.xl + 4} color={semantic.navy} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Buy &amp; Hold</Text>
                    <Text style={styles.optionSub}>Long-term rent and cash flow focus</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
                </Card>
                <Card
                  elevation="sm"
                  shape="sheet"
                  onPress={() => chooseStrategyAndContinue('fix_flip')}
                  style={styles.optionCard}
                  testID="propfolio.import.strategy.fix_flip"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="hammer-outline" size={iconSizes.xl + 4} color={semantic.navy} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Fix &amp; Flip</Text>
                    <Text style={styles.optionSub}>Renovation and resale / ARV focus</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
                </Card>
              </View>
              <AppButton label="Back" variant="secondary" onPress={backToMethod} testID="propfolio.import.strategy.back" />
            </>
          ) : null}

          {step === 'input' && importKind === 'listing' ? (
            <View style={styles.inputBlock}>
              <ImportCreditNotice />
              {banner ? <Text style={styles.banner}>{banner}</Text> : null}
              {error ? <Text style={styles.err}>{error}</Text> : null}
              <Text style={styles.strategyPill}>
                Strategy: {strategy ? investmentStrategyLabel(strategy) : '—'}
              </Text>
              <Text style={styles.fieldLabel}>Zillow or Redfin URL</Text>
              <TextInput
                style={styles.linkInput}
                placeholder="https://www.zillow.com/homedetails/…"
                placeholderTextColor={semantic.placeholder}
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.hint}>Tracking parameters are stripped automatically.</Text>
              <AppButton
                label={importing ? 'Importing…' : 'Import listing'}
                onPress={onImportLink}
                disabled={linkDisabled}
                loading={importing}
                testID="propfolio.import.submit.link"
              />
              <AppButton label="Back" variant="secondary" onPress={backToStrategy} />
            </View>
          ) : null}

          {step === 'input' && importKind === 'manual' ? (
            <View style={styles.inputBlock}>
              <ImportCreditNotice />
              {banner ? <Text style={styles.banner}>{banner}</Text> : null}
              {error ? <Text style={styles.err}>{error}</Text> : null}
              <Text style={styles.strategyPill}>
                Strategy: {strategy ? investmentStrategyLabel(strategy) : '—'}
              </Text>
              <Text style={styles.fieldLabel}>Search address</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Start typing an address"
                placeholderTextColor={semantic.placeholder}
                value={addressQuery}
                onChangeText={(t) => {
                  setAddressQuery(t);
                  setSelected(null);
                }}
                autoCorrect={false}
              />
              {searching ? (
                <ActivityIndicator style={styles.spinner} color={semantic.accentGold} />
              ) : null}
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.placeId}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                scrollEnabled={predictions.length > 0}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.predRow, pressed && styles.predPressed]}
                    onPress={() => void selectPrediction(item.placeId)}
                    hitSlop={hitSlop}
                    accessibilityRole="button"
                    accessibilityLabel={item.text}
                  >
                    <Text style={styles.predText}>{item.text}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  addressQuery.trim().length >= 2 && !searching ? (
                    <Text style={styles.emptyPred}>No matches — try refining the search.</Text>
                  ) : null
                }
              />
              {selected ? (
                <Card elevation="xs" shape="sheet" style={styles.confirmCard}>
                  <Text style={styles.confirmLabel}>Selected</Text>
                  <Text style={styles.confirmAddr}>{selected.formattedAddress}</Text>
                </Card>
              ) : null}
              <AppButton
                label={importing ? 'Importing…' : pendingListingUrl ? 'Complete listing import' : 'Import address'}
                onPress={onImportAddress}
                disabled={addressDisabled}
                loading={importing}
                testID="propfolio.import.submit.address"
              />
              <AppButton label="Back" variant="secondary" onPress={backFromManualInput} />
            </View>
          ) : null}
        </ScrollView>

        {step === 'method' ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} testID="propfolio.import.cancel" />
          </View>
        ) : null}

        {step === 'strategy' ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} testID="propfolio.import.cancel.strategy" />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  helper: {
    ...textPresets.bodySecondary,
    color: semantic.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  warn: {
    ...textPresets.caption,
    color: semantic.warning,
  },
  banner: {
    ...textPresets.caption,
    color: semantic.accentGold,
  },
  err: {
    ...textPresets.caption,
    color: semantic.danger,
  },
  optionStack: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minHeight: 96,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  optionTitle: {
    ...textPresets.bodyMedium,
    fontSize: 17,
    color: semantic.textPrimary,
  },
  optionSub: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    lineHeight: 18,
  },
  inputBlock: {
    gap: spacing.sm,
  },
  strategyPill: {
    ...textPresets.caption,
    fontWeight: '600',
    color: semantic.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...textPresets.metricLabel,
    color: semantic.textSecondary,
  },
  hint: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
  },
  linkInput: {
    ...textPresets.body,
    minHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: semantic.surfaceMuted,
    color: semantic.textPrimary,
  },
  searchInput: {
    ...textPresets.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: semantic.surfaceMuted,
    color: semantic.textPrimary,
  },
  spinner: { marginVertical: spacing.sm },
  list: { maxHeight: 200 },
  predRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
  },
  predPressed: { backgroundColor: semantic.surfaceMuted },
  predText: { ...textPresets.body, color: semantic.textPrimary },
  emptyPred: { ...textPresets.caption, marginTop: spacing.xs },
  confirmCard: { marginVertical: spacing.sm, padding: spacing.md },
  confirmLabel: { ...textPresets.metricLabel, marginBottom: spacing.xxs },
  confirmAddr: { ...textPresets.bodyMedium },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
    backgroundColor: semantic.background,
  },
});

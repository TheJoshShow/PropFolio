import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppCloseButton,
  HeaderActionSpacer,
  headerLeadingInset,
  headerTrailingInset,
  stackHeaderTitleStyle,
  stackModalHeaderBarStyle,
} from '@/components/navigation';
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
import { isResolvedPlaceComplete } from '@/services/property-import/placesResponseTransforms';
import { pasteContainsImportableListing } from '@/services/import/listingImportReadiness';
import {
  clipListingPasteForSubmit,
  inferPrimaryListingHost,
} from '@/services/import/listingUrlNormalize';
import { tryGetSupabaseClient } from '@/services/supabase';
import { iconSizes, radius, semantic, spacing, textPresets } from '@/theme';

import { ManualAddressInputSection } from './ManualAddressInputSection';
import { useImportSubmission } from './useImportSubmission';
import { useManualAddressSearch } from './useManualAddressSearch';
import { useUnifiedImportScreenState } from './useUnifiedImportScreenState';

type FlowStep = 'strategy' | 'unified';

export function ImportPropertyScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isReady, isSignedIn, needsEmailVerification } = useAuth();
  const sub = useSubscription();
  const { refreshCreditWalletOnly, applyCreditBalanceHint, creditBalance, creditWalletSyncing } = sub;
  const { ensureCanImport } = useImportGate();

  const correlationIdRef = useRef(generateUuid());
  const [placesCorrelationId, setPlacesCorrelationId] = useState(() => generateUuid());

  const [flowStep, setFlowStep] = useState<FlowStep>('strategy');
  const [strategy, setStrategy] = useState<InvestmentStrategy | null>(null);

  const [listingUrl, setListingUrl] = useState('');

  const [completingListingAddress, setCompletingListingAddress] = useState(false);
  const [pendingListingUrl, setPendingListingUrl] = useState<string | null>(null);
  const [listingHostForCompletion, setListingHostForCompletion] = useState<'zillow' | 'redfin' | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  /** Avoid showing “Credits left: 0” while wallet RPC is still reconciling a true balance > 0. */
  const [creditWalletSyncStall, setCreditWalletSyncStall] = useState(false);

  const configured = Boolean(tryGetSupabaseClient());

  useEffect(() => {
    if (!creditWalletSyncing) {
      setCreditWalletSyncStall(false);
      return;
    }
    const id = setTimeout(() => setCreditWalletSyncStall(true), 12_000);
    return () => clearTimeout(id);
  }, [creditWalletSyncing]);

  const creditsPillContent = useMemo(() => {
    if (creditWalletSyncing && !creditWalletSyncStall && creditBalance === 0) {
      return { mode: 'loading' as const };
    }
    return { mode: 'count' as const, value: creditBalance };
  }, [creditBalance, creditWalletSyncing, creditWalletSyncStall]);

  const manualPlacesActive = flowStep === 'unified';

  const manualAddress = useManualAddressSearch({
    active: manualPlacesActive,
    placesCorrelationId,
  });

  const { urlClientState, urlIsStableVerified, activeImportSource } = useUnifiedImportScreenState({
    listingUrl,
    importReadyFromSuggestionPick: manualAddress.importReadyFromSuggestionPick,
    completingListingAddress,
  });

  useFocusEffect(
    useCallback(() => {
      void refreshCreditWalletOnly();
    }, [refreshCreditWalletOnly]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Import Property',
      headerLargeTitle: false,
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerStyle: stackModalHeaderBarStyle,
      headerTitleStyle: stackHeaderTitleStyle,
      headerLeft: () => <HeaderActionSpacer />,
      headerLeftContainerStyle: headerLeadingInset(insets.left),
      headerRightContainerStyle: headerTrailingInset(insets.right),
      headerRight: () => (
        <AppCloseButton onPress={() => router.back()} testID="propfolio.import.header.close" />
      ),
    });
  }, [insets.left, insets.right, navigation, router]);

  const requireStrategy = useCallback((): InvestmentStrategy => {
    if (!strategy) {
      throw new Error('Choose an investment strategy to continue.');
    }
    return strategy;
  }, [strategy]);

  const navigateToImportedProperty = useCallback(
    (propertyId: string) => {
      router.replace(`/property/${propertyId}`);
    },
    [router],
  );

  const rotateCorrelationIdOnSuccess = useCallback(() => {
    correlationIdRef.current = generateUuid();
    setPlacesCorrelationId(generateUuid());
  }, []);

  const subscriptionRefresh = useCallback(() => refreshCreditWalletOnly(), [refreshCreditWalletOnly]);

  const applyServerBalanceHint = useCallback(
    (balanceAfter: number | null | undefined) => applyCreditBalanceHint(balanceAfter),
    [applyCreditBalanceHint],
  );

  const { runSubmission, importError, clearImportError, isSubmitting, submissionPhase } = useImportSubmission({
    ensureCanImport,
    subscriptionRefresh,
    correlationIdRef,
    onNavigateToProperty: navigateToImportedProperty,
    rotateCorrelationIdOnSuccess,
    applyServerBalanceHint,
  });

  const applyListingNeedsAddressFlow = useCallback(
    (paste: string) => {
      const host = inferPrimaryListingHost(paste) ?? 'zillow';
      clearImportError();
      setPendingListingUrl(clipListingPasteForSubmit(paste));
      setListingHostForCompletion(host);
      setCompletingListingAddress(true);
      setBanner('Confirm the property address to finish this listing import.');
      setPlacesCorrelationId(generateUuid());
      manualAddress.resetSearchSession();
    },
    [clearImportError, manualAddress],
  );

  const onImportListingUrl = useCallback(() => {
    void runSubmission({
      beforeValidate: () => setBanner(null),
      validateInput: () => {
        if (!pasteContainsImportableListing(listingUrl)) {
          return 'Use a Zillow or Redfin property page link (with homedetails / zpid, or Redfin /home/ id). Search or browse pages won’t import.';
        }
        return null;
      },
      requireStrategy,
      invoke: ({ strategy: s }) =>
        propertyImportService.importFromListingUrl(
          clipListingPasteForSubmit(listingUrl),
          null,
          s,
          correlationIdRef.current,
        ),
      onNeedsAddress: () => applyListingNeedsAddressFlow(listingUrl),
    });
  }, [applyListingNeedsAddressFlow, listingUrl, requireStrategy, runSubmission]);

  const onImportAddressOnly = useCallback(() => {
    if (!manualAddress.importReadyFromSuggestionPick) {
      return;
    }
    const place = manualAddress.placeDetails;
    if (!place || !isResolvedPlaceComplete(place)) {
      return;
    }
    void runSubmission({
      validateInput: () => null,
      requireStrategy,
      invoke: ({ strategy: s }) =>
        propertyImportService.importFromManualPlace(place, s, correlationIdRef.current),
      afterSuccessfulImport: () => {
        manualAddress.resetSearchSession();
      },
    });
  }, [manualAddress, requireStrategy, runSubmission]);

  const onCompleteListingWithAddress = useCallback(() => {
    if (!manualAddress.importReadyFromSuggestionPick) {
      return;
    }
    const place = manualAddress.placeDetails;
    if (!place || !isResolvedPlaceComplete(place)) {
      return;
    }
    const listingUrlForCompletion = pendingListingUrl;
    void runSubmission({
      validateInput: () => null,
      requireStrategy,
      invoke: ({ strategy: s }) => {
        if (listingUrlForCompletion) {
          return propertyImportService.importFromListingUrl(
            listingUrlForCompletion,
            place,
            s,
            correlationIdRef.current,
          );
        }
        return propertyImportService.importFromManualPlace(place, s, correlationIdRef.current);
      },
      afterSuccessfulImport:
        listingUrlForCompletion != null
          ? () => {
              setPendingListingUrl(null);
              setCompletingListingAddress(false);
              setListingHostForCompletion(null);
              setBanner(null);
              manualAddress.resetSearchSession();
            }
          : () => {
              manualAddress.resetSearchSession();
            },
    });
  }, [manualAddress, pendingListingUrl, requireStrategy, runSubmission]);

  const onImportPrimary = useCallback(() => {
    if (completingListingAddress) {
      void onCompleteListingWithAddress();
      return;
    }
    if (activeImportSource === 'url') {
      void onImportListingUrl();
    } else if (activeImportSource === 'address') {
      void onImportAddressOnly();
    }
  }, [
    activeImportSource,
    completingListingAddress,
    onCompleteListingWithAddress,
    onImportAddressOnly,
    onImportListingUrl,
  ]);

  const primaryDisabled = useMemo(() => {
    if (!configured || !strategy || isSubmitting || !sub.canRunImport) {
      return true;
    }
    if (completingListingAddress) {
      return (
        !manualAddress.importReadyFromSuggestionPick ||
        manualAddress.isResolvingSelection ||
        manualAddress.isManualGeocoding
      );
    }
    if (activeImportSource === 'url') {
      return !urlIsStableVerified;
    }
    if (activeImportSource === 'address') {
      return (
        !manualAddress.importReadyFromSuggestionPick ||
        manualAddress.isResolvingSelection ||
        manualAddress.isManualGeocoding
      );
    }
    return true;
  }, [
    activeImportSource,
    completingListingAddress,
    configured,
    isSubmitting,
    manualAddress.importReadyFromSuggestionPick,
    manualAddress.isManualGeocoding,
    manualAddress.isResolvingSelection,
    strategy,
    sub.canRunImport,
    urlIsStableVerified,
  ]);

  const primaryLabel = useMemo(() => {
    if (isSubmitting) {
      return 'Importing…';
    }
    if (completingListingAddress) {
      return manualAddress.importReadyFromSuggestionPick ? 'Complete import' : 'Import Property';
    }
    if (activeImportSource === 'url') {
      return 'Import from Link';
    }
    if (activeImportSource === 'address') {
      return 'Import Address';
    }
    return 'Import Property';
  }, [
    activeImportSource,
    completingListingAddress,
    isSubmitting,
    manualAddress.importReadyFromSuggestionPick,
  ]);

  const continueFromStrategy = useCallback(() => {
    if (!strategy) {
      return;
    }
    clearImportError();
    correlationIdRef.current = generateUuid();
    setPlacesCorrelationId(generateUuid());
    setListingUrl('');
    manualAddress.resetSearchSession();
    setFlowStep('unified');
  }, [clearImportError, manualAddress, strategy]);

  const backFromUnified = useCallback(() => {
    if (completingListingAddress) {
      setCompletingListingAddress(false);
      setPendingListingUrl(null);
      setListingHostForCompletion(null);
      setBanner(null);
      manualAddress.resetSearchSession();
      clearImportError();
      return;
    }
    setFlowStep('strategy');
    setListingUrl('');
    manualAddress.resetSearchSession();
    clearImportError();
  }, [clearImportError, completingListingAddress, manualAddress]);

  const onChangeManualAddress = useCallback(() => {
    manualAddress.resetSearchSession();
    clearImportError();
  }, [clearImportError, manualAddress]);

  useEffect(() => {
    if (flowStep === 'unified' && !strategy) {
      setCompletingListingAddress(false);
      setPendingListingUrl(null);
      setListingHostForCompletion(null);
      setBanner(null);
      setFlowStep('strategy');
      setListingUrl('');
    }
  }, [flowStep, strategy]);

  const stepIndicator = useMemo(() => {
    if (flowStep === 'strategy') {
      return 'Step 1 of 2';
    }
    return 'Step 2 of 2';
  }, [flowStep]);

  const showUrlInvalidHint =
    flowStep === 'unified' &&
    !completingListingAddress &&
    listingUrl.trim().length > 0 &&
    urlClientState === 'invalid';

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.section + spacing.xxl }]}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
        >
          {!configured ? (
            <Text style={styles.warn}>Add Supabase credentials to import properties.</Text>
          ) : null}

          <Text style={styles.stepPill}>{stepIndicator}</Text>

          {flowStep === 'strategy' ? (
            <View style={styles.section}>
              <Text style={styles.screenTitle}>Choose your strategy</Text>
              <Text style={styles.screenSub}>Metrics tailored to your investment style.</Text>
              <View style={styles.optionStack}>
                <Card
                  elevation="sm"
                  shape="sheet"
                  onPress={() => {
                    clearImportError();
                    setStrategy('buy_hold');
                  }}
                  style={[styles.optionCard, strategy === 'buy_hold' && styles.optionCardSelected]}
                  testID="propfolio.import.strategy.buy_hold"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="trending-up-outline" size={iconSizes.xl + 4} color={semantic.navy} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Buy &amp; Hold</Text>
                    <Text style={styles.optionSub}>
                      Analyze rental income, cash flow, and long-term returns
                    </Text>
                  </View>
                  {strategy === 'buy_hold' ? (
                    <Ionicons name="checkmark-circle" size={iconSizes.lg} color={semantic.accentGold} />
                  ) : (
                    <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
                  )}
                </Card>
                <Card
                  elevation="sm"
                  shape="sheet"
                  onPress={() => {
                    clearImportError();
                    setStrategy('fix_flip');
                  }}
                  style={[styles.optionCard, strategy === 'fix_flip' && styles.optionCardSelected]}
                  testID="propfolio.import.strategy.fix_flip"
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="hammer-outline" size={iconSizes.xl + 4} color={semantic.navy} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={styles.optionTitle}>Fix &amp; Flip</Text>
                    <Text style={styles.optionSub}>
                      Analyze resale potential, renovation upside, and flip margins
                    </Text>
                  </View>
                  {strategy === 'fix_flip' ? (
                    <Ionicons name="checkmark-circle" size={iconSizes.lg} color={semantic.accentGold} />
                  ) : (
                    <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
                  )}
                </Card>
              </View>
              <AppButton
                label="Continue"
                onPress={continueFromStrategy}
                disabled={!strategy}
                style={styles.importCtaPrimary}
                testID="propfolio.import.strategy.continue"
              />
            </View>
          ) : null}

          {flowStep === 'unified' ? (
            <View style={styles.unifiedBlock}>
              <View style={styles.creditsRow}>
                <View style={styles.creditsPill}>
                  {creditsPillContent.mode === 'loading' ? (
                    <ActivityIndicator size="small" color={semantic.accentGold} />
                  ) : null}
                  <Text
                    style={styles.creditsPillText}
                    testID="propfolio.import.credits.left"
                    accessibilityRole="text"
                    accessibilityLabel={
                      creditsPillContent.mode === 'loading'
                        ? 'Updating credit balance'
                        : `Credits left: ${creditsPillContent.value}`
                    }
                  >
                    {creditsPillContent.mode === 'loading'
                      ? 'Updating credits…'
                      : `Credits left: ${creditsPillContent.value}`}
                  </Text>
                </View>
              </View>

              <ImportCreditNotice />

              {submissionPhase === 'validating' ? (
                <Text style={styles.phaseLine}>Checking membership and credits…</Text>
              ) : null}
              {submissionPhase === 'submitting' ? (
                <Text style={styles.phaseLine}>Fetching property data and saving…</Text>
              ) : null}
              {banner ? <Text style={styles.banner}>{banner}</Text> : null}
              {importError ? <Text style={styles.err}>{importError}</Text> : null}

              <View style={styles.strategyBadge}>
                <Text style={styles.strategyBadgeText}>
                  Strategy · {strategy ? investmentStrategyLabel(strategy) : '—'}
                </Text>
              </View>

              <View style={styles.urlSection}>
                <Text style={styles.linkSectionTitle}>Paste Zillow or Redfin link</Text>
                <TextInput
                  style={[
                    styles.linkInput,
                    urlIsStableVerified &&
                    activeImportSource === 'url' &&
                    !completingListingAddress
                      ? styles.linkInputVerified
                      : null,
                  ]}
                  placeholder="Paste property link"
                  placeholderTextColor={semantic.placeholder}
                  value={completingListingAddress ? (pendingListingUrl ?? listingUrl) : listingUrl}
                  onChangeText={(t) => {
                    if (completingListingAddress) {
                      return;
                    }
                    clearImportError();
                    setListingUrl(t);
                  }}
                  editable={!completingListingAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Listing URL"
                  testID="propfolio.import.listingUrl"
                />
                {completingListingAddress ? (
                  <Text style={styles.completionNote}>
                    Listing:{' '}
                    {listingHostForCompletion === 'zillow'
                      ? 'Zillow'
                      : listingHostForCompletion === 'redfin'
                        ? 'Redfin'
                        : 'URL'}{' '}
                    · confirm the street address below.
                  </Text>
                ) : null}
                {!completingListingAddress && listingUrl.trim().length > 0 ? (
                  <View style={styles.urlStatusRow}>
                    {urlClientState === 'checking' ? (
                      <>
                        <ActivityIndicator size="small" color={semantic.accentGold} />
                        <Text style={styles.urlStatusText}>Checking link…</Text>
                      </>
                    ) : null}
                    {urlIsStableVerified ? (
                      <>
                        <Ionicons name="checkmark-circle" size={iconSizes.md} color={semantic.accentGold} />
                        <Text style={styles.urlStatusText}>Ready to import from link</Text>
                      </>
                    ) : null}
                  </View>
                ) : null}
                {showUrlInvalidHint ? (
                  <Text style={styles.urlInvalid} accessibilityLiveRegion="polite">
                    Use a property page URL (Zillow homedetails / zpid, or Redfin /home/…). Search and
                    browse links can&apos;t be imported.
                  </Text>
                ) : null}
                {!completingListingAddress &&
                urlIsStableVerified &&
                manualAddress.importReadyFromSuggestionPick ? (
                  <Text style={styles.urlBothHint} accessibilityRole="text">
                    Link and address are both ready — import uses the{' '}
                    <Text style={styles.urlBothHintEmph}>listing link</Text>. Clear the link field if you
                    only want the searched address.
                  </Text>
                ) : null}
              </View>

              <View style={styles.addressSection}>
                <ManualAddressInputSection
                  manualAddress={manualAddress}
                  onQueryChangeSideEffect={clearImportError}
                  onChangeAddress={onChangeManualAddress}
                  fieldLabel="SEARCH ADDRESS"
                  verifiedCardTitle="Verified address"
                  emphasizeVerifiedSelection={
                    completingListingAddress || activeImportSource === 'address'
                  }
                  visualVariant="importSheet"
                />
              </View>

              {!isSubmitting &&
              (completingListingAddress ||
                activeImportSource === 'url' ||
                activeImportSource === 'address') ? (
                <View style={styles.ctaPreorder}>
                  {completingListingAddress && !manualAddress.importReadyFromSuggestionPick ? (
                    <Text style={styles.activeSourcePlaceholder} testID="propfolio.import.activeSource.placeholder">
                      Pick and verify an address below to finish this listing import.
                    </Text>
                  ) : completingListingAddress ? (
                    <Text style={styles.activeSourceLine} testID="propfolio.import.activeSource">
                      <Text style={styles.activeSourceEmph}>Active source</Text>
                      {' · '}
                      Verified address (finish listing import)
                    </Text>
                  ) : activeImportSource === 'url' ? (
                    <Text style={styles.activeSourceLine} testID="propfolio.import.activeSource">
                      <Text style={styles.activeSourceEmph}>Active source</Text>
                      {' · '}
                      Listing link
                    </Text>
                  ) : (
                    <Text style={styles.activeSourceLine} testID="propfolio.import.activeSource">
                      <Text style={styles.activeSourceEmph}>Active source</Text>
                      {' · '}
                      Verified address
                    </Text>
                  )}
                </View>
              ) : null}

              <View style={styles.ctaColumn}>
                <AppButton
                  label={primaryLabel}
                  onPress={onImportPrimary}
                  disabled={primaryDisabled}
                  loading={isSubmitting}
                  style={styles.importCtaPrimary}
                  labelStyle={styles.importCtaPrimaryLabel}
                  testID="propfolio.import.submit.primary"
                />
                <AppButton
                  label="Back"
                  variant="secondary"
                  onPress={backFromUnified}
                  style={styles.importCtaSecondary}
                  labelStyle={styles.importCtaSecondaryLabel}
                  testID="propfolio.import.back"
                />
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  stepPill: {
    ...textPresets.caption,
    fontWeight: '600',
    color: semantic.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  section: {
    gap: spacing.lg,
    width: '100%',
  },
  unifiedBlock: {
    gap: spacing.lg,
    width: '100%',
  },
  creditsRow: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    maxWidth: '100%',
  },
  creditsPillText: {
    ...textPresets.caption,
    fontWeight: '700',
    color: semantic.navy,
    letterSpacing: 0.2,
  },
  linkSectionTitle: {
    ...textPresets.bodyMedium,
    fontSize: 17,
    color: semantic.textPrimary,
    marginBottom: spacing.sm,
  },
  screenTitle: {
    ...textPresets.bodyMedium,
    fontSize: 22,
    color: semantic.navy,
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  screenSub: {
    ...textPresets.bodySecondary,
    color: semantic.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  warn: {
    ...textPresets.caption,
    color: semantic.warning,
    textAlign: 'center',
  },
  banner: {
    ...textPresets.caption,
    color: semantic.accentGold,
    textAlign: 'center',
    lineHeight: 22,
  },
  err: {
    ...textPresets.caption,
    color: semantic.danger,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionStack: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    minHeight: 100,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    backgroundColor: semantic.surface,
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: semantic.accentGold,
    backgroundColor: semantic.surfaceMuted,
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
  strategyBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: semantic.surfaceMuted,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  strategyBadgeText: {
    ...textPresets.caption,
    fontWeight: '700',
    color: semantic.navy,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  urlSection: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  addressSection: {
    marginBottom: spacing.md,
    width: '100%',
  },
  linkInput: {
    ...textPresets.body,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: semantic.surface,
    color: semantic.textPrimary,
  },
  linkInputVerified: {
    borderColor: semantic.accentGold,
    borderWidth: 1,
  },
  urlStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  urlStatusText: {
    ...textPresets.captionSmall,
    color: semantic.textSecondary,
  },
  urlInvalid: {
    ...textPresets.captionSmall,
    color: semantic.danger,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  urlBothHint: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  urlBothHintEmph: {
    fontWeight: '700',
    color: semantic.textSecondary,
  },
  completionNote: {
    ...textPresets.captionSmall,
    color: semantic.textSecondary,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  ctaPreorder: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  activeSourceLine: {
    ...textPresets.bodySecondary,
    color: semantic.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
  },
  activeSourceEmph: {
    fontWeight: '700',
    color: semantic.navy,
  },
  activeSourcePlaceholder: {
    ...textPresets.caption,
    color: semantic.textTertiary,
    lineHeight: 22,
    textAlign: 'center',
  },
  ctaColumn: {
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: spacing.sm,
  },
  importCtaPrimary: {
    alignSelf: 'stretch',
    width: '100%',
    borderRadius: radius.full,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  importCtaPrimaryLabel: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
  importCtaSecondary: {
    alignSelf: 'stretch',
    width: '100%',
    borderRadius: radius.full,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: semantic.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  importCtaSecondaryLabel: {
    fontWeight: '600',
    color: semantic.navy,
    textAlign: 'center',
    flexShrink: 1,
  },
  phaseLine: {
    ...textPresets.caption,
    color: semantic.textSecondary,
    textAlign: 'center',
  },
});

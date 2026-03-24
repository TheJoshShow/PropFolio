/**
 * Property import: paste link or enter address.
 * Free tier: 2 imports; 3rd attempt shows paywall. Pro = unlimited.
 * Enforced in UI and server (property_imports trigger).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect, type Router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Button, TextInput } from '../../src/components';
import { useThemeColors } from '../../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../../src/theme';
import { parseListingImportForImportAsync } from '../../src/lib/parsers';
import { responsiveContentContainer } from '../../src/utils/responsive';
import { placesAutocomplete, getSupabase } from '../../src/services';
import { enrichAddressForImport } from '../../src/services/propertyImportOrchestrator';
import { importEnrichmentAlert } from '../../src/services/importErrorCodes';
import { useImportLimit } from '../../src/hooks/useImportLimit';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useImportResume } from '../../src/contexts/ImportResumeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { addressToImportData, FREE_IMPORT_LIMIT, type ImportSource } from '../../src/services/importLimits';
import { FreeImportsIndicator } from '../../src/components';
import { useExecutePropertyImport } from '../../src/hooks/useExecutePropertyImport';
import { trackEvent } from '../../src/services/analytics';
import { logErrorSafe, logImportStep } from '../../src/services/diagnostics';
import { IMPORT_USER_MESSAGES, resolveImportFailureMessage } from '../../src/services/importErrorMessages';
import { mapAutocompleteEdgeError, mapImportException } from '../../src/services/importPipelineErrors';
import { navigateToPortfolioDetail } from '../../src/utils/appNavigation';

const DEBOUNCE_MS = 400;

/** Open paywall when user is blocked by free-tier limit (structured result, no silent fail). */
function showPaywallForBlocked(router: Router) {
  trackEvent('paywall_viewed', { metadata: { source: 'import_limit' } });
  Alert.alert(
    'Import limit reached',
    "You've used your 2 free property imports. Upgrade to Pro to add more properties and unlock full analysis.",
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Upgrade to Pro', onPress: () => router.push('/paywall') },
    ]
  );
}

export default function ImportScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();
  const { freeRemaining, canImport, isLoading: limitLoading, refresh: importLimitRefresh } = useImportLimit();
  const { hasProAccess, refresh: subscriptionRefresh } = useSubscription();
  const { pendingImport, setPendingImport } = useImportResume();
  const { execute, isSubmitting } = useExecutePropertyImport();
  const resumeExecutedRef = useRef(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const hasSupabase = !!getSupabase();
  const addressInputRef = useRef(addressInput);

  const showPaywallAndBlock = useCallback(() => showPaywallForBlocked(router), [router]);

  const importByAddressLine = useCallback(
    async (rawAddressLine: string, source: ImportSource, opts?: { clearInputs?: boolean }) => {
      const trimmed = rawAddressLine.trim();
      if (!trimmed) {
        Alert.alert('Enter address', IMPORT_USER_MESSAGES.blankAddress);
        return;
      }

      if (!canImport) {
        trackEvent('import_started', { metadata: { source, blocked: true } });
        showPaywallAndBlock();
        return;
      }

      if (authLoading) {
        Alert.alert('Please wait', IMPORT_USER_MESSAGES.authenticationInProgress);
        return;
      }
      if (isSubmitting) {
        Alert.alert('Please wait', 'Another import is in progress.');
        return;
      }

      if (!session?.id) {
        Alert.alert('Sign in required', IMPORT_USER_MESSAGES.notSignedIn);
        return;
      }

      trackEvent('import_started', { metadata: { source } });

      // Standardize address + get rent when available.
      let addressLine = trimmed;
      let rent: number | undefined;
      let rentUnavailable = false;
      let geocodeLat: number | undefined;
      let geocodeLng: number | undefined;

      if (!hasSupabase && !(typeof __DEV__ !== 'undefined' && __DEV__)) {
        Alert.alert(
          'Import unavailable',
          'Your app is not connected to Supabase. Please reinstall the app after updating configuration.'
        );
        return;
      }

      if (hasSupabase) {
        // Manual-only: show loading from first tap through geocode + rent (prevents double-submit during geocode).
        const showAddressProgress = source === 'manual';
        if (showAddressProgress) setAddressLoading(true);
        try {
          const enrichedResult = await enrichAddressForImport({
            trimmedAddressLine: trimmed,
            hasSupabase: true,
            source,
          });
          if (!enrichedResult.ok) {
            const { title, message } = importEnrichmentAlert(enrichedResult.code);
            Alert.alert(title, message);
            return;
          }
          const enriched = enrichedResult.enriched;
          addressLine = enriched.addressLine;
          geocodeLat = enriched.geocodeLat;
          geocodeLng = enriched.geocodeLng;
          rent = enriched.rent;
          rentUnavailable = enriched.rentUnavailable;
        } finally {
          if (showAddressProgress) setAddressLoading(false);
        }
      } else {
        // No offline import support in production; the branch above guards this.
        rent = undefined;
        rentUnavailable = true;
      }

      const importData = addressToImportData(addressLine, rent != null ? Number(rent) : undefined);
      const withCoords =
        geocodeLat != null && geocodeLng != null
          ? { ...importData, latitude: geocodeLat, longitude: geocodeLng }
          : importData;
      const result = await execute(withCoords, source);

      if (result.status === 'allowed_free' || result.status === 'allowed_paid') {
        trackEvent('import_succeeded', { metadata: { source } });
        const rentLine =
          rent != null
            ? `\nEstimated monthly rent: $${Number(rent).toLocaleString()} (estimate only; verify with local sources.)`
            : rentUnavailable
              ? '\nRent estimate unavailable; you can add rent later in the property.'
              : '';
        Alert.alert('Property added', `${addressLine}${rentLine}\n\nSaved to your portfolio.`);

        if (opts?.clearInputs) {
          setLinkInput('');
          setAddressInput('');
        }

        // Take user straight to the detail view so they can confirm it's working.
        if (!navigateToPortfolioDetail(router, result.propertyId)) {
          Alert.alert('Could not open property', 'Something was wrong with the saved property link. Check your portfolio.');
        }
        return;
      }

      if (result.status === 'blocked_upgrade_required') {
        trackEvent('import_blocked_free_limit', { metadata: { source } });
        setPendingImport({ importData: withCoords, addressLine });
        showPaywallAndBlock();
        return;
      }

      if (result.status === 'failed_retryable') {
        const msg = resolveImportFailureMessage(result.error);
        Alert.alert('Import failed', msg, [
          { text: 'OK' },
          { text: 'Try again', onPress: () => importByAddressLine(rawAddressLine, source, opts) },
        ]);
        return;
      }

      if (result.status === 'failed_nonretryable') {
        const msg = resolveImportFailureMessage(result.error);
        Alert.alert('Import failed', msg);
        return;
      }
      // Should be unreachable due to exhaustive status handling.
      Alert.alert('Import failed', 'Something went wrong.');
    },
    [
      canImport,
      authLoading,
      isSubmitting,
      hasSupabase,
      session?.id,
      showPaywallAndBlock,
      setPendingImport,
      execute,
      router,
      trackEvent,
    ]
  );

  const handlePasteLink = useCallback(async () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (linkLoading || isSubmitting || authLoading || addressLoading) return;

    setLinkLoading(true);
    try {
      const parsed = await parseListingImportForImportAsync(trimmed);
      if (!parsed.ok) {
        if (parsed.reason === 'invalid_url') {
          Alert.alert('Invalid link', IMPORT_USER_MESSAGES.invalidListingLinkFormat);
        } else if (parsed.reason === 'unsupported') {
          Alert.alert('Unsupported link', IMPORT_USER_MESSAGES.unsupportedListingUrl);
        } else {
          Alert.alert('Could not use this link', IMPORT_USER_MESSAGES.unableToExtractListingAddress);
        }
        if (__DEV__) {
          logImportStep('import_link_parse_failed', {
            reason: parsed.reason,
            inputLen: trimmed.length,
          });
        }
        return;
      }

      if (__DEV__) {
        logImportStep('import_link_parse_ok', {
          provider: parsed.provider,
          listingIdLen: parsed.listingId.length,
        });
      }

      await importByAddressLine(parsed.addressLine, parsed.provider, { clearInputs: true });
    } catch (e) {
      logErrorSafe('Import handlePasteLink', e);
      const mapped = mapImportException(e);
      Alert.alert(mapped.title, mapped.message);
    } finally {
      setLinkLoading(false);
    }
  }, [linkInput, linkLoading, isSubmitting, authLoading, addressLoading, importByAddressLine]);

  useEffect(() => {
    const trimmed = addressInput.trim();
    addressInputRef.current = trimmed;

    if (!hasSupabase || trimmed.length < 3) {
      setSuggestions([]);
      setAutocompleteError(null);
      setAutocompleteLoading(false);
      return;
    }

    const t = setTimeout(async () => {
      const query = addressInputRef.current;
      if (query.length < 3) return;
      setAutocompleteError(null);
      setAutocompleteLoading(true);
      try {
        const { data, error } = await placesAutocomplete(query);
        setAutocompleteLoading(false);

        if (addressInputRef.current !== query) return;

        if (error) {
          setSuggestions([]);
          const mapped = mapAutocompleteEdgeError(error);
          setAutocompleteError(
            mapped.userMessage || 'Suggestions unavailable. You can still type an address and tap Use address.'
          );
          if (__DEV__) {
            logImportStep('autocomplete_edge_error', { errLen: String(error).length });
          }
          return;
        }

        const preds = data?.predictions ?? [];
        const normalized: { description: string; place_id: string }[] = preds
          .map((p) => ({
            description: String(p.description ?? '').trim(),
            place_id: String(p.place_id ?? '').trim(),
          }))
          .filter((p) => p.description.length > 0);
        setSuggestions(normalized);
        // Empty predictions = no matches, not a failure — clear error banner.
        setAutocompleteError(null);
        if (__DEV__ && normalized.length === 0) {
          logImportStep('autocomplete_empty', { queryLen: query.length });
        }
      } catch (e) {
        setAutocompleteLoading(false);
        if (addressInputRef.current !== query) return;
        logErrorSafe('Import placesAutocomplete', e);
        setSuggestions([]);
        const mapped = mapAutocompleteEdgeError(e instanceof Error ? e.message : String(e));
        setAutocompleteError(
          mapped.userMessage || 'Suggestions unavailable. You can still type an address and tap Use address.'
        );
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [addressInput, hasSupabase]);

  const handleSelectSuggestion = useCallback((description: string) => {
    setAddressInput(description);
    setSuggestions([]);
    setAutocompleteError(null);
  }, []);

  const handleAddress = useCallback(() => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      Alert.alert('Enter address', IMPORT_USER_MESSAGES.blankAddress);
      return;
    }
    if (isSubmitting || authLoading || linkLoading || addressLoading) return;
    importByAddressLine(trimmed, 'manual', { clearInputs: true });
  }, [addressInput, isSubmitting, authLoading, linkLoading, addressLoading, importByAddressLine]);

  // Reset resume flag when there is no pending import (e.g. user dismissed or completed).
  useEffect(() => {
    if (!pendingImport) resumeExecutedRef.current = false;
  }, [pendingImport]);

  // On focus with pending import, refresh subscription and import limit so canImport updates.
  useFocusEffect(
    useCallback(() => {
      if (!pendingImport) return;
      let cancelled = false;
      (async () => {
        await Promise.all([subscriptionRefresh(), importLimitRefresh()]);
        if (__DEV__ && !cancelled) logImportStep('resume_subscription_refresh', {});
      })();
      return () => { cancelled = true; };
    }, [pendingImport, subscriptionRefresh, importLimitRefresh])
  );

  // Single resume execute when we have pending import and entitlement allows. No retry loop.
  useEffect(() => {
    if (!pendingImport || !canImport || isSubmitting || authLoading || resumeExecutedRef.current) return;
    resumeExecutedRef.current = true;
    const data = pendingImport;
    setPendingImport(null);
    execute(data.importData, 'manual')
      .then((result) => {
        if (result.status === 'allowed_free' || result.status === 'allowed_paid') {
          trackEvent('import_succeeded', { metadata: { source: 'address', resumed: true } });
          Alert.alert(
            'Property added',
            `${data.addressLine}\n\nThanks for upgrading—your property has been saved to your portfolio.`
          );
          setAddressInput('');
        } else if (result.status === 'blocked_upgrade_required') {
          setPendingImport(data);
          resumeExecutedRef.current = false;
          Alert.alert(
            'Subscription still activating',
            'Pro access is not active yet. Tap "Retry" below to check again, or try again in a moment.'
          );
        } else {
          const err = resolveImportFailureMessage('error' in result ? result.error : undefined);
          Alert.alert('Import failed', err);
        }
      })
      .catch((err: unknown) => {
        logErrorSafe('Import resume after upgrade', err);
        resumeExecutedRef.current = false;
        setPendingImport(data);
        const mapped = mapImportException(err);
        Alert.alert(mapped.title, mapped.message);
      });
  }, [pendingImport, canImport, isSubmitting, authLoading, setPendingImport, execute]);

  const handleResumeRetry = useCallback(() => {
    subscriptionRefresh();
    importLimitRefresh();
  }, [subscriptionRefresh, importLimitRefresh]);

  const atLimit = !canImport && freeRemaining === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: styles.content.paddingBottom + insets.bottom },
        responsiveContentContainer,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Add property</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Paste a listing link or enter an address.
      </Text>

      <FreeImportsIndicator
        freeRemaining={freeRemaining}
        limit={FREE_IMPORT_LIMIT}
        isPro={hasProAccess}
        isLoading={limitLoading}
      />

      {atLimit && (
        <Card style={[styles.upgradeCard, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.upgradeTitle, { color: colors.text }]}>
            You've used your 2 free imports
          </Text>
          <Text style={[styles.upgradeBody, { color: colors.textSecondary }]}>
            Upgrade to Pro to add more properties and unlock full analysis.
          </Text>
          <Button
            title="Upgrade to Pro"
            onPress={() => router.push('/paywall')}
            fullWidth
            style={styles.upgradeCta}
            accessibilityLabel="Upgrade to Pro"
          />
        </Card>
      )}

      {pendingImport && !canImport && (
        <Card style={[styles.resumeCard, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.resumeTitle, { color: colors.text }]}>
            Verifying subscription
          </Text>
          <Text style={[styles.resumeBody, { color: colors.textSecondary }]}>
            If you just upgraded, Pro may still be activating. Tap Retry to check again.
          </Text>
          <Button
            title="Retry"
            onPress={handleResumeRetry}
            variant="secondary"
            fullWidth
            style={styles.resumeRetryButton}
            accessibilityLabel="Retry subscription check"
          />
        </Card>
      )}

      <Card style={styles.card} elevated>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Paste link</Text>
        <TextInput
          placeholder="https://www.zillow.com/... or https://www.redfin.com/..."
          value={linkInput}
          onChangeText={setLinkInput}
          containerStyle={styles.inputWrap}
          accessibilityLabel="Paste Zillow or Redfin link"
        />
        <Button
          title={isSubmitting ? 'Saving…' : linkLoading ? 'Importing…' : 'Import from link'}
          onPress={handlePasteLink}
          fullWidth
          variant="primary"
          pill
          glow
          disabled={atLimit || isSubmitting || linkLoading || addressLoading || authLoading}
          accessibilityLabel="Import from link"
        />
      </Card>

      <Card style={styles.card} elevated>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Or enter address</Text>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="123 Main St, City, ST 12345"
            value={addressInput}
            onChangeText={setAddressInput}
            containerStyle={styles.inputWrapInner}
            accessibilityLabel="Property address"
          />
          {autocompleteLoading && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.autocompleteSpinner} />
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {suggestions.slice(0, 5).map((s, i) => (
              <TouchableOpacity
                key={s.place_id || `s-${i}`}
                style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectSuggestion(s.description)}
                accessibilityRole="button"
                accessibilityLabel={`Address suggestion: ${s.description}`}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
                  {s.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {autocompleteError && (
          <Text style={[styles.autocompleteError, { color: colors.textSecondary }]}>
            {autocompleteError}
          </Text>
        )}
        <Button
          title={
            addressLoading
              ? 'Looking up…'
              : isSubmitting
                ? 'Saving…'
                : 'Use address'
          }
          onPress={handleAddress}
          variant="secondary"
          fullWidth
          disabled={addressLoading || linkLoading || isSubmitting || atLimit || authLoading}
          accessibilityLabel={addressLoading ? 'Looking up address' : isSubmitting ? 'Saving property' : 'Use address'}
        />
      </Card>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, lineHeight: lineHeights.title, marginBottom: spacing.xxs },
  subtitle: { fontSize: fontSizes.base, marginBottom: spacing.xl, lineHeight: lineHeights.base },
  upgradeCard: {
    marginBottom: spacing.l,
    padding: spacing.m,
    borderRadius: radius.l,
  },
  upgradeTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  upgradeBody: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.m,
    lineHeight: lineHeights.sm,
  },
  upgradeCta: { marginTop: spacing.xs },
  resumeCard: {
    marginBottom: spacing.l,
    padding: spacing.m,
    borderRadius: radius.l,
  },
  resumeTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  resumeBody: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.m,
    lineHeight: 20,
  },
  resumeRetryButton: { marginTop: spacing.xs },
  card: { marginBottom: spacing.l },
  sectionTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold, marginBottom: spacing.s },
  inputWrap: { marginBottom: spacing.s, position: 'relative' },
  inputWrapInner: { marginBottom: 0 },
  autocompleteSpinner: { position: 'absolute', right: spacing.s, top: 14 },
  suggestions: {
    marginBottom: spacing.s,
    borderRadius: radius.s,
    overflow: 'hidden',
    borderWidth: 1,
    zIndex: 10,
    elevation: 4,
  },
  suggestionRow: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderBottomWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestionText: { fontSize: fontSizes.base },
  autocompleteError: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.s,
    lineHeight: lineHeights.sm,
  },
});

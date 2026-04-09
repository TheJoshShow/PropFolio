import { useMemo } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton, Card } from '@/components/ui';
import type { AutocompletePrediction } from '@/services/property-import';
import { hitSlop, radius, semantic, spacing, textPresets } from '@/theme';

import type { ManualAddressSearchHandle } from './useManualAddressSearch';

const MAX_SUGGESTIONS = 5;

type Props = {
  manualAddress: ManualAddressSearchHandle;
  onQueryChangeSideEffect?: () => void;
  /** Clears verified selection so user can pick another suggestion (manual import only). */
  onChangeAddress?: () => void;
  fieldLabel?: string;
  fieldHint?: string;
  verifiedCardTitle?: string;
  /** When false, verified pick stays visible but the field is not highlighted as the active import path. */
  emphasizeVerifiedSelection?: boolean;
  /** Larger pill field + white fill for import modal. */
  visualVariant?: 'default' | 'importSheet';
};

export function ManualAddressInputSection({
  manualAddress,
  onQueryChangeSideEffect,
  onChangeAddress,
  fieldLabel = 'Search address',
  fieldHint,
  verifiedCardTitle = 'Selected address',
  emphasizeVerifiedSelection = true,
  visualVariant = 'default',
}: Props) {
  const {
    query,
    setQuery,
    suggestions,
    placeDetails,
    isLoadingSuggestions,
    isResolvingSelection,
    isManualGeocoding,
    autocompleteError,
    selectSuggestion,
    MIN_QUERY_CHARS,
    importReadyFromSuggestionPick,
  } = manualAddress;

  const displaySuggestions = useMemo(
    () => suggestions.slice(0, MAX_SUGGESTIONS),
    [suggestions],
  );

  const trimmedLen = query.trim().length;
  const showSuggestionPanel = trimmedLen >= MIN_QUERY_CHARS;

  const statusMessage = useMemo(() => {
    if (autocompleteError) {
      return autocompleteError;
    }
    if (isResolvingSelection || isManualGeocoding) {
      return 'Resolving address…';
    }
    if (isLoadingSuggestions) {
      return 'Loading suggestions…';
    }
    return null;
  }, [autocompleteError, isLoadingSuggestions, isManualGeocoding, isResolvingSelection]);

  const showNoMatches =
    showSuggestionPanel &&
    !isLoadingSuggestions &&
    !autocompleteError &&
    !isResolvingSelection &&
    !isManualGeocoding &&
    displaySuggestions.length === 0;

  const searchInputBaseStyle =
    visualVariant === 'importSheet' ? styles.searchInputImportSheet : styles.searchInput;

  return (
    <View>
      <Text style={styles.fieldLabel}>{fieldLabel}</Text>
      {fieldHint ? <Text style={styles.fieldHint}>{fieldHint}</Text> : null}
      <View style={styles.addressAutocompleteShell}>
        <TextInput
          style={[
            searchInputBaseStyle,
            importReadyFromSuggestionPick && emphasizeVerifiedSelection ? styles.searchInputConfirmed : null,
          ]}
          placeholder="Start typing an address"
          placeholderTextColor={semantic.placeholder}
          value={query}
          onChangeText={(t) => {
            onQueryChangeSideEffect?.();
            setQuery(t);
          }}
          autoCorrect={false}
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={() => Keyboard.dismiss()}
          accessibilityLabel="Address search"
        />
        {isLoadingSuggestions || isResolvingSelection || isManualGeocoding ? (
          <ActivityIndicator style={styles.spinner} color={semantic.accentGold} />
        ) : null}
        {statusMessage ? <Text style={styles.statusLine}>{statusMessage}</Text> : null}
        {showSuggestionPanel ? (
          <View
            style={[
              styles.suggestionsPanel,
              visualVariant === 'importSheet' ? styles.suggestionsPanelSheet : null,
            ]}
            accessibilityRole="list"
          >
            {displaySuggestions.map((item: AutocompletePrediction, index: number) => (
              <Pressable
                key={`${item.placeId}:${index}`}
                style={({ pressed }) => [styles.predRow, pressed && styles.predPressed]}
                onPress={() => {
                  Keyboard.dismiss();
                  void selectSuggestion(item);
                }}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel={item.fullText || item.text}
                accessibilityHint="Select this address for verification"
              >
                <Text style={styles.predPrimary} numberOfLines={2}>
                  {item.primaryText || item.fullText || item.text}
                </Text>
                {item.secondaryText ? (
                  <Text style={styles.predSecondary} numberOfLines={2}>
                    {item.secondaryText}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            {suggestions.length > MAX_SUGGESTIONS ? (
              <Text style={styles.moreHint}>Showing top {MAX_SUGGESTIONS} matches — refine search if needed.</Text>
            ) : null}
            {showNoMatches ? (
              <Text style={styles.emptyPred}>No matches — try refining the search.</Text>
            ) : null}
          </View>
        ) : trimmedLen > 0 ? (
          <Text style={styles.typeMoreHint}>
            Type at least {MIN_QUERY_CHARS} characters for suggestions.
          </Text>
        ) : null}
      </View>
      {importReadyFromSuggestionPick && placeDetails ? (
        <Card elevation="xs" shape="sheet" style={styles.confirmCard}>
          <Text style={styles.confirmLabel}>{verifiedCardTitle}</Text>
          <Text style={styles.confirmAddr}>
            {placeDetails.formattedAddress?.trim() ||
              placeDetails.normalizedOneLine?.trim() ||
              ''}
          </Text>
          {onChangeAddress ? (
            <AppButton
              label="Change address"
              variant="secondary"
              onPress={onChangeAddress}
              testID="propfolio.import.manual.changeAddress"
            />
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...textPresets.metricLabel,
    color: semantic.textSecondary,
    marginBottom: spacing.xxs,
  },
  fieldHint: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  addressAutocompleteShell: {
    zIndex: 20,
    ...(Platform.OS === 'android' ? { elevation: 6 } : {}),
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
  searchInputImportSheet: {
    ...textPresets.body,
    fontSize: 16,
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: semantic.surface,
    color: semantic.textPrimary,
  },
  searchInputConfirmed: {
    borderColor: semantic.accentGold,
    borderWidth: 1,
  },
  spinner: { marginVertical: spacing.sm },
  statusLine: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  typeMoreHint: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  suggestionsPanel: {
    marginTop: spacing.sm,
    maxHeight: 220,
    zIndex: 21,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    borderRadius: radius.card,
    backgroundColor: semantic.surface,
    overflow: 'hidden',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }
      : {}),
  },
  suggestionsPanelSheet: {
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  predRow: {
    minHeight: 52,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: semantic.border,
  },
  predPressed: { backgroundColor: semantic.surfaceMuted },
  predPrimary: { ...textPresets.bodyMedium, color: semantic.textPrimary },
  predSecondary: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    marginTop: spacing.xxs,
    lineHeight: 18,
  },
  moreHint: {
    ...textPresets.captionSmall,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: semantic.textTertiary,
    lineHeight: 18,
  },
  emptyPred: {
    ...textPresets.caption,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: semantic.textTertiary,
  },
  confirmCard: {
    marginVertical: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: semantic.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  confirmLabel: { ...textPresets.metricLabel, marginBottom: spacing.xxs, color: semantic.accentGold },
  confirmAddr: { ...textPresets.bodyMedium },
});

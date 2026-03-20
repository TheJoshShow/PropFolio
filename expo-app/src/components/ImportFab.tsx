/**
 * Floating action button: primary “+” affordance for adding/importing a property.
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { spacing, radius } from '../theme';
import { primaryButtonGlow } from '../theme/shadows';
import { IMPORT_FAB_BOTTOM_GAP, IMPORT_FAB_SIZE } from '../constants/fabLayout';
import { useThemeColors } from './useThemeColors';

const ICON_SIZE = 26;
const DEBOUNCE_MS = 500;

export function ImportFab() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const pending = useRef(false);

  const navigate = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    router.push('/(tabs)/import');
    setTimeout(() => {
      pending.current = false;
    }, DEBOUNCE_MS);
  }, [router]);

  // Tab screens use SafeAreaView(edges bottom); avoid adding full insets.bottom here or the FAB sits too high.
  const bottom = IMPORT_FAB_BOTTOM_GAP;
  const right = spacing.xl + Math.max(insets.right, 0);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom, right }]}>
      <Pressable
        onPress={navigate}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 },
          primaryButtonGlow(colors.primary),
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add property"
        accessibilityHint="Opens import to add a property to your portfolio"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <SymbolView name="plus" tintColor={colors.onPrimary} size={ICON_SIZE} weight="semibold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 20,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
  fab: {
    width: IMPORT_FAB_SIZE,
    height: IMPORT_FAB_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

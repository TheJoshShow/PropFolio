import { Ionicons } from '@expo/vector-icons';
import type { Router } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { hitSlop, iconSizes, semantic, spacing } from '@/theme';

type HeaderNavigation = {
  setOptions: (options: Record<string, unknown>) => void;
};

/**
 * Portfolio stack header: plus (import), centered PropFolio, settings.
 */
export function usePortfolioHeader(
  navigation: HeaderNavigation,
  router: Router,
  onImport: () => void,
): void {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'PropFolio',
      headerTitleAlign: 'center',
      headerLargeTitle: false,
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import property"
          onPress={onImport}
          hitSlop={hitSlop}
          style={styles.headerIconBtn}
        >
          <Ionicons name="add" size={iconSizes.xl} color={semantic.textPrimary} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          hitSlop={hitSlop}
          style={styles.headerIconBtn}
        >
          <Ionicons name="settings-outline" size={iconSizes.lg} color={semantic.textPrimary} />
        </Pressable>
      ),
    });
  }, [navigation, onImport, router]);
}

const styles = StyleSheet.create({
  headerIconBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
});

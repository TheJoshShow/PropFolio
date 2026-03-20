/**
 * Hook that returns the current theme colors (light or dark).
 * Uses React Navigation's useTheme when available; otherwise defaults to light.
 */

import { useColorScheme } from '@/components/useColorScheme';
import { lightColors, darkColors } from '../theme';

export function useThemeColors() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}

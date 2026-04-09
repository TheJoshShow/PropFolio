import { StyleSheet } from 'react-native';

import { semantic } from '@/theme';

/**
 * Native stack title — matches in-screen `AppHeader` / iOS standard.
 * Cast: React Navigation types only allow `color?: string` (not full `ColorValue`).
 */
export const stackHeaderTitleStyle = {
  fontSize: 17,
  fontWeight: '600' as const,
  color: semantic.navy as string,
};

/**
 * Default stack bar surface (solid — avoids frosted “pill” behind custom header items on iOS).
 * Cast: native-stack `headerStyle` is typed as `{ backgroundColor?: string }` only, but Android
 * still respects extra fields where supported.
 */
export const stackHeaderBarStyle = {
  backgroundColor: semantic.background,
} as { backgroundColor?: string };

/** Modal / sheet-style stack bar with hairline divider. */
export const stackModalHeaderBarStyle = {
  backgroundColor: semantic.surface,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: semantic.border,
  elevation: 0,
} as { backgroundColor?: string };

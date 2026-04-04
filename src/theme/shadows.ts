import { Platform, type ViewStyle } from 'react-native';

import { semantic } from './semantic';

export type Elevation = 'none' | 'xs' | 'sm' | 'md' | 'lg';

/** Subtle navy-tinted shadow on iOS reads more “product” than pure black. */
const shadowTint = semantic.textPrimary;

const iosShadow = (opacity: number, radius: number, offsetY: number): ViewStyle => ({
  shadowColor: shadowTint,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: radius,
});

/**
 * Restrained elevation — cards and FABs only; lists often use border-only (elevation none).
 */
export function shadowStyle(level: Elevation): ViewStyle {
  if (level === 'none') {
    return {};
  }
  if (Platform.OS === 'android') {
    const map = { xs: 1, sm: 2, md: 4, lg: 8 } as const;
    return { elevation: map[level] };
  }
  if (level === 'xs') {
    return iosShadow(0.04, 4, 1);
  }
  if (level === 'sm') {
    return iosShadow(0.06, 8, 2);
  }
  if (level === 'md') {
    return iosShadow(0.08, 14, 4);
  }
  return iosShadow(0.12, 20, 8);
}

export const separatorColor = semantic.border;

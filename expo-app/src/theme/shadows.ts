/**
 * Shadows and glow for depth. Restrained, premium feel.
 */

import type { ViewStyle } from 'react-native';

/** Soft glow under primary CTA (amber). */
export function primaryButtonGlow(glowColor: string): ViewStyle {
  return {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  };
}

/** Subtle card/surface elevation. */
export const cardShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

/** Very subtle surface lift. */
export const surfaceSubtle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};

/**
 * Shadows and glow for depth. Restrained, premium feel.
 */

import type { ViewStyle } from 'react-native';

/** Soft glow under primary CTA (amber). Keep this restrained for a premium feel. */
export function primaryButtonGlow(glowColor: string): ViewStyle {
  return {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 8,
  };
}

/** Subtle card/surface elevation for frosted cards over the skyline background. */
export const cardShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.25,
  shadowRadius: 32,
  elevation: 10,
};

/** Very subtle surface lift. */
export const surfaceSubtle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};

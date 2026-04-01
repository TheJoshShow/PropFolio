/**
 * Semantic color tokens for PropFolio.
 * Premium iOS-native palette: deep navy + warm gold, soft frosted surfaces.
 * Always use these tokens instead of raw hex values in components.
 */

/** Premium dark: Chicago River at dusk – deep navy background, warm city lights. */
export const darkColors = {
  /** App chrome / screen background (often sits behind frosted cards). */
  background: '#050814',
  /**
   * Primary frosted card surface. On native, we usually render this on top of
   * an image/gradient – keep it soft and slightly translucent.
   */
  surface: 'rgba(15, 23, 42, 0.85)',
  /** Secondary surface for pills, tabs, and subtle containers. */
  surfaceSecondary: 'rgba(15, 23, 42, 0.65)',
  /** Warm gold primary accent (buttons, active pills, key metrics). */
  primary: '#E2A556',
  /** Text on primary surfaces (e.g. labels on gold buttons). */
  onPrimary: '#0B1120',
  primaryPressed: '#C2893C',
  /** Very soft gold wash for muted states / backgrounds. */
  primaryMuted: 'rgba(226, 165, 86, 0.16)',
  /** Primary text on dark background. */
  text: '#F9FAFB',
  /** Secondary copy, helper text. */
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  /** Subtle card borders / separators. */
  border: 'rgba(148, 163, 184, 0.4)',
  /** Focus ring / outline for inputs. */
  borderFocus: '#E2A556',
  /** Muted success / positive metric. */
  success: '#4ADE80',
  successMuted: 'rgba(74, 222, 128, 0.16)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.16)',
  error: '#F97373',
  errorMuted: 'rgba(248, 113, 113, 0.18)',
  /** Subtle glow for primary CTAs (amber soft shadow). */
  glowPrimary: 'rgba(226, 165, 86, 0.45)',
} as const;

/** Light variant: daylight-ready but still cohesive with the dark palette. */
export const lightColors = {
  background: '#E5E9F0',
  /** Primary card surface: frosted white over light background. */
  surface: 'rgba(255, 255, 255, 0.94)',
  surfaceSecondary: 'rgba(255, 255, 255, 0.8)',
  primary: '#C4893A',
  onPrimary: '#111827',
  primaryPressed: '#A9702A',
  primaryMuted: 'rgba(244, 214, 168, 0.45)',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  border: 'rgba(148, 163, 184, 0.45)',
  borderFocus: '#C4893A',
  success: '#16A34A',
  successMuted: 'rgba(34, 197, 94, 0.12)',
  warning: '#D97706',
  warningMuted: 'rgba(234, 179, 8, 0.12)',
  error: '#DC2626',
  errorMuted: 'rgba(239, 68, 68, 0.12)',
  glowPrimary: 'rgba(196, 137, 58, 0.28)',
} as const;

export type ColorScheme = 'light' | 'dark';


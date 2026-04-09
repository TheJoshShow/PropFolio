/**
 * Semantic design tokens — match PropFolio renders (light canvas, navy type, gold CTAs).
 * Legacy `colors.*` aliases are derived here so existing screens keep working.
 */

export const semantic = {
  /** App canvas — very light, slightly cool */
  background: '#F7F7F9',
  /** Grouped lists / secondary panels */
  backgroundSecondary: '#F2F2F7',
  /** Cards, sheets */
  surface: '#FFFFFF',
  /** Inputs, chips, subtle fills */
  surfaceMuted: '#F7F6F3',

  textPrimary: '#1A2B48',
  textSecondary: '#5C6B7A',
  textTertiary: '#8E9AA6',

  border: '#E8E6E1',
  borderStrong: '#D8D5CE',

  accentGold: '#D9B056',
  accentGoldPressed: '#B8942E',
  /** Slightly lighter than pressed — readable rim on circular nav buttons without a harsh ring */
  accentGoldNavRim: '#C9A23D',
  accentGoldMuted: 'rgba(217, 176, 86, 0.16)',
  /** Text on gold buttons */
  accentGoldText: '#FFFFFF',

  /** Headings / emphasis aligned with brand navy */
  navy: '#1A2B48',

  success: '#2F9D6A',
  warning: '#C27D1A',
  danger: '#C93434',

  placeholder: '#8E9AA6',

  /** Score pills (distinct from CTA gold if needed) */
  accentScore: '#C6A035',
  accentScoreMuted: 'rgba(198, 160, 53, 0.14)',

  overlay: 'rgba(26, 43, 72, 0.45)',
} as const;

export type SemanticColors = typeof semantic;

/**
 * Backward-compatible `colors` map used across the app pre–design-system.
 */
export const colors = {
  backgroundPrimary: semantic.background,
  backgroundSecondary: semantic.backgroundSecondary,
  surfaceCard: semantic.surface,
  surfaceMuted: semantic.surfaceMuted,
  border: semantic.border,
  borderStrong: semantic.borderStrong,
  textPrimary: semantic.textPrimary,
  textSecondary: semantic.textSecondary,
  textMuted: semantic.textTertiary,
  success: semantic.success,
  warning: semantic.warning,
  danger: semantic.danger,
  accentScore: semantic.accentScore,
  accentScoreMuted: semantic.accentScoreMuted,
  accentCta: semantic.accentGold,
  accentCtaPressed: semantic.accentGoldPressed,
  onCta: semantic.accentGoldText,
  overlay: semantic.overlay,
} as const;

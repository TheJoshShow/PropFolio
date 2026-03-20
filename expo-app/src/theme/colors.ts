/**
 * Semantic color tokens. Premium dark (navy + amber) and light variant.
 * Use these instead of raw hex in components.
 */

/** Premium dark: deep navy background, warm amber accent, high contrast. */
export const darkColors = {
  background: '#0F1419',
  surface: '#1A2129',
  surfaceSecondary: '#252D38',
  primary: '#E5A00D',
  /** Text on primary (e.g. button label, badge on amber). */
  onPrimary: '#0F172A',
  primaryPressed: '#CC8F0A',
  primaryMuted: '#3D3520',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderFocus: '#E5A00D',
  success: '#22C55E',
  successMuted: '#14532D',
  warning: '#F59E0B',
  warningMuted: '#451A03',
  error: '#EF4444',
  errorMuted: '#450A0A',
  /** Subtle glow for primary CTAs (e.g. amber soft shadow). */
  glowPrimary: 'rgba(229, 160, 13, 0.35)',
} as const;

/** Light variant: light gray bg, dark text, same amber accent for cohesion. */
export const lightColors = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceSecondary: '#E2E8F0',
  primary: '#C4890A',
  onPrimary: '#0F172A',
  primaryPressed: '#A67A09',
  primaryMuted: '#FEF3C7',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#CBD5E1',
  borderFocus: '#C4890A',
  success: '#16A34A',
  successMuted: '#DCFCE7',
  warning: '#D97706',
  warningMuted: '#FEF3C7',
  error: '#DC2626',
  errorMuted: '#FEE2E2',
  glowPrimary: 'rgba(196, 137, 10, 0.25)',
} as const;

export type ColorScheme = 'light' | 'dark';

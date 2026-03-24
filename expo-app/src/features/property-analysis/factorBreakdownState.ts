export type FactorBreakdownState = 'loading' | 'available' | 'unavailable' | 'premium_only';

export function resolveFactorBreakdownState(input: {
  /** Property / analysis row still loading. */
  isLoading: boolean;
  /** When true, Pro users see full breakdown; others see premium_only (not unavailable). */
  isPremiumOnly: boolean;
  componentCount: number;
  /**
   * RevenueCat / cache still resolving — do not show premium_only yet (avoids flash for Pro users).
   */
  subscriptionEntitlementLoading?: boolean;
  /** Required when isPremiumOnly; ignored when isPremiumOnly is false. */
  hasProAccess?: boolean;
}): FactorBreakdownState {
  if (input.isLoading) return 'loading';
  if (input.isPremiumOnly) {
    if (input.subscriptionEntitlementLoading) return 'loading';
    if (!input.hasProAccess) return 'premium_only';
  }
  return input.componentCount > 0 ? 'available' : 'unavailable';
}

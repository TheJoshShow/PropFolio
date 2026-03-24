import { resolveFactorBreakdownState } from '../factorBreakdownState';

describe('resolveFactorBreakdownState', () => {
  it('returns loading when analysis is still loading', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: true,
        isPremiumOnly: false,
        componentCount: 3,
      })
    ).toBe('loading');
  });

  it('returns premium_only when gated and user is not Pro', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: false,
        isPremiumOnly: true,
        componentCount: 3,
        hasProAccess: false,
      })
    ).toBe('premium_only');
  });

  it('returns loading when gated but subscription entitlement still loading', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: false,
        isPremiumOnly: true,
        componentCount: 3,
        hasProAccess: false,
        subscriptionEntitlementLoading: true,
      })
    ).toBe('loading');
  });

  it('returns available for Pro when gated and components exist', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: false,
        isPremiumOnly: true,
        componentCount: 2,
        hasProAccess: true,
      })
    ).toBe('available');
  });

  it('returns unavailable for Pro when gated but no components', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: false,
        isPremiumOnly: true,
        componentCount: 0,
        hasProAccess: true,
      })
    ).toBe('unavailable');
  });

  it('returns available when components exist and not gated', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: false,
        isPremiumOnly: false,
        componentCount: 2,
      })
    ).toBe('available');
  });

  it('returns unavailable when no components', () => {
    expect(
      resolveFactorBreakdownState({
        isLoading: false,
        isPremiumOnly: false,
        componentCount: 0,
      })
    ).toBe('unavailable');
  });
});

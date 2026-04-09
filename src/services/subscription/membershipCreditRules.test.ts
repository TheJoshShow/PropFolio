import { describe, expect, it } from 'vitest';

import {
  canAccessApp,
  canPurchaseCreditPacks,
  canRunImport,
  hasActiveMembership,
  hasImportCredits,
} from './membershipCreditRules';

describe('membershipCreditRules', () => {
  it('hasActiveMembership mirrors hasAppAccess', () => {
    expect(hasActiveMembership(true)).toBe(true);
    expect(hasActiveMembership(false)).toBe(false);
  });

  it('canAccessApp requires hydration and membership', () => {
    expect(canAccessApp({ accessHydrated: false, hasAppAccess: true })).toBe(false);
    expect(canAccessApp({ accessHydrated: true, hasAppAccess: false })).toBe(false);
    expect(canAccessApp({ accessHydrated: true, hasAppAccess: true })).toBe(true);
  });

  it('hasImportCredits is balance >= 1', () => {
    expect(hasImportCredits({ creditBalance: 0 })).toBe(false);
    expect(hasImportCredits({ creditBalance: 1 })).toBe(true);
  });

  it('canPurchaseCreditPacks requires membership only', () => {
    expect(canPurchaseCreditPacks({ hasAppAccess: false })).toBe(false);
    expect(canPurchaseCreditPacks({ hasAppAccess: true })).toBe(true);
  });

  it('canRunImport requires membership and credits (wallet RPC does not block UI)', () => {
    expect(
      canRunImport({
        accessHydrated: true,
        hasAppAccess: false,
        creditBalance: 5,
      }),
    ).toBe(false);
    expect(
      canRunImport({
        accessHydrated: true,
        hasAppAccess: true,
        creditBalance: 0,
      }),
    ).toBe(false);
    expect(
      canRunImport({
        accessHydrated: false,
        hasAppAccess: true,
        creditBalance: 3,
      }),
    ).toBe(false);
    expect(
      canRunImport({
        accessHydrated: true,
        hasAppAccess: true,
        creditBalance: 1,
      }),
    ).toBe(true);
  });
});

/**
 * Offerings mapper: normalizes RevenueCat offerings into a UI-friendly plan list.
 * Handles missing offerings, single package, malformed metadata, and store unavailability.
 * Do not hardcode store prices here; use live data from RevenueCat. Fallback copy when load fails.
 */

import { PRODUCT_IDS, PACKAGE_IDENTIFIERS, type PlanType } from '../config';
import type { RevenueCatPackage } from './revenueCat';
import type { RawPurchasesPackage } from './revenueCat';

// -----------------------------------------------------------------------------
// UI-facing plan model
// -----------------------------------------------------------------------------

export interface SubscriptionPlan {
  /** Stable id for list keys (e.g. package identifier). */
  id: string;
  /** Plan interval: monthly or annual. */
  type: PlanType;
  /** Display label (e.g. "Monthly", "Annual"). */
  label: string;
  /** Price from store (e.g. "$9.99/mo"). Never hardcode; use live data. */
  priceString: string;
  /** True if this is the default recommended plan (e.g. annual when both exist). */
  isRecommended: boolean;
  /** True when annual is available among multiple packages; show "Best Value" badge. */
  isBestValue: boolean;
  /** Raw package to pass to purchasePackage(). */
  rawPackage: RawPurchasesPackage;
  /** Original RevenueCat package for compatibility (identifier, product, etc.). */
  displayPackage: RevenueCatPackage;
}

// -----------------------------------------------------------------------------
// Error / fallback model
// -----------------------------------------------------------------------------

export interface OfferingsLoadResultSuccess {
  kind: 'success';
  plans: SubscriptionPlan[];
  /** Recommended plan (first in list when sorted for display). */
  recommendedPlan: SubscriptionPlan | null;
}

export interface OfferingsLoadResultFallback {
  kind: 'fallback';
  /** User-facing message when offerings failed or store unavailable. */
  message: string;
  /** Short hint for retry action. */
  retryLabel: string;
  /** No plans to show; UI should show message + retry. */
  plans: [];
  recommendedPlan: null;
}

export type OfferingsLoadResult = OfferingsLoadResultSuccess | OfferingsLoadResultFallback;

/** Fallback copy when offerings fail to load. Use in paywall when result.kind === 'fallback'. */
export const OFFERINGS_FALLBACK_COPY = {
  message: 'Plans are temporarily unavailable. Check your connection or try again later.',
  retryLabel: 'Try again',
} as const;

/** Returns a fallback result for missing offerings, store errors, or empty list. */
export function getFallbackOfferingsResult(
  reason?: 'unavailable' | 'empty' | 'error' | 'missing_api_key' | 'sdk_not_configured' | 'web_not_supported'
): OfferingsLoadResultFallback {
  if (reason === 'empty') {
    return {
      kind: 'fallback',
      // This usually indicates an offering/package mismatch in RevenueCat (or no packages attached to the offering).
      message: 'No subscription plans found. Check RevenueCat offering configuration and try again.',
      retryLabel: 'Retry',
      plans: [],
      recommendedPlan: null,
    };
  }
  if (reason === 'missing_api_key') {
    return {
      kind: 'fallback',
      message:
        __DEV__
          ? 'Subscriptions are not configured in this build (missing RevenueCat key). Add EXPO_PUBLIC_REVENUECAT_API_KEY_IOS to your environment for production.'
          : 'Subscriptions are temporarily unavailable. Please try again later.',
      retryLabel: 'OK',
      plans: [],
      recommendedPlan: null,
    };
  }
  if (reason === 'sdk_not_configured') {
    return {
      kind: 'fallback',
      message:
        'Could not open the in-app store. Sign out and back in, update the app, or try again. If this persists, RevenueCat or the App Store may be unreachable.',
      retryLabel: 'Try again',
      plans: [],
      recommendedPlan: null,
    };
  }
  if (reason === 'web_not_supported') {
    return {
      kind: 'fallback',
      message: 'In-app subscriptions are available on the iOS app only.',
      retryLabel: 'OK',
      plans: [],
      recommendedPlan: null,
    };
  }
  if (reason === 'unavailable') {
    return {
      kind: 'fallback',
      message: 'Store is temporarily unavailable. Please try again.',
      retryLabel: 'Try again',
      plans: [],
      recommendedPlan: null,
    };
  }
  return {
    kind: 'fallback',
    message: OFFERINGS_FALLBACK_COPY.message,
    retryLabel: OFFERINGS_FALLBACK_COPY.retryLabel,
    plans: [],
    recommendedPlan: null,
  };
}

// -----------------------------------------------------------------------------
// Helpers: classify package type and validity
// -----------------------------------------------------------------------------

function normalizePlanType(pkg: RevenueCatPackage): PlanType {
  const id = (pkg.identifier ?? '').toLowerCase();
  const pt = (pkg.packageType ?? '').toLowerCase();
  const productId = (pkg.product?.identifier ?? '').toLowerCase();

  // Prefer canonical store product IDs from app config.
  if (productId === PRODUCT_IDS.annual.toLowerCase()) return 'annual';
  if (productId === PRODUCT_IDS.monthly.toLowerCase()) return 'monthly';

  if (
    id.includes('annual') ||
    id.includes('yearly') ||
    pt.includes('annual') ||
    pt.includes('yearly') ||
    id === PACKAGE_IDENTIFIERS.annual.toLowerCase()
  ) {
    return 'annual';
  }
  if (
    id.includes('monthly') ||
    pt.includes('monthly') ||
    id === PACKAGE_IDENTIFIERS.monthly.toLowerCase()
  ) {
    return 'monthly';
  }
  return 'monthly';
}

function isPackageValidForPurchase(pkg: RevenueCatPackage | null): pkg is RevenueCatPackage {
  if (!pkg || typeof pkg !== 'object') return false;
  if (!pkg.identifier || typeof pkg.identifier !== 'string') return false;
  if (!pkg.product || typeof pkg.product !== 'object') return false;
  if (typeof pkg.product.priceString !== 'string') return false;
  return true;
}

function planLabel(type: PlanType): string {
  return type === 'annual' ? 'Annual' : 'Monthly';
}

// -----------------------------------------------------------------------------
// Mapper: RevenueCat offering → UI plans
// -----------------------------------------------------------------------------

export interface MapOfferingsInput {
  /** Current offering from getOfferings() (mapped RevenueCat offering). */
  current: { identifier: string; availablePackages: RevenueCatPackage[] } | null;
  /** Raw packages in same order as availablePackages (for purchase). */
  rawCurrentPackages: RawPurchasesPackage[];
}

/**
 * Maps RevenueCat current offering + raw packages into UI plans.
 * - Filters out malformed packages (missing product, missing priceString).
 * - Identifies recommended plan: annual if both monthly and annual exist, else the only package.
 * - Sets isBestValue true for annual when both monthly and annual are available.
 * - Returns fallback result when no valid packages (missing offerings, only malformed, or empty).
 */
export function mapOfferingsToPlans(input: MapOfferingsInput): OfferingsLoadResult {
  const { current, rawCurrentPackages } = input;

  if (!current?.availablePackages?.length || !rawCurrentPackages?.length) {
    return getFallbackOfferingsResult('empty');
  }

  const packages = current.availablePackages;
  const raw = rawCurrentPackages;
  const validPlans: SubscriptionPlan[] = [];

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const rawPkg = raw[i];
    if (!isPackageValidForPurchase(pkg) || rawPkg == null) continue;

    const type = normalizePlanType(pkg);
    const label = planLabel(type);
    const priceString = pkg.product!.priceString;

    validPlans.push({
      id: pkg.identifier,
      type,
      label,
      priceString,
      isRecommended: false,
      isBestValue: false,
      rawPackage: rawPkg,
      displayPackage: pkg,
    });
  }

  if (validPlans.length === 0) {
    return getFallbackOfferingsResult('empty');
  }

  const hasAnnual = validPlans.some((p) => p.type === 'annual');
  const hasMonthly = validPlans.some((p) => p.type === 'monthly');
  const multiplePlans = validPlans.length > 1;

  const recommendedType: PlanType = hasAnnual && hasMonthly ? 'annual' : validPlans[0].type;
  const showBestValueForAnnual = multiplePlans && hasAnnual;

  const plans: SubscriptionPlan[] = validPlans.map((p) => ({
    ...p,
    isRecommended: p.type === recommendedType,
    isBestValue: p.type === 'annual' && showBestValueForAnnual,
  }));

  const recommendedPlan = plans.find((p) => p.isRecommended) ?? plans[0] ?? null;

  return {
    kind: 'success',
    plans,
    recommendedPlan,
  };
}

/**
 * Convenience: build MapOfferingsInput from SubscriptionContext offerings state.
 * Returns null if offerings are missing so caller can use getFallbackOfferingsResult().
 */
export function buildMapOfferingsInput(offerings: {
  current: { identifier: string; availablePackages: RevenueCatPackage[] } | null;
  rawCurrentPackages: RawPurchasesPackage[];
} | null): MapOfferingsInput | null {
  if (!offerings) return null;
  return {
    current: offerings.current,
    rawCurrentPackages: offerings.rawCurrentPackages ?? [],
  };
}

/**
 * Membership vs import credits — business rules (single place).
 *
 * **Entitlement-based access (Apple / RevenueCat)**  
 * Active `propfolio_pro` in RevenueCat reflects App Store subscription state. The app also mirrors
 * subscription into Supabase (`user_subscription_status`); `computeAppAccess` prefers the server row
 * and falls back to the store when the webhook has not run yet. This layer **never** looks at credit
 * balance — credits do not unlock the app.
 *
 * **Backend credit balance (Supabase)**  
 * `get_user_credit_state` / wallet `current_balance` is authoritative for **how many imports** the user
 * can perform. Credits are decremented on **successful** import (server RPC). The balance can be &gt; 0
 * while membership is inactive (wallet is preserved).
 *
 * **Signup bonus credits**  
 * Granted once (e.g. via `ensure_signup_credits_self` / server policy). Ledger reasons distinguish them
 * from purchases and from monthly grants. They add to the same spendable balance but are **not** “monthly included”.
 *
 * **Monthly included credits**  
 * One credit per **billing cycle** while membership is **active** (server + webhook). Shown in UI only when
 * `hasAppAccess` and server subscription shows `entitlement_active`; grant status comes from ledger vs period start.
 */

import type { CustomerInfoSummary } from '@/services/revenuecat/types';

import { hasPremiumAccess } from './entitlementLogic';

/** RevenueCat / StoreKit: active `propfolio_pro` only (does not include server mirror or credits). */
export function hasPropfolioProEntitlement(summary: CustomerInfoSummary): boolean {
  return hasPremiumAccess(summary);
}

/**
 * Active **membership** in product terms: user is allowed to use the app (portfolio, import flow entry, etc.).
 * Equals `SubscriptionContext.hasAppAccess` — derived from `computeAppAccess` (server + store), not credits.
 */
export function hasActiveMembership(hasAppAccess: boolean): boolean {
  return hasAppAccess;
}

/** User may use gated app surfaces: hydrated and membership active. */
export function canAccessApp(params: { accessHydrated: boolean; hasAppAccess: boolean }): boolean {
  return params.accessHydrated && params.hasAppAccess;
}

/** At least one spendable import credit in the server wallet. */
export function hasImportCredits(params: { creditBalance: number }): boolean {
  return params.creditBalance >= 1;
}

/**
 * Consumable credit **packs** may be purchased only with an active membership (StoreKit policy + product design).
 * Wallet balance may still display without membership; purchase UI should gate on this.
 */
export function canPurchaseCreditPacks(params: { hasAppAccess: boolean }): boolean {
  return params.hasAppAccess;
}

/** Import action: membership + at least one credit. Server enforces spend; UI does not block on wallet RPC. */
export function canRunImport(params: {
  accessHydrated: boolean;
  hasAppAccess: boolean;
  creditBalance: number;
}): boolean {
  if (!params.accessHydrated) {
    return false;
  }
  return params.hasAppAccess && hasImportCredits({ creditBalance: params.creditBalance });
}

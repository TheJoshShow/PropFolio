import type { CustomerInfo } from 'react-native-purchases';
import Purchases, { type PurchasesError } from 'react-native-purchases';

import { mapCustomerInfo } from './mapCustomerInfo';
import { REVENUECAT_SECRET_KEY_USER_MESSAGE } from './revenueCatKeyValidation';
import type { CustomerInfoSummary } from './types';

export type PurchaseFlowResult =
  | { outcome: 'purchased'; customerInfo: CustomerInfoSummary; raw: CustomerInfo }
  | { outcome: 'cancelled' }
  | { outcome: 'pending'; message: string }
  | { outcome: 'error'; message: string };

function isPurchasesError(e: unknown): e is PurchasesError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    typeof (e as PurchasesError).code === 'string'
  );
}

/** True for errors where a single delayed retry sometimes succeeds (flaky network / StoreKit). */
export function isTransientPurchasesTransportError(e: unknown): boolean {
  if (!isPurchasesError(e)) {
    return false;
  }
  return (
    e.code === Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR ||
    e.code === Purchases.PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR ||
    e.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR
  );
}

const STORE_TRANSPORT_USER_MESSAGE =
  'Could not reach Apple’s billing services. Check your internet connection, turn off VPNs or DNS/ad blockers if you use them, and confirm you are signed in under Settings → Media & Purchases (or App Store). Then try again.';

export function interpretPurchaseError(e: unknown): PurchaseFlowResult {
  if (isPurchasesError(e)) {
    const combined = `${e.message ?? ''} ${'underlyingErrorMessage' in e && typeof (e as { underlyingErrorMessage?: string }).underlyingErrorMessage === 'string' ? (e as { underlyingErrorMessage: string }).underlyingErrorMessage : ''}`.toLowerCase();
    if (combined.includes('7243') || combined.includes('secret api key')) {
      return { outcome: 'error', message: REVENUECAT_SECRET_KEY_USER_MESSAGE };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { outcome: 'cancelled' };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return {
        outcome: 'pending',
        message:
          'Your payment is pending approval (e.g. Ask to Buy). You will gain access when the store completes it.',
      };
    }
    if (
      e.code === Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR ||
      e.code === Purchases.PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
    ) {
      return {
        outcome: 'error',
        message: STORE_TRANSPORT_USER_MESSAGE,
      };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_REQUEST_TIMED_OUT_ERROR) {
      return {
        outcome: 'error',
        message:
          'The App Store took too long to respond. Check your connection, wait a moment, and try again.',
      };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.API_ENDPOINT_BLOCKED) {
      return {
        outcome: 'error',
        message:
          'A network filter may be blocking billing (VPN, firewall, or ad blocker). Try another network or disable the filter briefly, then try again.',
      };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
      return {
        outcome: 'error',
        message: 'The App Store could not complete the purchase. Try again later.',
      };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
      return {
        outcome: 'error',
        message: 'That product is not available for purchase right now.',
      };
    }
    if (e.code === Purchases.PURCHASES_ERROR_CODE.CONFIGURATION_ERROR) {
      return {
        outcome: 'error',
        message: 'Store configuration error. Confirm RevenueCat and App Store product setup.',
      };
    }
    return {
      outcome: 'error',
      message: e.message || 'Purchase could not be completed.',
    };
  }
  if (e instanceof Error) {
    return { outcome: 'error', message: e.message };
  }
  return { outcome: 'error', message: 'Purchase could not be completed.' };
}

export function successFromCustomerInfo(raw: CustomerInfo): PurchaseFlowResult {
  return {
    outcome: 'purchased',
    customerInfo: mapCustomerInfo(raw),
    raw,
  };
}

import type { CustomerInfo } from 'react-native-purchases';
import Purchases, { type PurchasesError } from 'react-native-purchases';

import { mapCustomerInfo } from './mapCustomerInfo';
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

export function interpretPurchaseError(e: unknown): PurchaseFlowResult {
  if (isPurchasesError(e)) {
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
        message: 'Network error talking to the App Store. Check your connection and try again.',
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

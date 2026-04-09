/**
 * Stub for unit tests — real billing runs only in iOS/Android dev/production builds.
 */
export const PURCHASES_ERROR_CODE = {
  PURCHASE_CANCELLED_ERROR: '1',
  PAYMENT_PENDING_ERROR: '20',
  NETWORK_ERROR: '10',
  OFFLINE_CONNECTION_ERROR: '35',
  STORE_PROBLEM_ERROR: '2',
  PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: '5',
  CONFIGURATION_ERROR: '23',
  PRODUCT_REQUEST_TIMED_OUT_ERROR: '32',
  API_ENDPOINT_BLOCKED: '33',
} as const;

export type CustomerInfo = Record<string, unknown>;
export type PurchasesError = { code: string; message: string };

export default class Purchases {
  static PURCHASES_ERROR_CODE = PURCHASES_ERROR_CODE;
  static LOG_LEVEL = { DEBUG: 'DEBUG', WARN: 'WARN', INFO: 'INFO', ERROR: 'ERROR' };
  static PACKAGE_TYPE = { MONTHLY: 'MONTHLY' };
  static configure() {}
  static setLogLevel() {}
  static addCustomerInfoUpdateListener() {}
  static removeCustomerInfoUpdateListener() {
    return true;
  }
  static async logIn() {
    return { customerInfo: await Purchases.getCustomerInfo(), created: false };
  }
  static async logOut() {
    return Purchases.getCustomerInfo();
  }
  static async getCustomerInfo() {
    return {
      entitlements: { active: {}, all: {} },
      subscriptionsByProductIdentifier: {},
      managementURL: null,
      nonSubscriptionTransactions: [],
    };
  }
  static async getOfferings() {
    return { current: null, all: {} };
  }
  static async purchasePackage() {
    return { customerInfo: await Purchases.getCustomerInfo(), storeTransaction: null };
  }
  static async syncPurchases() {
    return { customerInfo: await Purchases.getCustomerInfo() };
  }
  static async invalidateCustomerInfoCache() {}
  static async getAppUserID() {
    return 'test';
  }
}

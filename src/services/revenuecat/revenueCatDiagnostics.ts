import { summarizeRevenueCatKey } from './revenueCatKeyValidation';

/**
 * Structured, dev-only logs for RevenueCat. Never pass full API keys or tokens.
 */
export const rcDiag = {
  log(event: string, data?: Record<string, unknown>): void {
    if (!__DEV__) {
      return;
    }
    if (data && Object.keys(data).length > 0) {
      console.log(`[PropFolio/RevenueCat] ${event}`, data);
    } else {
      console.log(`[PropFolio/RevenueCat] ${event}`);
    }
  },

  keyPresence(platform: 'ios' | 'android', key: string | null | undefined): void {
    if (!__DEV__) {
      return;
    }
    this.log('api_key.summary', { platform, key: summarizeRevenueCatKey(key) });
  },

  initResult(ok: boolean, detail?: string): void {
    if (ok) {
      if (__DEV__) {
        this.log('sdk.configure.ok');
      }
      return;
    }
    const d = detail ?? '(unknown)';
    if (__DEV__) {
      this.log('sdk.configure.fail', { detail: d });
    } else {
      console.warn('[PropFolio/RevenueCat] sdk.configure.fail', d.slice(0, 240));
    }
  },

  /** Invalid or missing public SDK key (never logs full key). */
  keyValidationFailed(platform: 'ios' | 'android', code: string, keySummary: string): void {
    const line = `[PropFolio/RevenueCat] api_key.invalid code=${code} platform=${platform} key=${keySummary}`;
    if (__DEV__) {
      console.log(line);
    } else {
      console.warn(line);
    }
  },

  configureAttemptFailed(message: string, reasonCode?: string): void {
    const detail = message.slice(0, 240);
    const line = `[PropFolio/RevenueCat] configure.attempt_failed reason=${reasonCode ?? 'unknown'} detail=${detail}`;
    if (__DEV__) {
      console.log(line);
    } else {
      console.warn(line);
    }
  },

  offeringsResult(input: {
    currentOfferingId: string | null;
    allOfferingIds: string[];
    subscriptionOfferingId: string;
    subscriptionPackageCount: number;
    creditsOfferingId: string;
    creditPackageCount: number;
    error?: string;
  }): void {
    if (__DEV__) {
      this.log('offerings.result', { ...input });
      return;
    }
    if (input.error) {
      console.warn('[PropFolio/RevenueCat] offerings.result', {
        phase: input.error,
        offeringIds: input.allOfferingIds,
        subscriptionPackages: input.subscriptionPackageCount,
        creditPackages: input.creditPackageCount,
      });
    }
  },

  customerInfoSummary(input: {
    status: string;
    entitlementKeys: string[];
    premiumProductId?: string | null;
  }): void {
    if (!__DEV__) {
      return;
    }
    this.log('customerInfo.summary', input);
  },

  purchaseFlow(step: string, extra?: Record<string, unknown>): void {
    if (!__DEV__) {
      return;
    }
    this.log(`purchase.${step}`, extra);
  },

  restoreFlow(step: string, extra?: Record<string, unknown>): void {
    if (!__DEV__) {
      return;
    }
    this.log(`restore.${step}`, extra);
  },
};

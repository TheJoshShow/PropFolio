/**
 * Paywall copy: headline, subheadline, benefits, and footer.
 * Used when paywall is shown (e.g. after hitting free import limit).
 * Footer is App Store compliant; iOS-only (Apple ID). No investment guarantees.
 * Benefits reflect live in-app deal/confidence scoring (no "coming soon").
 */

export const PAYWALL_COPY = {
  headline: 'Unlock unlimited property analysis',
  subheadline:
    "You've used your 2 free imports. Upgrade to continue saving properties and unlock unlimited imports.",
  benefits: [
    'Unlimited property imports',
    'Deal and confidence scores on every property in your portfolio',
    'Deeper factor breakdown and score explanations (Pro)',
    'Save and compare properties; scores are for informational use only',
  ] as const,
  /** Legal/support footer (iOS). Payment charged to Apple ID; renewal and cancellation in device settings. */
  footer:
    'Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your device settings.',
  restoreLabel: 'Restore purchases',
  restoringLabel: 'Restoring…',
  doneLabel: 'Done',
  subscribeLabel: 'Subscribe',
  tryAgainLabel: 'Try again',
  retryLabel: 'Retry',
  loadingPlansLabel: 'Loading plans…',
  /** Shown while verifying entitlement after purchase. */
  activatingLabel: 'Activating your subscription…',
  /** Shown when entitlement is delayed (timeout); user can close. */
  entitlementDelayedMessage:
    'Your subscription is activating. You can close this screen—Pro access will appear shortly.',
  closeLabel: 'Close',
  /** Already Pro state */
  alreadyProTitle: 'You have Pro',
  alreadyProSubtitle: 'You have full access. Manage your subscription in your device settings.',
  /** Web: no IAP (kept for type; app is iOS-only) */
  webTitle: 'Pro subscription',
  webSubtitle: 'In-app subscriptions are available in the PropFolio app.',
  /** Compliant upsell for property-detail premium sections (e.g. factor breakdown). Do not imply guaranteed returns. */
  premiumUnlockLine:
    'Unlock factor breakdown and score details with Pro. Analysis is for informational use only; verify key assumptions locally.',
} as const;

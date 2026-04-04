/**
 * Official product copy. Reference prices match intended SKUs; Apple shows the charge at purchase.
 */
export const BILLING_COPY = {
  paywallTitle: 'PropFolio membership',
  paywallSubtitle:
    'Membership unlocks the app. Import credits are separate—each successful import uses 1 credit, tracked on our servers.',

  subscriptionHeadline: 'PropFolio membership',
  subscriptionTagline: 'First month free, then $1.99/month',
  subscriptionDetail:
    'Your first month is free; after that you pay $1.99/month through Apple. Pricing and promotions follow App Store rules for your account and region.',

  priceAfterFreeMonthHint: 'After your free month, membership is $1.99/mo—Apple shows your exact price.',

  creditsHeadline: 'Import credits',
  /** 2 bonus + 1 first-cycle included — official breakdown */
  signupCredits:
    '3 credits right after signup: 2 signup bonus credits, plus 1 included credit for your first billing cycle.',
  cycleCredits: 'Each month after that includes 1 import credit while your membership stays active.',
  topUpIntro:
    'Extra imports are sold in packs only while you have an active membership. Apple shows the exact price at checkout.',

  /** Reference SKUs — App Store Connect / RevenueCat product IDs must match. */
  packReference: [
    { credits: 1, referencePrice: '$1.99' },
    { credits: 5, referencePrice: '$8.99' },
    { credits: 10, referencePrice: '$14.99' },
    { credits: 20, referencePrice: '$19.99' },
  ] as const,

  packLadderShort: '1 @ $1.99 · 5 @ $8.99 · 10 @ $14.99 · 20 @ $19.99',

  walletTitle: 'Credit wallet',
  subscriptionAccessTitle: 'Membership',
  includedThisPeriod: {
    granted: 'This cycle’s included credit: added',
    pending: 'This cycle’s included credit: processing (usually right after Apple renews your membership)',
    unknown: 'This cycle’s included credit: —',
    notSubscribed: 'The monthly included credit applies only with an active membership.',
  },

  lifetimeUsed: (n: number) => `Lifetime successful imports: ${n}`,

  importUsesOne: 'Each import uses 1 credit.',
  importRemaining: (current: number, after: number) =>
    `You have ${current} now; ${after} will remain after a successful import.`,

  importNoCreditsTitle: 'No credits left',
  importNoCreditsBody:
    'Membership stays active, but imports still need credits. Buy a pack to add more, or wait for your next monthly included credit.',

  importCreditsPaywallBody:
    'Membership opens the app; imports still cost credits. Buy packs when you need more—only while your membership is active.',

  legalNote: 'Membership renews monthly until you cancel in Apple ID settings. See Privacy Policy and Terms of Service.',

  restore: 'Restore purchases',
  buyCreditsCta: 'Buy credits',
  viewPlansCta: 'Membership',

  /** Shown when StoreKit / catalog is not ready (developer setup). */
  catalogSetupHint:
    'Products not loaded. In App Store Connect and RevenueCat, wire the monthly membership and credit SKUs, then rebuild.',
} as const;

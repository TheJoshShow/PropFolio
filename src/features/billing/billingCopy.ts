/**
 * Official product copy. Reference prices match intended SKUs; Apple shows the charge at purchase.
 */
export const BILLING_COPY = {
  paywallTitle: 'PropFolio membership',
  paywallSubtitle: 'Manage your membership and available import credits.',

  subscriptionHeadline: 'PropFolio membership',
  subscriptionTagline: 'First month free, then $1.99/month',
  subscriptionDetail:
    'Your first month is free; after that you pay $1.99/month through Apple. Pricing and promotions follow App Store rules for your account and region.',

  /** Shown on the paywall membership product card (streamlined; Apple still shows live price). */
  paywallSubscriptionIncludesMonthlyImport: 'Includes 1 import per month',

  priceAfterFreeMonthHint: 'After your free month, membership is $1.99/mo—Apple shows your exact price.',

  creditsHeadline: 'Import credits',
  /** Signup bonus is separate from the per-cycle monthly included credit (server ledger reasons differ). */
  signupCredits:
    'Right after signup you get 3 import credits: 2 signup bonus credits (one-time) plus 1 credit for your first membership billing period.',
  cycleCredits:
    'Each new billing period while your membership is active includes 1 import credit (separate from signup bonus or purchased packs).',

  /** Reference SKUs — App Store Connect / RevenueCat product IDs must match. */
  packReference: [
    { credits: 1, referencePrice: '$1.99' },
    { credits: 5, referencePrice: '$8.99' },
    { credits: 10, referencePrice: '$14.99' },
    { credits: 20, referencePrice: '$19.99' },
  ] as const,

  walletTitle: 'Credit wallet',
  subscriptionAccessTitle: 'Membership',
  /** Settings → Membership: short label above Active/Inactive (from `hasAppAccess`). */
  membershipStatusLabel: 'Status',
  includedThisPeriod: {
    granted: 'This cycle’s included credit: added',
    pending: 'This cycle’s included credit: processing (usually right after Apple renews your membership)',
    unknown: 'This cycle’s included credit: —',
    notSubscribed: 'Your monthly included credit is available only while your membership is active.',
  },

  /** Paywall wallet card when user is not a member */
  paywallWalletMembershipStatus: 'Membership required',
  paywallWalletMembershipHint: 'Subscribe below to access PropFolio.',

  lifetimeUsed: (n: number) => `Lifetime successful imports: ${n}`,

  importNoCreditsTitle: 'No credits left',
  importNoCreditsBody:
    'Membership stays active, but imports still need credits. Buy a pack to add more, or wait for your next monthly included credit.',

  importCreditsPaywallBody:
    'Use import credits from your wallet. Credit packs are available with an active membership.',
  importCreditsPaywallBodySecond:
    'Unused credits stay on your account for future use if you subscribe again.',

  legalNote: 'Membership renews monthly until you cancel in Apple ID settings. See Privacy Policy and Terms of Service.',

  /** Paywall “How billing works” card (shown uppercase in UI). */
  paywallHowBillingWorksTitle: 'HOW BILLING WORKS',
  paywallHowBillingWorksMembershipLine: 'Membership: First month free, then $1.99/month.',
  paywallHowBillingWorksCreditsLine:
    'Credits: Includes 1 import per month with membership. Need more? Buy extra imports anytime: 1 @ $1.99 • 5 @ $8.99 • 10 @ $14.99 • 20 @ $19.99',

  paywallExtraCreditsPrefix: 'Extra credits: ',
  paywallExtraCreditsAppleNote: ' — Apple charges the live price at purchase.',

  /** Gated home + paywall section header */
  startMembershipCta: 'Start membership',

  /** Settings → Subscription explainer (second paragraph under How you pay) */
  settingsMembershipCreditsAccessClarifier:
    'Membership unlocks the app; imports still cost credits. No membership means no access—even if credits remain.',
  settingsHowYouPayTitle: 'How you pay',

  /** Credit top-up screen */
  creditTopUpTitle: 'Credits',
  creditBalanceLabel: 'Your balance',
  creditChoosePackSection: 'Choose a pack',
  creditPackUnavailableFromStore:
    'This pack isn’t available from Apple yet. Pull to refresh after your team finishes store setup.',
  creditBalanceAvailable: (n: number) => `${n} available`,
  /** Paywall CTA → credit top-up route */
  paywallBuyCreditPacksCta: 'Buy credit packs',

  restore: 'Restore purchases',
  buyCreditsCta: 'Buy credits',
  viewPlansCta: 'Membership',

  /** Shown when StoreKit / catalog is not ready (developer setup). */
  catalogSetupHint:
    'Products not loaded. In App Store Connect and RevenueCat, wire the monthly membership and credit SKUs, then rebuild.',

  /** RevenueCat responded but returned zero offerings (dashboard not published or new project). */
  catalogRcOfferingsEmpty:
    'RevenueCat returned no offerings. In RevenueCat: create offerings, attach your App Store products, set a current offering, then pull to refresh.',

  /** Expo Go / web — purchases unsupported. */
  purchasesRequireNativeBuild:
    'In-app purchases require an iOS development build or TestFlight. Expo Go cannot load store products.',

  /** Credits offering missing (membership may still work). */
  creditsOfferingMissingHint:
    'Credit packs were not found in RevenueCat. Check the credits offering id and attached consumable products.',

  /** Credit top-up when user has a wallet but no active membership (purchase still blocked in Store flow). */
  creditPacksRequireMembership:
    'Import credit packs can be purchased only with an active membership. Your wallet balance stays on your account for when you subscribe again.',

  /** Create Account screen — compact benefits (marketing; server grants may differ). */
  createAccountMembershipIncludesTitle: 'Membership includes',
  createAccountMembershipBullets: ['$1.99/month', '1 free import every month', 'Buy extra imports anytime'] as const,
  createAccountLimitedOfferTitle: 'Limited-time offer',
  createAccountLimitedOfferBullets: ['Your first month is free', 'Includes 2 bonus import credits'] as const,
} as const;

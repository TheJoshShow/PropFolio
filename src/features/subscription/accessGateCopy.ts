import type { AppAccessDisplayState } from '@/services/subscription/computeAppAccess';

/** Full-screen gated experience (and short subtitles in settings when locked). */
export function accessRestrictedTitle(state: AppAccessDisplayState): string {
  switch (state) {
    case 'loading':
      return 'Checking membership';
    case 'unknown':
      return 'Could not verify membership';
    case 'billing_issue':
      return 'Update your payment method';
    case 'expired':
      return 'Membership inactive';
    case 'active_trial':
    case 'active_paid':
    case 'grace_period':
      return 'PropFolio';
    default:
      return 'Membership required';
  }
}

export function accessRestrictedBody(state: AppAccessDisplayState): string {
  switch (state) {
    case 'loading':
      return 'We are confirming your membership with PropFolio and Apple. This usually takes a moment.';
    case 'unknown':
      return 'We could not confirm an active membership. Check your connection, tap Restore purchases, or subscribe. Import credits do not unlock the app by themselves.';
    case 'billing_issue':
      return 'Your membership has a billing issue. Update payment in the App Store to restore access. Portfolio and imports stay locked until then—even if you still have credits.';
    case 'expired':
      return 'Your membership ended. Import credits stay in your wallet for when you join again. Subscribe to keep using PropFolio.';
    default:
      return 'PropFolio is $1.99/month after a free first month (handled by Apple). Subscribe for membership; credits are sold separately and require an active membership.';
  }
}

/** Shown under tier label on Settings when user is gated or hydrating. */
export function settingsAccessSubtitle(state: AppAccessDisplayState, hasAppAccess: boolean): string {
  if (!hasAppAccess) {
    if (state === 'unknown') {
      return 'We could not verify your membership.';
    }
    if (state === 'billing_issue') {
      return 'Fix billing in the App Store to restore access.';
    }
    if (state === 'expired') {
      return 'Subscribe to unlock PropFolio.';
    }
    return 'Membership required — $1.99/mo after a free first month.';
  }
  if (state === 'grace_period') {
    return 'Grace period — renew soon to keep access.';
  }
  if (state === 'active_trial') {
    return 'Free first month active — full access.';
  }
  return '';
}

/** Headline for active access states (optional banners). */
export function activeAccessHeadline(state: AppAccessDisplayState): string {
  switch (state) {
    case 'active_trial':
      return 'Free first month';
    case 'grace_period':
      return 'Grace period';
    case 'active_paid':
      return 'Membership active';
    default:
      return '';
  }
}

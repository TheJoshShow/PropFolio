import type { UserCreditStateRpc } from '@/services/credits/creditWalletService';

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function renewalOrTrialLine(
  subscription: UserCreditStateRpc['subscription'] | undefined | null,
): string | null {
  if (!subscription || typeof subscription !== 'object') {
    return null;
  }
  const sub = subscription as Record<string, unknown>;
  const trialEnd = sub.trial_end_at;
  if (typeof trialEnd === 'string' && trialEnd.trim()) {
    return `Free first month ends ${formatShortDate(trialEnd)}`;
  }
  const periodEnd = sub.current_period_end;
  if (typeof periodEnd === 'string' && periodEnd.trim()) {
    return `Renews ${formatShortDate(periodEnd)}`;
  }
  return null;
}

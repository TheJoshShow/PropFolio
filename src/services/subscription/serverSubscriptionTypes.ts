/** Row from `public.user_subscription_status` (RevenueCat webhook mirror). */
export type UserSubscriptionStatusRow = {
  user_id: string;
  entitlement_active: boolean;
  entitlement_source: string | null;
  billing_issue_detected: boolean;
  product_id: string | null;
  trial_start_at: string | null;
  trial_end_at: string | null;
  current_period_end: string | null;
  expires_at: string | null;
  will_renew: boolean | null;
  updated_at: string;
};

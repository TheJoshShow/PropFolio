/**
 * RevenueCat webhook payload (subset + index signature for forward compatibility).
 * @see https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 */
export type RcWebhookEvent = {
  id?: string;
  type?: string;
  event_timestamp_ms?: number;
  app_id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  entitlement_ids?: string[] | null;
  entitlement_id?: string | null;
  period_type?: string | null;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  auto_resume_at_ms?: number | null;
  environment?: string | null;
  store?: string | null;
  transaction_id?: string | null;
  original_transaction_id?: string | null;
  is_family_share?: boolean | null;
  cancel_reason?: string | null;
  expiration_reason?: string | null;
  is_trial_conversion?: boolean | null;
  presented_offering_id?: string | null;
  new_product_id?: string | null;
  transferred_from?: string[] | null;
  transferred_to?: string[] | null;
  price?: number | null;
  currency?: string | null;
  renewal_number?: number | null;
  [key: string]: unknown;
};

export type RcWebhookBody = {
  api_version?: string;
  event?: RcWebhookEvent;
};

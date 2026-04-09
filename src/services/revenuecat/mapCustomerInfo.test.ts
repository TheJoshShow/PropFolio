import { describe, expect, it } from 'vitest';

import { mapUnknownCustomerInfo } from './mapCustomerInfo';
import { REVENUECAT_SECRET_KEY_USER_MESSAGE } from './revenueCatKeyValidation';

describe('mapUnknownCustomerInfo', () => {
  it('normalizes 7243 errors for display', () => {
    const s = mapUnknownCustomerInfo('Secret API keys should not be used in your app. (7243)');
    expect(s.status).toBe('unknown');
    expect(s.lastStoreError).toBe(REVENUECAT_SECRET_KEY_USER_MESSAGE);
  });
});

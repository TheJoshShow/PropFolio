import { isEntitlementBootstrapPending } from '../entitlementPolicy';

describe('isEntitlementBootstrapPending', () => {
  it('is false without session', () => {
    expect(
      isEntitlementBootstrapPending({
        sessionUserId: undefined,
        subscriptionLoading: true,
        customerInfoPresent: false,
        cachePresent: false,
      })
    ).toBe(false);
  });

  it('is false when not loading', () => {
    expect(
      isEntitlementBootstrapPending({
        sessionUserId: 'u1',
        subscriptionLoading: false,
        customerInfoPresent: false,
        cachePresent: false,
      })
    ).toBe(false);
  });

  it('is false when customerInfo exists', () => {
    expect(
      isEntitlementBootstrapPending({
        sessionUserId: 'u1',
        subscriptionLoading: true,
        customerInfoPresent: true,
        cachePresent: false,
      })
    ).toBe(false);
  });

  it('is false when cache exists', () => {
    expect(
      isEntitlementBootstrapPending({
        sessionUserId: 'u1',
        subscriptionLoading: true,
        customerInfoPresent: false,
        cachePresent: true,
      })
    ).toBe(false);
  });

  it('is true when signed in, loading, and no signal yet', () => {
    expect(
      isEntitlementBootstrapPending({
        sessionUserId: 'u1',
        subscriptionLoading: true,
        customerInfoPresent: false,
        cachePresent: false,
      })
    ).toBe(true);
  });
});

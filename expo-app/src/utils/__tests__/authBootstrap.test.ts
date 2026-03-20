import { shouldTrustSessionWithoutUserFetch } from '../authBootstrap';

describe('shouldTrustSessionWithoutUserFetch', () => {
  it('trusts TOKEN_REFRESHED only', () => {
    expect(shouldTrustSessionWithoutUserFetch('TOKEN_REFRESHED')).toBe(true);
    expect(shouldTrustSessionWithoutUserFetch('INITIAL_SESSION')).toBe(false);
    expect(shouldTrustSessionWithoutUserFetch('SIGNED_IN')).toBe(false);
    expect(shouldTrustSessionWithoutUserFetch('GET_SESSION_BOOTSTRAP')).toBe(false);
  });
});

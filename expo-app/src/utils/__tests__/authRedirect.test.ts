import { isAuthCallbackUrl, parseAuthCallbackParams } from '../authRedirect';

describe('parseAuthCallbackParams', () => {
  it('merges hash and query; search overrides hash', () => {
    const p = parseAuthCallbackParams('propfolio://auth/callback?code=fromquery#access_token=old');
    expect(p.code).toBe('fromquery');
    expect(p.access_token).toBe('old');
  });
});

describe('isAuthCallbackUrl', () => {
  it('matches native propfolio callback with token', () => {
    expect(
      isAuthCallbackUrl('propfolio://auth/callback#access_token=abc&refresh_token=def')
    ).toBe(true);
  });

  it('matches PKCE code on native callback (no access_token)', () => {
    expect(isAuthCallbackUrl('propfolio://auth/callback?code=pkce_auth_code')).toBe(true);
  });

  it('matches bare propfolio scheme with hash token (no path)', () => {
    expect(isAuthCallbackUrl('propfolio://#access_token=abc')).toBe(true);
  });

  it('matches OAuth error redirect on callback path', () => {
    expect(
      isAuthCallbackUrl('propfolio://auth/callback?error=access_denied&error_description=cancelled')
    ).toBe(true);
  });

  it('rejects token without auth callback path', () => {
    expect(isAuthCallbackUrl('https://evil.example/steal?access_token=secret')).toBe(false);
  });

  it('matches https auth callback path with token', () => {
    expect(
      isAuthCallbackUrl('https://app.example.com/auth/callback#access_token=abc')
    ).toBe(true);
  });

  it('rejects empty or missing token', () => {
    expect(isAuthCallbackUrl('')).toBe(false);
    expect(isAuthCallbackUrl('propfolio://auth/callback')).toBe(false);
  });
});

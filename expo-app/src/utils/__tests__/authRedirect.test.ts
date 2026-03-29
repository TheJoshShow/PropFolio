import { isEmailAuthCallbackUrl, parseEmailAuthCallbackParams } from '../authRedirect';

describe('parseEmailAuthCallbackParams', () => {
  it('merges hash and query; search overrides hash', () => {
    const p = parseEmailAuthCallbackParams('propfolio://auth/callback?code=fromquery#access_token=old');
    expect(p.code).toBe('fromquery');
    expect(p.access_token).toBe('old');
  });
});

describe('isEmailAuthCallbackUrl', () => {
  it('matches native propfolio callback with PKCE code', () => {
    expect(isEmailAuthCallbackUrl('propfolio://auth/callback?code=pkce_auth_code')).toBe(true);
  });

  it('matches native callback with code in hash', () => {
    expect(isEmailAuthCallbackUrl('propfolio://auth/callback#code=from_hash')).toBe(true);
  });

  it('rejects callback path with only access_token (implicit / legacy; not used for MVP email auth)', () => {
    expect(
      isEmailAuthCallbackUrl('propfolio://auth/callback#access_token=abc&refresh_token=def')
    ).toBe(false);
  });

  it('rejects bare propfolio scheme with hash tokens (no auth/callback path)', () => {
    expect(isEmailAuthCallbackUrl('propfolio://#access_token=abc')).toBe(false);
  });

  it('matches error redirect on callback path', () => {
    expect(
      isEmailAuthCallbackUrl('propfolio://auth/callback?error=access_denied&error_description=cancelled')
    ).toBe(true);
  });

  it('rejects token without auth callback path', () => {
    expect(isEmailAuthCallbackUrl('https://evil.example/steal?access_token=secret')).toBe(false);
  });

  it('matches https auth callback path with PKCE code', () => {
    expect(isEmailAuthCallbackUrl('https://app.example.com/auth/callback?code=abc')).toBe(true);
  });

  it('rejects https callback path with only fragment token', () => {
    expect(isEmailAuthCallbackUrl('https://app.example.com/auth/callback#access_token=abc')).toBe(false);
  });

  it('rejects empty or missing payload', () => {
    expect(isEmailAuthCallbackUrl('')).toBe(false);
    expect(isEmailAuthCallbackUrl('propfolio://auth/callback')).toBe(false);
  });
});

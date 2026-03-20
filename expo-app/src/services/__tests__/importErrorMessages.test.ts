import { messageForAccountSetupFailure, IMPORT_USER_MESSAGES } from '../importErrorMessages';

describe('messageForAccountSetupFailure', () => {
  it('maps JWT expired', () => {
    const r = messageForAccountSetupFailure({ rawMessage: 'JWT expired', code: 'PGRST301' });
    expect(r.userMessage).toBe(IMPORT_USER_MESSAGES.sessionExpired);
    expect(r.kind).toBe('session');
  });

  it('maps RLS to temporary import failure', () => {
    const r = messageForAccountSetupFailure({
      rawMessage: 'new row violates row-level security policy',
    });
    expect(r.userMessage).toBe(IMPORT_USER_MESSAGES.importTemporaryFailure);
    expect(r.kind).toBe('account');
  });

  it('maps unknown column to temporary', () => {
    const r = messageForAccountSetupFailure({
      rawMessage: 'column "foo" does not exist',
    });
    expect(r.userMessage).toBe(IMPORT_USER_MESSAGES.importTemporaryFailure);
  });
});

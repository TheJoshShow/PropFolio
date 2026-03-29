import { ProfileSetupError, SignupIncompleteResponseError } from '../../auth/authFlowErrors';
import { getAuthErrorMessage, getEmailLinkCallbackErrorMessage, isValidEmail } from '../authErrors';

describe('getAuthErrorMessage', () => {
  it('maps invalid credentials for signIn', () => {
    expect(getAuthErrorMessage({ message: 'Invalid login credentials', code: 'invalid_credentials' }, 'signIn')).toBe(
      'Incorrect email or password.'
    );
  });

  it('maps duplicate email for signUp', () => {
    expect(
      getAuthErrorMessage({ message: 'User already registered', code: 'user_already_registered' }, 'signUp')
    ).toBe('This email is already in use. Sign in or use a different email.');
  });

  it('maps email_exists code from GoTrue', () => {
    expect(getAuthErrorMessage({ message: 'Email already registered', code: 'email_exists' }, 'signUp')).toBe(
      'This email is already in use. Sign in or use a different email.'
    );
  });

  it('maps redirect URL validation for signUp', () => {
    expect(
      getAuthErrorMessage(
        { message: 'redirect url is not allowed', code: 'validation_failed' },
        'signUp'
      )
    ).toContain('redirect URL');
  });

  it('maps AuthWeakPasswordError by name', () => {
    const err = { name: 'AuthWeakPasswordError', message: 'weak', reasons: ['pwned'] };
    expect(getAuthErrorMessage(err, 'signUp')).toContain('stronger password');
  });

  it('maps ProfileSetupError', () => {
    expect(getAuthErrorMessage(new ProfileSetupError(), 'signUp')).toContain('finish setup');
  });

  it('maps ProfileSetupError rls kind', () => {
    expect(getAuthErrorMessage(new ProfileSetupError('rls_or_permission'), 'signUp')).toContain('permissions');
  });

  it('maps SignupIncompleteResponseError', () => {
    expect(getAuthErrorMessage(new SignupIncompleteResponseError(), 'signUp')).toContain('finish creating');
  });

  it('maps user_not_found for signIn when exposed', () => {
    expect(getAuthErrorMessage({ code: 'user_not_found', message: 'not found' }, 'signIn')).toBe(
      'No account found for this email. Check the spelling or create an account.'
    );
  });

  it('maps network errors', () => {
    expect(getAuthErrorMessage({ message: 'Network request failed', status: 0 }, 'signIn')).toBe(
      'Network error. Check your connection and try again.'
    );
  });

  it('does not surface provider-specific OAuth wording', () => {
    const msg = getAuthErrorMessage({ message: 'Something failed', code: 'unknown' }, 'signIn');
    expect(msg.toLowerCase()).not.toContain('provider');
    expect(msg.toLowerCase()).not.toContain('google');
    expect(msg.toLowerCase()).not.toContain('apple');
  });

  it('uses generic reset copy for resetPassword context', () => {
    expect(getAuthErrorMessage({ message: 'Error', code: 'x' }, 'resetPassword')).toBe(
      'Could not send the reset link. Check the email address and try again.'
    );
  });
});

describe('getEmailLinkCallbackErrorMessage', () => {
  it('returns null when no error params', () => {
    expect(getEmailLinkCallbackErrorMessage({})).toBeNull();
  });

  it('maps access_denied without provider copy', () => {
    const m = getEmailLinkCallbackErrorMessage({ error: 'access_denied' });
    expect(m).toBeTruthy();
    expect(m!.toLowerCase()).not.toContain('provider');
  });
});

describe('isValidEmail', () => {
  it('rejects obviously invalid addresses used in sign-up validation', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('a@b.co')).toBe(true);
  });
});

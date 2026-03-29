import { validateSignUpForm } from '../signupValidation';

const base = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password1',
  confirmPassword: 'password1',
};

describe('validateSignUpForm', () => {
  it('accepts a valid form', () => {
    const { ok, errors } = validateSignUpForm(base, true);
    expect(ok).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('requires names when showRequired', () => {
    const { ok, errors } = validateSignUpForm({ ...base, firstName: '' }, true);
    expect(ok).toBe(false);
    expect(errors.firstName).toBeTruthy();
  });

  it('flags password mismatch', () => {
    const { ok, errors } = validateSignUpForm({ ...base, confirmPassword: 'other' }, true);
    expect(ok).toBe(false);
    expect(errors.confirmPassword).toBeTruthy();
  });

  it('flags short password when typed', () => {
    const { ok, errors } = validateSignUpForm({ ...base, password: 'short', confirmPassword: 'short' }, false);
    expect(ok).toBe(false);
    expect(errors.password).toBeTruthy();
  });

  it('does not show empty-field errors until showRequired', () => {
    const { errors } = validateSignUpForm(
      { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
      false
    );
    expect(errors.firstName).toBeUndefined();
  });
});

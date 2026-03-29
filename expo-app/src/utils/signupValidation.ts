/**
 * Sign-up form validation (pure). Used by the create-account screen and tests.
 */

import { getPasswordRequirementMessage, isPasswordLongEnough, isValidEmail } from './authErrors';

export type SignUpFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export type SignUpFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * - `ok` — true when the form may be submitted (all rules pass).
 * - `errors` — inline messages; empty-field hints appear only when `showRequired` is true.
 *   Format problems (invalid email, short password, mismatch) show as soon as the field is non-empty.
 */
export function validateSignUpForm(
  values: SignUpFormValues,
  showRequired: boolean
): { ok: boolean; errors: SignUpFieldErrors } {
  const first = values.firstName.trim();
  const last = values.lastName.trim();
  const emailTrimmed = values.email.trim();
  const emailLower = emailTrimmed.toLowerCase();
  const { password, confirmPassword } = values;

  const errors: SignUpFieldErrors = {};

  if (showRequired && first.length === 0) {
    errors.firstName = 'Add your first name';
  }
  if (showRequired && last.length === 0) {
    errors.lastName = 'Add your last name';
  }
  if (showRequired && emailTrimmed.length === 0) {
    errors.email = 'Add your email address';
  } else if (emailTrimmed.length > 0 && !isValidEmail(emailLower)) {
    errors.email = 'Enter a valid email address';
  }

  if (showRequired && password.length === 0) {
    errors.password = getPasswordRequirementMessage();
  } else if (password.length > 0 && !isPasswordLongEnough(password)) {
    errors.password = getPasswordRequirementMessage();
  }

  if (showRequired && confirmPassword.length === 0) {
    errors.confirmPassword = 'Re-enter your password';
  } else if (confirmPassword.length > 0 && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }

  const ok =
    first.length > 0 &&
    last.length > 0 &&
    emailTrimmed.length > 0 &&
    isValidEmail(emailLower) &&
    isPasswordLongEnough(password) &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  return { ok, errors };
}

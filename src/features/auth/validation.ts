const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const t = email.trim();
  if (!t) {
    return 'Enter your email address.';
  }
  if (!EMAIL_RE.test(t)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePasswordSignIn(password: string): string | null {
  if (!password) {
    return 'Enter your password.';
  }
  return null;
}

/** Sign-up / reset: stronger rules without being annoying */
export function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return 'Use at least 8 characters.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include at least one letter and one number.';
  }
  return null;
}

export function validatePasswordMatch(a: string, b: string): string | null {
  if (a !== b) {
    return 'Passwords do not match.';
  }
  return null;
}

export function validateFullName(name: string): string | null {
  const t = name.trim();
  if (t.length < 2) {
    return 'Enter your name.';
  }
  return null;
}

export function isFormValid(errors: (string | null)[]): boolean {
  return errors.every((e) => e === null);
}

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

/** True if password contains a non–letter-or-digit character (symbol, punctuation, space, etc.). */
function hasPasswordSymbol(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

/**
 * Sign-up / password reset: min 8 chars, one uppercase, one digit, one symbol.
 */
export function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return 'Use at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Include at least one uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Include at least one number.';
  }
  if (!hasPasswordSymbol(password)) {
    return 'Include at least one symbol (e.g. ! @ # $).';
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

/** Optional field: empty is valid; otherwise require a plausible phone (10–15 digits). */
export function validateOptionalPhone(phone: string): string | null {
  const t = phone.trim();
  if (!t) {
    return null;
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Enter a valid phone number.';
  }
  return null;
}

export function isFormValid(errors: (string | null)[]): boolean {
  return errors.every((e) => e === null);
}

/**
 * Show inline field errors only after blur or after a submit that failed validation,
 * so empty forms do not render red outlines on first paint.
 */
export function visibleAuthFieldError(
  error: string | null,
  hasBlurred: boolean,
  submitAttempted: boolean,
): string | undefined {
  if (!error) {
    return undefined;
  }
  if (hasBlurred || submitAttempted) {
    return error;
  }
  return undefined;
}

import { describe, expect, it } from 'vitest';

import { createAbortError, isAbortError } from './abortError';

describe('createAbortError', () => {
  it('sets AbortError name', () => {
    const e = createAbortError();
    expect(e.name).toBe('AbortError');
    expect(e.message).toBe('Aborted');
  });
});

describe('isAbortError', () => {
  it('detects createAbortError', () => {
    expect(isAbortError(createAbortError())).toBe(true);
  });

  it('detects plain Error with AbortError name', () => {
    const e = new Error('x');
    e.name = 'AbortError';
    expect(isAbortError(e)).toBe(true);
  });

  it('detects aborted message', () => {
    expect(isAbortError(new Error('The user aborted a request.'))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isAbortError(new Error('Network failed'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError('string')).toBe(false);
  });
});

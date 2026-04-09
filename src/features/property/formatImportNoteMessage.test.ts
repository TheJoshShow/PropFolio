import { describe, expect, it } from 'vitest';

import { formatImportNoteMessage } from './formatImportNoteMessage';

describe('formatImportNoteMessage', () => {
  it('returns null for empty input', () => {
    expect(formatImportNoteMessage(null)).toBeNull();
    expect(formatImportNoteMessage(undefined)).toBeNull();
    expect(formatImportNoteMessage('   ')).toBeNull();
  });

  it('expands rentcast_not_configured', () => {
    const out = formatImportNoteMessage('rentcast_not_configured');
    expect(out).toContain('RENTCAST_API_KEY');
    expect(out).toContain('import-property');
  });

  it('passes through other messages', () => {
    expect(formatImportNoteMessage('timeout')).toBe('timeout');
  });
});

import { importEnrichmentAlert, userMessageForImportCode } from '../importErrorCodes';
import { IMPORT_USER_MESSAGES } from '../importErrorMessages';

describe('userMessageForImportCode', () => {
  it('maps codes to non-empty user messages', () => {
    expect(userMessageForImportCode('ADDRESS_NOT_FOUND')).toBe(IMPORT_USER_MESSAGES.unresolvableAddress);
    expect(userMessageForImportCode('ADDRESS_NOT_VERIFIED')).toBe(IMPORT_USER_MESSAGES.invalidAddress);
    expect(userMessageForImportCode('AUTH_REQUIRED').length).toBeGreaterThan(5);
  });
});

describe('importEnrichmentAlert', () => {
  it('uses precise titles for manual validation failures', () => {
    const v = importEnrichmentAlert('ADDRESS_NOT_VERIFIED');
    expect(v.title).toBe('Check the address');
    expect(v.message).toBe(IMPORT_USER_MESSAGES.invalidAddress);
    const n = importEnrichmentAlert('ADDRESS_NOT_FOUND');
    expect(n.title).toBe('Address not found');
  });
});

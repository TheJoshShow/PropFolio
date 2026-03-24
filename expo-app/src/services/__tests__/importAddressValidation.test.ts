import { isUsAddressLineLikelyComplete } from '../importAddressValidation';

describe('isUsAddressLineLikelyComplete', () => {
  it('accepts full comma-separated US address', () => {
    expect(isUsAddressLineLikelyComplete('8216 S Maryland Ave, Chicago, IL 60619')).toBe(true);
  });

  it('rejects incomplete lines', () => {
    expect(isUsAddressLineLikelyComplete('Chicago')).toBe(false);
    expect(isUsAddressLineLikelyComplete('')).toBe(false);
  });
});

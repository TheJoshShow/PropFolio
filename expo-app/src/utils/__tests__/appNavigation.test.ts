import { hrefPortfolioPropertyDetail, parsePortfolioPropertyIdParam } from '../appNavigation';

describe('parsePortfolioPropertyIdParam', () => {
  it('accepts a trimmed uuid-like id', () => {
    expect(parsePortfolioPropertyIdParam('  abc-123  ')).toBe('abc-123');
  });

  it('takes first element when array', () => {
    expect(parsePortfolioPropertyIdParam(['first', 'second'])).toBe('first');
  });

  it('rejects empty, newlines, and oversize', () => {
    expect(parsePortfolioPropertyIdParam('')).toBeNull();
    expect(parsePortfolioPropertyIdParam('   ')).toBeNull();
    expect(parsePortfolioPropertyIdParam('a\nb')).toBeNull();
    expect(parsePortfolioPropertyIdParam('x'.repeat(201))).toBeNull();
    expect(parsePortfolioPropertyIdParam(12 as unknown as string)).toBeNull();
  });
});

describe('hrefPortfolioPropertyDetail', () => {
  it('returns canonical pathname for valid id', () => {
    const h = hrefPortfolioPropertyDetail('prop_1');
    expect(h).toEqual({
      pathname: '/(tabs)/portfolio/[id]',
      params: { id: 'prop_1' },
    });
  });

  it('returns null for invalid id', () => {
    expect(hrefPortfolioPropertyDetail('')).toBeNull();
  });
});

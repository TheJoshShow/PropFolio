import { describe, expect, it } from 'vitest';

import { pasteContainsImportableListing } from './listingImportReadiness';

describe('pasteContainsImportableListing', () => {
  it('is true for Zillow homedetails + zpid URL', () => {
    expect(
      pasteContainsImportableListing(
        'https://www.zillow.com/homedetails/123-Main-St-Chicago-IL-60653/12345678_zpid/',
      ),
    ).toBe(true);
  });

  it('is false for Zillow search / homes path (was falsely “verified” with old heuristics)', () => {
    expect(pasteContainsImportableListing('https://www.zillow.com/homes/60601_rb/')).toBe(false);
  });

  it('is true when a later candidate is importable (matches server scan order)', () => {
    const raw =
      'bad https://www.zillow.com/homes/for-sale/ good https://www.zillow.com/homedetails/x/98765432_zpid/';
    expect(pasteContainsImportableListing(raw)).toBe(true);
  });

  it('is true for Redfin /home/id URL', () => {
    expect(
      pasteContainsImportableListing(
        'https://www.redfin.com/IL/Chicago/123-Main-St-60601/home/12345678',
      ),
    ).toBe(true);
  });

  it('is false for plain zillow.com mention without a parseable listing URL', () => {
    expect(pasteContainsImportableListing('check zillow.com for comps')).toBe(false);
  });

  it('is true for Zillow homedetails with iOS share UTM params', () => {
    expect(
      pasteContainsImportableListing(
        'https://www.zillow.com/homedetails/5029-S-Indiana-Ave-Chicago-IL-60615/159014230_zpid/?utm_campaign=iosappmessage&utm_medium=referral&utm_source=txtshar',
      ),
    ).toBe(true);
  });

  it('is true for Redfin official redf.in short link (expanded on server)', () => {
    expect(pasteContainsImportableListing('https://redf.in/rYFqBj')).toBe(true);
  });

  it('is true when paste has leading/trailing whitespace (iOS Messages / Notes)', () => {
    expect(
      pasteContainsImportableListing(
        '\n https://www.zillow.com/homedetails/9-W-Elm-St-Chicago-IL-60610/34789201_zpid/ \t',
      ),
    ).toBe(true);
  });
});

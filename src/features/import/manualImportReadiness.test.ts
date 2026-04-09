import { describe, expect, it } from 'vitest';

import { isManualImportReadyFromSuggestionPick } from './manualImportReadiness';

describe('isManualImportReadyFromSuggestionPick', () => {
  it('is false without a selected suggestion', () => {
    expect(
      isManualImportReadyFromSuggestionPick(
        {
          placeId: 'a',
          formattedAddress: '1 Main',
          latitude: 1,
          longitude: 2,
          normalizedOneLine: null,
          streetNumber: null,
          route: null,
          city: null,
          state: null,
          postalCode: null,
          country: null,
        },
        null,
      ),
    ).toBe(false);
  });

  it('is false when placeId does not match the picked suggestion', () => {
    expect(
      isManualImportReadyFromSuggestionPick(
        {
          placeId: 'resolved',
          formattedAddress: '1 Main',
          latitude: 1,
          longitude: 2,
          normalizedOneLine: null,
          streetNumber: null,
          route: null,
          city: null,
          state: null,
          postalCode: null,
          country: null,
        },
        {
          placeId: 'other',
          primaryText: 'x',
          secondaryText: '',
          fullText: 'x',
          text: 'x',
        },
      ),
    ).toBe(false);
  });

  it('is true when suggestion and resolved place match', () => {
    expect(
      isManualImportReadyFromSuggestionPick(
        {
          placeId: 'same',
          formattedAddress: '1 Main St',
          latitude: 1,
          longitude: 2,
          normalizedOneLine: null,
          streetNumber: '1',
          route: 'Main',
          city: 'X',
          state: 'Y',
          postalCode: '12345',
          country: 'US',
        },
        {
          placeId: 'same',
          primaryText: '1 Main',
          secondaryText: '',
          fullText: '1 Main',
          text: '1 Main',
        },
      ),
    ).toBe(true);
  });
});

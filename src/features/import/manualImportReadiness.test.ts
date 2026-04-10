import { describe, expect, it } from 'vitest';

import { isManualImportReadyToSubmit } from './manualImportReadiness';

const completePlace = {
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
};

describe('isManualImportReadyToSubmit', () => {
  it('is false without a matching suggestion or selected place id', () => {
    expect(isManualImportReadyToSubmit(completePlace, null, null)).toBe(false);
  });

  it('is false when placeId does not match the picked suggestion', () => {
    expect(
      isManualImportReadyToSubmit(
        {
          ...completePlace,
          placeId: 'resolved',
        },
        {
          placeId: 'other',
          primaryText: 'x',
          secondaryText: '',
          fullText: 'x',
          text: 'x',
        },
        'resolved',
      ),
    ).toBe(false);
  });

  it('is true when suggestion and resolved place match', () => {
    expect(
      isManualImportReadyToSubmit(
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
        'same',
      ),
    ).toBe(true);
  });

  it('is true after verify-address (geocode) when selectedPlaceId matches placeDetails', () => {
    expect(
      isManualImportReadyToSubmit(
        {
          placeId: 'ChIJxyz',
          formattedAddress: '10 Oak St, Chicago, IL',
          latitude: 41.9,
          longitude: -87.6,
          normalizedOneLine: null,
          streetNumber: '10',
          route: 'Oak St',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'US',
        },
        null,
        'ChIJxyz',
      ),
    ).toBe(true);
  });

  it('is false when geocode selectedPlaceId does not match placeDetails.placeId', () => {
    expect(
      isManualImportReadyToSubmit(
        {
          ...completePlace,
          placeId: 'resolved-id',
        },
        null,
        'stale-id',
      ),
    ).toBe(false);
  });
});

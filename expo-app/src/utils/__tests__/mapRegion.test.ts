import { regionForCoordinates, DEFAULT_MAP_REGION } from '../mapRegion';

describe('regionForCoordinates', () => {
  it('returns default when empty', () => {
    expect(regionForCoordinates([])).toEqual(DEFAULT_MAP_REGION);
  });

  it('centers single coordinate with modest delta', () => {
    const r = regionForCoordinates([{ latitude: 41.88, longitude: -87.63 }]);
    expect(r.latitude).toBeCloseTo(41.88, 2);
    expect(r.longitude).toBeCloseTo(-87.63, 2);
    expect(r.latitudeDelta).toBeLessThan(1);
  });

  it('fits two distant points', () => {
    const r = regionForCoordinates([
      { latitude: 40.7, longitude: -74.0 },
      { latitude: 34.05, longitude: -118.25 },
    ]);
    expect(r.latitudeDelta).toBeGreaterThan(1);
    expect(r.longitudeDelta).toBeGreaterThan(1);
  });
});

/**
 * Map region helpers for fitting markers (deterministic, testable).
 */

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/** Continental US centroid when there are no pins */
export const DEFAULT_MAP_REGION = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 15,
  longitudeDelta: 15,
} as const;

const MIN_DELTA = 0.02;
const PADDING_FACTOR = 1.35;

/**
 * Compute a MapView region that contains all coordinates with padding.
 * Single point uses a modest fixed delta.
 */
export function regionForCoordinates(coords: MapCoordinate[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  const valid = coords.filter(
    (c) =>
      Number.isFinite(c.latitude) &&
      Number.isFinite(c.longitude) &&
      Math.abs(c.latitude) <= 90 &&
      Math.abs(c.longitude) <= 180
  );
  if (valid.length === 0) {
    return { ...DEFAULT_MAP_REGION };
  }
  if (valid.length === 1) {
    return {
      latitude: valid[0].latitude,
      longitude: valid[0].longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }

  let minLat = valid[0].latitude;
  let maxLat = valid[0].latitude;
  let minLng = valid[0].longitude;
  let maxLng = valid[0].longitude;
  for (let i = 1; i < valid.length; i++) {
    const c = valid[i];
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latSpan = Math.max(maxLat - minLat, MIN_DELTA);
  const lngSpan = Math.max(maxLng - minLng, MIN_DELTA);

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.min(latSpan * PADDING_FACTOR, 120),
    longitudeDelta: Math.min(lngSpan * PADDING_FACTOR, 120),
  };
}

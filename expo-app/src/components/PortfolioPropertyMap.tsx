/**
 * Map of portfolio properties with pins. iOS/Android use react-native-maps; web shows a compact fallback.
 */

import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Card } from './Card';
import { useThemeColors } from './useThemeColors';
import { spacing, fontSizes, fontWeights, lineHeights, radius } from '../theme';
import type { PortfolioListItem } from '../hooks/usePortfolioProperties';
import { regionForCoordinates } from '../utils/mapRegion';

export interface PortfolioPropertyMapProps {
  properties: PortfolioListItem[];
  loading: boolean;
}

function addressLine(item: PortfolioListItem): string {
  const a = [item.streetAddress, item.unit].filter(Boolean).join(', ');
  const b = [item.city, item.state].filter(Boolean).join(', ');
  return [a, b].filter(Boolean).join('\n');
}

export function PortfolioPropertyMap({ properties, loading }: PortfolioPropertyMapProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const withCoords = useMemo(
    () =>
      properties.filter(
        (p) =>
          p.latitude != null &&
          p.longitude != null &&
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude)
      ),
    [properties]
  );

  const region: Region = useMemo(() => {
    const coords = withCoords.map((p) => ({
      latitude: p.latitude as number,
      longitude: p.longitude as number,
    }));
    return regionForCoordinates(coords);
  }, [withCoords]);

  const fitMap = useCallback(() => {
    if (withCoords.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      withCoords.map((p) => ({
        latitude: p.latitude as number,
        longitude: p.longitude as number,
      })),
      {
        edgePadding: { top: 48, right: 36, bottom: 36, left: 36 },
        animated: true,
      }
    );
  }, [withCoords]);

  const total = properties.length;
  const mapped = withCoords.length;
  const missingGeo = total > 0 && mapped === 0;

  if (Platform.OS === 'web') {
    return (
      <Card style={[styles.card, { borderColor: colors.border }]} elevated padded>
        <Text style={[styles.webFallbackTitle, { color: colors.text }]}>Portfolio map</Text>
        <Text style={[styles.webFallbackBody, { color: colors.textSecondary }]}>
          Open the PropFolio app on iPhone to see your properties on a map.
        </Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={styles.card} elevated padded>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>Loading map…</Text>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card style={styles.card} elevated padded>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your portfolio map</Text>
        <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
          Import a property to see it pinned here.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card} elevated padded={false}>
      <View style={[styles.mapHeader, { paddingHorizontal: spacing.m, paddingTop: spacing.m }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your portfolio map</Text>
        {missingGeo ? (
          <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={2}>
            Location data is updating for some properties…
          </Text>
        ) : (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {mapped === 1 ? '1 property' : `${mapped} properties`} on map
            {mapped < total ? ` · ${total - mapped} without location` : ''}
          </Text>
        )}
      </View>

      {mapped === 0 ? (
        <View
          style={[
            styles.noMapBox,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginHorizontal: spacing.m, marginBottom: spacing.m },
          ]}
        >
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            We couldn’t place these properties on the map yet. Pull to refresh on Portfolio, or re-import after we
            finish syncing addresses.
          </Text>
        </View>
      ) : (
        <View style={[styles.mapWrap, { marginHorizontal: spacing.m, marginBottom: spacing.m }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onMapReady={fitMap}
            showsUserLocation={false}
            showsCompass={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {withCoords.map((p) => (
              <Marker
                key={p.id}
                identifier={p.id}
                coordinate={{
                  latitude: p.latitude as number,
                  longitude: p.longitude as number,
                }}
                title={p.streetAddress}
                description={[p.city, p.state].filter(Boolean).join(', ')}
                onCalloutPress={() => router.push(`/portfolio/${p.id}`)}
                accessibilityLabel={addressLine(p)}
              />
            ))}
          </MapView>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.l,
    overflow: 'hidden',
    borderRadius: radius.l,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xxs,
    lineHeight: lineHeights.lg,
  },
  mapHeader: {
    marginBottom: spacing.s,
  },
  hint: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  mapWrap: {
    height: 220,
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noMapBox: {
    padding: spacing.m,
    borderRadius: radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 100,
    justifyContent: 'center',
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  muted: {
    fontSize: fontSizes.sm,
    paddingVertical: spacing.s,
  },
  webFallbackTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  webFallbackBody: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
});

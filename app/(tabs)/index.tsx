import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Region } from 'react-native-maps';

import {
  EventsMap,
  MapEventSheet,
  AccountButton,
  FavouritesButton,
  type EventsMapHandle,
} from '../../src/components';
import { useMapEvents, useUserGeo } from '../../src/hooks';
import { useTheme } from '../../src/theme';
import type { EventMapPin } from '../../src/types/events';
import type { UserGeo } from '../../src/types/common';
import {
  DEFAULT_MAP_GEO,
  INITIAL_RADIUS_KM,
  geoFromRegion,
  isRegionDirty,
  radiusKmFromRegion,
  regionForRadiusKm,
} from '../../src/utils/mapRegion';

export default function MapScreen() {
  const { colors, typography, spacing, radius, shadows, tabBar } = useTheme();
  const geoQuery = useUserGeo();
  const mapRef = useRef<EventsMapHandle>(null);

  const resolvedCenter = useMemo<UserGeo | null>(() => {
    if (!geoQuery.isFetched) return null;
    return geoQuery.data ?? DEFAULT_MAP_GEO;
  }, [geoQuery.isFetched, geoQuery.data]);

  const [searchCenter, setSearchCenter] = useState<UserGeo | null>(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState(INITIAL_RADIUS_KM);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  /** Last camera region that matches the active search (after map settle). */
  const [baselineRegion, setBaselineRegion] = useState<Region | null>(null);
  const [selectedPin, setSelectedPin] = useState<EventMapPin | null>(null);
  const cameraSeedRef = useRef<Region | null>(null);
  /** While true, region updates refresh the search baseline (initial load / recenter). */
  const adoptNextRegionRef = useRef(true);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginProgrammaticMove = useCallback(() => {
    adoptNextRegionRef.current = true;
    setBaselineRegion(null);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      adoptNextRegionRef.current = false;
      settleTimerRef.current = null;
    }, 600);
  }, []);

  useEffect(() => {
    if (!resolvedCenter || searchCenter) return;
    const seed = regionForRadiusKm(resolvedCenter, INITIAL_RADIUS_KM);
    cameraSeedRef.current = seed;
    beginProgrammaticMove();
    setSearchCenter(resolvedCenter);
    setSearchRadiusKm(INITIAL_RADIUS_KM);
    setMapRegion(seed);
  }, [resolvedCenter, searchCenter, beginProgrammaticMove]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    },
    [],
  );

  const mapQuery = useMapEvents(
    {
      when: 'today',
      radius_km: searchRadiusKm,
      limit: 200,
    },
    searchCenter,
    Boolean(searchCenter),
  );

  const areaDirty =
    mapRegion != null &&
    baselineRegion != null &&
    isRegionDirty(mapRegion, baselineRegion);

  const isInitialLoading =
    !geoQuery.isFetched ||
    (Boolean(searchCenter) &&
      mapQuery.isLoading &&
      !mapQuery.isPlaceholderData);
  const isSearching = mapQuery.isFetching && !mapQuery.isLoading;
  const error = mapQuery.error;
  const bottomInset = tabBar.height + tabBar.fabProtrusion;
  const pins = mapQuery.data?.items ?? [];

  const onRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
    setBaselineRegion((prev) =>
      adoptNextRegionRef.current || prev == null ? region : prev,
    );
  }, []);

  const onSearchThisArea = useCallback(() => {
    if (!mapRegion) return;
    setSelectedPin(null);
    setSearchCenter(geoFromRegion(mapRegion));
    setSearchRadiusKm(radiusKmFromRegion(mapRegion));
    setBaselineRegion(mapRegion);
  }, [mapRegion]);

  const onRecenter = useCallback(() => {
    if (!resolvedCenter) return;
    const next = regionForRadiusKm(resolvedCenter, INITIAL_RADIUS_KM);
    setSelectedPin(null);
    beginProgrammaticMove();
    setSearchCenter(resolvedCenter);
    setSearchRadiusKm(INITIAL_RADIUS_KM);
    setMapRegion(next);
    mapRef.current?.animateToRegion(next);
  }, [resolvedCenter, beginProgrammaticMove]);

  const onMarkerPress = useCallback((pin: EventMapPin) => {
    setSelectedPin(pin);
  }, []);

  const onMapPress = useCallback(() => {
    setSelectedPin(null);
  }, []);

  if (!searchCenter || !cameraSeedRef.current) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: spacing.md },
            ]}
          >
            Checking location…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <EventsMap
        ref={mapRef}
        pins={pins}
        initialRegion={cameraSeedRef.current}
        userGeo={geoQuery.data ?? null}
        selectedEventId={selectedPin?.event_id ?? null}
        isLoading={isInitialLoading}
        onRegionChangeComplete={onRegionChangeComplete}
        onMarkerPress={onMarkerPress}
        onMapPress={onMapPress}
      />

      <SafeAreaView edges={['top']} style={styles.header} pointerEvents="box-none">
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.heading, { color: colors.text }]}>Map</Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginTop: spacing.xs },
                ]}
              >
                {error
                  ? error instanceof Error
                    ? error.message
                    : 'Failed to load map events'
                  : mapQuery.data
                    ? `${mapQuery.data.count} events today`
                    : 'Loading today’s events…'}
              </Text>
            </View>
            <View style={[styles.headerIcons, { gap: spacing.sm }]}>
              <FavouritesButton />
              <AccountButton />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {areaDirty ? (
        <View style={styles.searchWrap} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search this area"
            onPress={onSearchThisArea}
            disabled={mapQuery.isFetching}
            style={[
              styles.searchButton,
              shadows.soft,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.full,
                opacity: mapQuery.isFetching ? 0.7 : 1,
              },
            ]}
          >
            {isSearching ? (
              <ActivityIndicator
                color={colors.primary}
                size="small"
                style={{ marginRight: spacing.sm }}
              />
            ) : null}
            <Text
              style={[
                typography.caption,
                { color: colors.text, fontWeight: '700' },
              ]}
            >
              Search this area
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recenter map on my location"
        onPress={onRecenter}
        style={[
          styles.recenterButton,
          shadows.soft,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            bottom: bottomInset + spacing.md,
          },
        ]}
      >
        <Ionicons name="locate" size={22} color={colors.primary} />
      </Pressable>

      {selectedPin ? (
        <MapEventSheet
          pin={selectedPin}
          bottomInset={bottomInset}
          onClose={() => setSelectedPin(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrap: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Region } from 'react-native-maps';

import { useBrowse } from '../../src/browse';
import {
  BrowseSearchBar,
  EventsMap,
  FilterSheet,
  MapEventSheet,
  countActiveFilters,
  filtersToMapParams,
  type EventsMapHandle,
} from '../../src/components';
import { useDebouncedValue, useMapEvents, useUserGeo } from '../../src/hooks';
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

function pinMatchesQuery(pin: EventMapPin, query: string) {
  if (!query) return true;
  const haystack = `${pin.title} ${pin.neighbourhood ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

export default function MapScreen() {
  const { colors, typography, spacing, radius, shadows, tabBar } = useTheme();
  const { filters, patchFilters, mapType, setMapType } = useBrowse();
  const geoQuery = useUserGeo();
  const mapRef = useRef<EventsMapHandle>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resolvedCenter = useMemo<UserGeo | null>(() => {
    if (!geoQuery.isFetched) return null;
    return geoQuery.data ?? DEFAULT_MAP_GEO;
  }, [geoQuery.isFetched, geoQuery.data]);

  const [searchCenter, setSearchCenter] = useState<UserGeo | null>(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState(INITIAL_RADIUS_KM);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [baselineRegion, setBaselineRegion] = useState<Region | null>(null);
  const [selectedPins, setSelectedPins] = useState<EventMapPin[] | null>(null);
  const cameraSeedRef = useRef<Region | null>(null);
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

  const mapParams = useMemo(
    () => ({
      ...filtersToMapParams(filters),
      radius_km: searchRadiusKm,
      limit: 200,
    }),
    [filters, searchRadiusKm],
  );

  const mapQuery = useMapEvents(mapParams, searchCenter, Boolean(searchCenter));

  const debouncedQ = useDebouncedValue(filters.q);
  const pins = useMemo(() => {
    const items = mapQuery.data?.items ?? [];
    const query = debouncedQ.trim().toLowerCase();
    if (!query) return items;
    return items.filter((pin) => pinMatchesQuery(pin, query));
  }, [mapQuery.data?.items, debouncedQ]);

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
  const bottomInset = tabBar.height;
  const filterCount = countActiveFilters(filters, { excludeQuery: true });

  const onRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
    setBaselineRegion((prev) =>
      adoptNextRegionRef.current || prev == null ? region : prev,
    );
  }, []);

  const onSearchThisArea = useCallback(() => {
    if (!mapRegion) return;
    setSelectedPins(null);
    setSearchCenter(geoFromRegion(mapRegion));
    setSearchRadiusKm(radiusKmFromRegion(mapRegion));
    setBaselineRegion(mapRegion);
  }, [mapRegion]);

  const onRecenter = useCallback(() => {
    if (!resolvedCenter) return;
    const next = regionForRadiusKm(resolvedCenter, INITIAL_RADIUS_KM);
    setSelectedPins(null);
    beginProgrammaticMove();
    setSearchCenter(resolvedCenter);
    setSearchRadiusKm(INITIAL_RADIUS_KM);
    setMapRegion(next);
    mapRef.current?.animateToRegion(next);
  }, [resolvedCenter, beginProgrammaticMove]);

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

  const statusLabel = error
    ? error instanceof Error
      ? error.message
      : 'Failed to load map events'
    : mapQuery.data
      ? `${pins.length} event${pins.length === 1 ? '' : 's'} nearby`
      : 'Loading…';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.mapStage}>
        <EventsMap
          ref={mapRef}
          pins={pins}
          initialRegion={cameraSeedRef.current}
          userGeo={geoQuery.data ?? null}
          selectedEventId={selectedPins?.[0]?.event_id ?? null}
          isLoading={isInitialLoading}
          mapRegion={mapRegion}
          mapType={mapType}
          onRegionChangeComplete={onRegionChangeComplete}
          onMarkerPress={(pin) => setSelectedPins([pin])}
          onClusterPress={setSelectedPins}
          onMapPress={() => setSelectedPins(null)}
        />

        <SafeAreaView edges={['top']} style={styles.header} pointerEvents="box-none">
          <BrowseSearchBar
            value={filters.q}
            onChangeText={(q) => patchFilters({ q })}
            onPressFilters={() => setFiltersOpen(true)}
            filterCount={filterCount}
          />
          <View
            style={[
              styles.countChip,
              shadows.soft,
              { backgroundColor: colors.surface, borderRadius: radius.full },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: error ? colors.danger : colors.textSecondary,
                  fontWeight: '700',
                },
              ]}
            >
              {statusLabel}
            </Text>
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
                shadows.fab,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.full,
                  opacity: mapQuery.isFetching ? 0.7 : 1,
                },
              ]}
            >
              {isSearching ? (
                <ActivityIndicator
                  color={colors.onPrimary}
                  size="small"
                  style={{ marginRight: spacing.sm }}
                />
              ) : (
                <Ionicons
                  name="refresh"
                  size={16}
                  color={colors.onPrimary}
                  style={{ marginRight: spacing.sm }}
                />
              )}
              <Text
                style={[
                  typography.caption,
                  { color: colors.onPrimary, fontWeight: '800' },
                ]}
              >
                Search this area
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle satellite map"
          onPress={() =>
            setMapType(mapType === 'satellite' ? 'standard' : 'satellite')
          }
          style={[
            styles.layersButton,
            shadows.soft,
            { backgroundColor: colors.surface, bottom: spacing.lg },
          ]}
        >
          <Ionicons name="layers-outline" size={20} color={colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recenter map on my location"
          onPress={onRecenter}
          style={[
            styles.recenterButton,
            shadows.soft,
            { backgroundColor: colors.surface, bottom: spacing.lg },
          ]}
        >
          <Ionicons name="locate" size={22} color={colors.primary} />
        </Pressable>

        {selectedPins?.length ? (
          <MapEventSheet
            pins={selectedPins}
            bottomInset={8}
            onClose={() => setSelectedPins(null)}
          />
        ) : null}
      </View>
      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <View style={{ height: bottomInset }} />
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
  mapStage: {
    flex: 1,
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  countChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchWrap: {
    position: 'absolute',
    top: 126,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  layersButton: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterButton: {
    position: 'absolute',
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

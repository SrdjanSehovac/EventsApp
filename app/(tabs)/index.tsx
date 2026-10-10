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
import { findProductCity } from '../../src/config/cities';
import {
  BrowseSearchBar,
  EventsMap,
  FilterSheet,
  MapEventSheet,
  countActiveFilters,
  filtersToMapParams,
  type EventsMapHandle,
} from '../../src/components';
import { useDebouncedValue, useMapViewport, useUserGeo } from '../../src/hooks';
import { useTabBarInset } from '../../src/layout';
import { useTheme } from '../../src/theme';
import type { EventMapPin } from '../../src/types/events';
import type { UserGeo } from '../../src/types/common';
import {
  DEFAULT_MAP_GEO,
  INITIAL_RADIUS_KM,
  regionForRadiusKm,
} from '../../src/utils/mapRegion';

function pinMatchesQuery(pin: EventMapPin, query: string) {
  if (!query) return true;
  const haystack = `${pin.title} ${pin.neighbourhood ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

export default function MapScreen() {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const tabBarInset = useTabBarInset();
  const { filters, patchFilters, mapType, setMapType } = useBrowse();
  const geoQuery = useUserGeo();
  const mapRef = useRef<EventsMapHandle>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resolvedCenter = useMemo<UserGeo | null>(() => {
    if (!geoQuery.isFetched) return null;
    return geoQuery.data ?? DEFAULT_MAP_GEO;
  }, [geoQuery.isFetched, geoQuery.data]);

  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [cameraSeed, setCameraSeed] = useState<Region | null>(null);
  const [selectedPins, setSelectedPins] = useState<EventMapPin[] | null>(null);
  const appliedCitySlugRef = useRef<string | null>(null);
  const focusedCity = useMemo(
    () => findProductCity(filters.city),
    [filters.city],
  );

  useEffect(() => {
    if (!resolvedCenter || cameraSeed) return;
    const center = focusedCity
      ? { lat: focusedCity.lat, lng: focusedCity.lng }
      : resolvedCenter;
    const radius = focusedCity?.radiusKm ?? INITIAL_RADIUS_KM;
    const seed = regionForRadiusKm(center, radius);
    appliedCitySlugRef.current = focusedCity?.slug ?? null;
    setCameraSeed(seed);
    setMapRegion(seed);
  }, [resolvedCenter, cameraSeed, focusedCity]);

  useEffect(() => {
    if (!cameraSeed || !focusedCity) {
      if (!focusedCity) appliedCitySlugRef.current = null;
      return;
    }
    if (appliedCitySlugRef.current === focusedCity.slug) return;
    appliedCitySlugRef.current = focusedCity.slug;
    const next = regionForRadiusKm(
      { lat: focusedCity.lat, lng: focusedCity.lng },
      focusedCity.radiusKm,
    );
    setSelectedPins(null);
    setMapRegion(next);
    mapRef.current?.animateToRegion(next);
  }, [focusedCity, cameraSeed]);

  const mapParams = useMemo(() => filtersToMapParams(filters), [filters]);

  const mapQuery = useMapViewport(mapParams, mapRegion, Boolean(mapRegion));

  const debouncedQ = useDebouncedValue(filters.q);
  const pins = useMemo(() => {
    const items = mapQuery.data?.items ?? [];
    const query = debouncedQ.trim().toLowerCase();
    if (!query) return items;
    return items.filter((pin) => pinMatchesQuery(pin, query));
  }, [mapQuery.data?.items, debouncedQ]);

  const isInitialLoading =
    !geoQuery.isFetched ||
    (Boolean(mapRegion) && mapQuery.isLoading && !mapQuery.isPlaceholderData);
  const isSearching = mapQuery.isFetching && !mapQuery.isLoading;
  const error = mapQuery.error;
  const filterCount = countActiveFilters(filters, { excludeQuery: true });

  const onRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
  }, []);

  const onRecenter = useCallback(() => {
    if (!resolvedCenter) return;
    appliedCitySlugRef.current = null;
    patchFilters({ city: null, neighbourhood: null });
    const next = regionForRadiusKm(resolvedCenter, INITIAL_RADIUS_KM);
    setSelectedPins(null);
    setMapRegion(next);
    mapRef.current?.animateToRegion(next);
  }, [resolvedCenter, patchFilters]);

  if (!cameraSeed || !mapRegion) {
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
    : isSearching
      ? 'Updating map…'
      : mapQuery.data
        ? `${pins.length} event${pins.length === 1 ? '' : 's'} in view`
        : 'Loading…';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.mapStage}>
        <EventsMap
          ref={mapRef}
          pins={pins}
          initialRegion={cameraSeed}
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
            bottomInset={12}
            onClose={() => setSelectedPins(null)}
          />
        ) : null}
      </View>
      <FilterSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <View style={{ height: tabBarInset }} />
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

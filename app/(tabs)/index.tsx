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

import { useBrowse, useEnsureMapViewport } from '../../src/browse';
import {
  BrowseSearchBar,
  EventsMap,
  FilterSheet,
  MapEventSheet,
  countActiveFilters,
  filtersToMapParams,
  type EventsMapHandle,
} from '../../src/components';
import { useDebouncedValue, useInfiniteEvents, useMapViewport, useUserGeo } from '../../src/hooks';
import { useTabBarInset } from '../../src/layout';
import { useTheme } from '../../src/theme';
import type { EventMapPin } from '../../src/types/events';
import type { UserGeo } from '../../src/types/common';
import {
  buildAreaListParams,
  countEventsInView,
  pinMatchesQuery,
} from '../../src/utils/areaQuery';
import {
  DEFAULT_MAP_GEO,
  INITIAL_RADIUS_KM,
  regionForRadiusKm,
} from '../../src/utils/mapRegion';
import { friendlyPublicError } from '../../src/utils/publicError';
import {
  MAP_FETCH_OVERSCAN,
  VIEWPORT_COMMIT_MS,
  boundsFromRegion,
  expandRegion,
  mergeViewportPins,
  viewportMeaningfullyChanged,
} from '../../src/utils/mapViewport';

export default function MapScreen() {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const tabBarInset = useTabBarInset();
  const {
    filters,
    patchFilters,
    sort,
    mapType,
    setMapType,
    viewport,
    viewportReason,
    commitViewport,
    setAppliedCitySlug,
    loadedPins,
    setLoadedPins,
    mapBoxTotal,
    setMapBoxTotal,
  } = useBrowse();
  useEnsureMapViewport();
  const geoQuery = useUserGeo();
  const mapRef = useRef<EventsMapHandle>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gestureRegion, setGestureRegion] = useState<Region | null>(null);
  const [selectedPins, setSelectedPins] = useState<EventMapPin[] | null>(null);
  const pinKeyRef = useRef('');
  const loadedRef = useRef<EventMapPin[]>([]);
  const skipFirstAnimate = useRef(true);

  const resolvedCenter = useMemo<UserGeo | null>(() => {
    if (!geoQuery.isFetched) return null;
    return geoQuery.data ?? DEFAULT_MAP_GEO;
  }, [geoQuery.isFetched, geoQuery.data]);

  const debouncedGesture = useDebouncedValue(gestureRegion, VIEWPORT_COMMIT_MS);

  useEffect(() => {
    if (!debouncedGesture || !viewport) return;
    if (!viewportMeaningfullyChanged(viewport, debouncedGesture)) return;
    commitViewport(debouncedGesture, 'gesture');
  }, [debouncedGesture, viewport, commitViewport]);

  useEffect(() => {
    if (!viewport) return;
    if (skipFirstAnimate.current) {
      skipFirstAnimate.current = false;
      return;
    }
    if (viewportReason === 'gesture') return;
    mapRef.current?.animateToRegion(viewport);
  }, [viewport, viewportReason]);

  const mapParams = useMemo(() => filtersToMapParams(filters), [filters]);
  const mapQuery = useMapViewport(mapParams, viewport, Boolean(viewport));

  useEffect(() => {
    if (!viewport || !mapQuery.data) return;
    const key = JSON.stringify(mapParams);
    // New filters are still in flight: keep every marker until the new
    // payload succeeds. A zoom only adds events and drops ones that left
    // the padded view.
    if (pinKeyRef.current !== key && mapQuery.isPlaceholderData) return;
    const replace = pinKeyRef.current !== key;
    pinKeyRef.current = key;
    const bounds = boundsFromRegion(expandRegion(viewport, MAP_FETCH_OVERSCAN));
    const incoming = mapQuery.data.items ?? [];
    const next = mergeViewportPins(
      replace ? [] : loadedRef.current,
      incoming,
      bounds,
    );
    loadedRef.current = next;
    setLoadedPins(next);
    // Placeholder data still belongs to the previous box. Don't keep
    // advertising that box's total while the camera has moved.
    if (!mapQuery.isPlaceholderData) {
      setMapBoxTotal(
        typeof mapQuery.data.total === 'number' ? mapQuery.data.total : null,
      );
    } else {
      setMapBoxTotal(null);
    }
  }, [
    mapQuery.data,
    mapQuery.isPlaceholderData,
    viewport,
    mapParams,
    setLoadedPins,
    setMapBoxTotal,
  ]);

  const debouncedQ = useDebouncedValue(filters.q);
  const areaParams = useMemo(
    () =>
      viewport
        ? buildAreaListParams({ ...filters, q: debouncedQ }, sort, viewport)
        : null,
    [viewport, filters, debouncedQ, sort],
  );
  const areaGeo = viewport
    ? { lat: viewport.latitude, lng: viewport.longitude }
    : null;
  const areaQuery = useInfiniteEvents(
    areaParams ?? { page_size: 24 },
    areaGeo,
    Boolean(areaParams),
  );
  const pins = useMemo(() => {
    const query = debouncedQ.trim().toLowerCase();
    if (!query) return loadedPins;
    return loadedPins.filter((pin) => pinMatchesQuery(pin, query));
  }, [loadedPins, debouncedQ]);
  const areaTotal = countEventsInView({
    pins,
    region: viewport,
    listPages: areaQuery.data?.pages,
    mapTotal: mapBoxTotal,
  });

  const isInitialLoading =
    !geoQuery.isFetched ||
    (Boolean(viewport) && mapQuery.isLoading && !mapQuery.isPlaceholderData && pins.length === 0);
  const error = mapQuery.error ?? areaQuery.error;
  const filterCount = countActiveFilters(filters, { excludeQuery: true });

  const onRegionChangeComplete = useCallback((region: Region) => {
    setGestureRegion(region);
  }, []);

  const onRecenter = useCallback(() => {
    if (!resolvedCenter) return;
    setAppliedCitySlug(null);
    patchFilters({ city: null, neighbourhood: null });
    setSelectedPins(null);
    commitViewport(regionForRadiusKm(resolvedCenter, INITIAL_RADIUS_KM), 'program');
  }, [resolvedCenter, patchFilters, setAppliedCitySlug, commitViewport]);

  if (!viewport) {
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

  const countReady = areaTotal > 0 || Boolean(areaQuery.data || mapQuery.data);
  const statusLabel = error
    ? friendlyPublicError(
        error,
        "Can't load the map right now. Check your connection and try again.",
      )
    : countReady
      ? `${areaTotal.toLocaleString()} event${areaTotal === 1 ? '' : 's'} in view`
      : 'Updating map…';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.mapStage}>
        <EventsMap
          ref={mapRef}
          pins={pins}
          initialRegion={viewport}
          userGeo={geoQuery.data ?? null}
          selectedEventId={selectedPins?.[0]?.event_id ?? null}
          isLoading={isInitialLoading}
          mapRegion={viewport}
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

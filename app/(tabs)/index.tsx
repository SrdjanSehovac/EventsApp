import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Region } from 'react-native-maps';

import { useBrowse, useEnsureMapViewport, usePlaceActions } from '../../src/browse';
import {
  BrowseSearchBar,
  type BrowseSearchBarHandle,
  EventsMap,
  FilterSheet,
  LocationChip,
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

const PROGRAM_MOVE_MS = 650;

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
    loadedPins,
    setLoadedPins,
    mapBoxTotal,
    setMapBoxTotal,
    place,
    placeEpoch,
  } = useBrowse();
  const { goNearMe } = usePlaceActions();
  useEnsureMapViewport();
  const geoQuery = useUserGeo();
  const mapRef = useRef<EventsMapHandle>(null);
  const searchRef = useRef<BrowseSearchBarHandle>(null);
  const panDismissed = useRef(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [gestureRegion, setGestureRegion] = useState<Region | null>(null);
  const [selectedPins, setSelectedPins] = useState<EventMapPin[] | null>(null);
  const pinKeyRef = useRef('');
  const loadedRef = useRef<EventMapPin[]>([]);
  const skipFirstAnimate = useRef(true);
  const epochRef = useRef(placeEpoch);
  /** Camera moves we started ourselves end before this time; ignore their region callbacks. */
  const programMoveUntil = useRef(0);

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
    // A jump must not be followed by a second "gesture" fetch when the
    // animation settles, or by an older pan that was still debouncing.
    programMoveUntil.current = Date.now() + PROGRAM_MOVE_MS + 400;
    setGestureRegion(null);
    mapRef.current?.animateToRegion(viewport, PROGRAM_MOVE_MS);
  }, [viewport, viewportReason]);

  const mapParams = useMemo(() => filtersToMapParams(filters), [filters]);
  const mapQuery = useMapViewport(mapParams, viewport, Boolean(viewport));

  useEffect(() => {
    if (epochRef.current !== placeEpoch) {
      epochRef.current = placeEpoch;
      loadedRef.current = [];
    }
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
    placeEpoch,
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
    panDismissed.current = false;
    if (Date.now() < programMoveUntil.current) return;
    setGestureRegion(region);
  }, []);

  const dismissSearch = useCallback(() => {
    searchRef.current?.close();
    Keyboard.dismiss();
  }, []);

  const blocksSelection = useCallback(
    () => searchRef.current?.blocksMapTap() ?? false,
    [],
  );

  const onPanDrag = useCallback(() => {
    if (panDismissed.current) return;
    panDismissed.current = true;
    dismissSearch();
  }, [dismissSearch]);

  const onRecenter = useCallback(() => {
    if (!resolvedCenter) return;
    setSelectedPins(null);
    goNearMe();
  }, [resolvedCenter, goNearMe]);

  useEffect(() => {
    setSelectedPins(null);
  }, [placeEpoch]);

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
  // Still showing the previous area's answer while the new one loads.
  const updating =
    mapQuery.isFetching && (mapQuery.isPlaceholderData || mapBoxTotal == null);
  const statusLabel = error
    ? friendlyPublicError(
        error,
        "Can't load the map right now. Check your connection and try again.",
      )
    : updating || !countReady
      ? place
        ? `Loading ${place.label}…`
        : 'Updating map…'
      : `${areaTotal.toLocaleString()} event${areaTotal === 1 ? '' : 's'} in view`


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
          onPanDrag={onPanDrag}
          blocksSelection={blocksSelection}
          onMarkerPress={(pin) => {
            if (searchRef.current?.blocksMapTap()) {
              searchRef.current.close();
              return;
            }
            setSelectedPins([pin]);
          }}
          onClusterPress={(next) => {
            if (searchRef.current?.blocksMapTap()) {
              searchRef.current.close();
              return;
            }
            setSelectedPins(next);
          }}
          onMapPress={() => {
            if (searchRef.current?.blocksMapTap()) {
              searchRef.current.close();
              return;
            }
            setSelectedPins(null);
          }}
        />

        {searchActive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss search"
            onPressIn={dismissSearch}
            style={styles.dismissLayer}
          />
        ) : null}

        <SafeAreaView edges={['top']} style={styles.header} pointerEvents="box-none">
          <BrowseSearchBar
            ref={searchRef}
            value={filters.q}
            onChangeText={(q) => patchFilters({ q })}
            onPressFilters={() => setFiltersOpen(true)}
            onActiveChange={setSearchActive}
            filterCount={filterCount}
          />
          <View style={styles.chipRow} pointerEvents="box-none">
          {place ? (
            <LocationChip label={place.label} onClear={onRecenter} />
          ) : null}
          <View
            pointerEvents="none"
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
            {updating && !error ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
          </View>
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
  dismissLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

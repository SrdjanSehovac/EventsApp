import { useCallback } from 'react';

import { findProductCity, productCityQueryValue } from '../config/cities';
import { useCities, useUserGeo } from '../hooks';
import {
  DEFAULT_MAP_GEO,
  INITIAL_RADIUS_KM,
  regionForRadiusKm,
  regionForZoom,
} from '../utils/mapRegion';
import type { PlaceMatch } from '../utils/placeSearch';
import { useBrowse } from './BrowseProvider';

/**
 * One place jump for Map and List: filters, camera, chip and reset happen in
 * a single batched update, so there is exactly one fetch for the new area.
 */
export function usePlaceActions() {
  const {
    patchFilters,
    setAppliedCitySlug,
    commitViewport,
    setLoadedPins,
    setMapBoxTotal,
    setPlace,
    bumpPlaceEpoch,
  } = useBrowse();
  const citiesQuery = useCities();
  const geoQuery = useUserGeo();
  const cities = citiesQuery.data;

  const goToPlace = useCallback(
    (match: PlaceMatch) => {
      const city = findProductCity(match.citySlug);
      if (!city) return;
      // Applied before the filter update so a neighbourhood camera is not
      // replaced by the city-wide one.
      setAppliedCitySlug(city.slug);
      patchFilters({
        city: productCityQueryValue(city, cities ?? []),
        neighbourhood: null,
        q: '',
      });
      const region =
        match.kind === 'neighbourhood' && match.zoom != null
          ? regionForZoom(match.lat, match.lng, match.zoom)
          : regionForRadiusKm({ lat: city.lat, lng: city.lng }, city.radiusKm);
      // Old-area pins and totals are stale the moment we jump.
      setLoadedPins([]);
      setMapBoxTotal(null);
      setPlace({ kind: match.kind, label: match.title, citySlug: city.slug });
      bumpPlaceEpoch();
      commitViewport(region, 'program');
    },
    [
      cities,
      patchFilters,
      setAppliedCitySlug,
      commitViewport,
      setLoadedPins,
      setMapBoxTotal,
      setPlace,
      bumpPlaceEpoch,
    ],
  );

  const goNearMe = useCallback(() => {
    setAppliedCitySlug(null);
    patchFilters({ city: null, neighbourhood: null, q: '' });
    setLoadedPins([]);
    setMapBoxTotal(null);
    setPlace(null);
    bumpPlaceEpoch();
    commitViewport(
      regionForRadiusKm(geoQuery.data ?? DEFAULT_MAP_GEO, INITIAL_RADIUS_KM),
      'program',
    );
  }, [
    geoQuery.data,
    patchFilters,
    setAppliedCitySlug,
    commitViewport,
    setLoadedPins,
    setMapBoxTotal,
    setPlace,
    bumpPlaceEpoch,
  ]);

  return { goToPlace, goNearMe };
}

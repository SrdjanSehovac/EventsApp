import { useEffect, useMemo } from 'react';

import { findProductCity } from '../config/cities';
import { useUserGeo } from '../hooks';
import type { UserGeo } from '../types/common';
import {
  DEFAULT_MAP_GEO,
  INITIAL_RADIUS_KM,
  regionForRadiusKm,
} from '../utils/mapRegion';
import { useBrowse } from './BrowseProvider';

/** Camera for “Show all in <City>” or the default nearby radius. */
export function regionForCurrentCity(
  cityName: string | null | undefined,
  userGeo?: UserGeo | null,
) {
  const city = findProductCity(cityName);
  if (city) {
    return regionForRadiusKm({ lat: city.lat, lng: city.lng }, city.radiusKm);
  }
  return regionForRadiusKm(userGeo ?? DEFAULT_MAP_GEO, INITIAL_RADIUS_KM);
}

/**
 * Seeds the shared viewport once, and recentres it when the city filter
 * changes. Both Map and List call this so the area exists even if the map
 * has not been opened yet.
 */
export function useEnsureMapViewport() {
  const {
    filters,
    viewport,
    commitViewport,
    appliedCitySlug,
    setAppliedCitySlug,
    place,
    setPlace,
  } = useBrowse();
  const geoQuery = useUserGeo();
  const focusedCity = useMemo(
    () => findProductCity(filters.city),
    [filters.city],
  );

  // A city changed from Filters makes the search chip stale.
  useEffect(() => {
    if (place && place.citySlug !== (focusedCity?.slug ?? null)) setPlace(null);
  }, [place, focusedCity, setPlace]);

  useEffect(() => {
    if (viewport || !geoQuery.isFetched) return;
    const center = focusedCity
      ? { lat: focusedCity.lat, lng: focusedCity.lng }
      : (geoQuery.data ?? DEFAULT_MAP_GEO);
    const radius = focusedCity?.radiusKm ?? INITIAL_RADIUS_KM;
    setAppliedCitySlug(focusedCity?.slug ?? null);
    commitViewport(regionForRadiusKm(center, radius), 'program');
  }, [
    viewport,
    geoQuery.isFetched,
    geoQuery.data,
    focusedCity,
    commitViewport,
    setAppliedCitySlug,
  ]);

  useEffect(() => {
    if (!viewport) return;
    const slug = focusedCity?.slug ?? null;
    if (slug === appliedCitySlug) return;
    if (!focusedCity) {
      setAppliedCitySlug(null);
      return;
    }
    setAppliedCitySlug(slug);
    commitViewport(
      regionForRadiusKm(
        { lat: focusedCity.lat, lng: focusedCity.lng },
        focusedCity.radiusKm,
      ),
      'program',
    );
  }, [
    focusedCity,
    viewport,
    appliedCitySlug,
    commitViewport,
    setAppliedCitySlug,
  ]);
}

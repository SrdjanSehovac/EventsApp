import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Region } from 'react-native-maps';

import {
  EMPTY_FILTERS,
  type EventsFilterState,
} from '../components/EventFilters';
import type { PublicSortField } from '../types/events';

export type MapBaseType = 'standard' | 'satellite';

/** Gesture commits follow a finger. Program commits come from the city picker or Show all. */
export type ViewportReason = 'gesture' | 'program';

type BrowseContextValue = {
  filters: EventsFilterState;
  setFilters: (next: EventsFilterState) => void;
  patchFilters: (partial: Partial<EventsFilterState>) => void;
  sort: PublicSortField;
  setSort: (next: PublicSortField) => void;
  sortTouched: boolean;
  setSortTouched: (next: boolean) => void;
  mapType: MapBaseType;
  setMapType: (next: MapBaseType) => void;
  /** Committed map area shared with the List tab. Null until the camera seeds. */
  viewport: Region | null;
  viewportReason: ViewportReason;
  commitViewport: (region: Region, reason?: ViewportReason) => void;
  appliedCitySlug: string | null;
  setAppliedCitySlug: (slug: string | null) => void;
};

const BrowseContext = createContext<BrowseContextValue | null>(null);

export function BrowseProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<EventsFilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<PublicSortField>('starts_at');
  const [sortTouched, setSortTouched] = useState(false);
  const [mapType, setMapType] = useState<MapBaseType>('standard');
  const [viewport, setViewport] = useState<Region | null>(null);
  const [viewportReason, setViewportReason] = useState<ViewportReason>('program');
  const [appliedCitySlug, setAppliedCitySlug] = useState<string | null>(null);

  const patchFilters = useCallback((partial: Partial<EventsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const commitViewport = useCallback(
    (region: Region, reason: ViewportReason = 'program') => {
      setViewportReason(reason);
      setViewport(region);
    },
    [],
  );

  const value = useMemo<BrowseContextValue>(
    () => ({
      filters,
      setFilters,
      patchFilters,
      sort,
      setSort,
      sortTouched,
      setSortTouched,
      mapType,
      setMapType,
      viewport,
      viewportReason,
      commitViewport,
      appliedCitySlug,
      setAppliedCitySlug,
    }),
    [
      filters,
      patchFilters,
      sort,
      sortTouched,
      mapType,
      viewport,
      viewportReason,
      commitViewport,
      appliedCitySlug,
    ],
  );

  return (
    <BrowseContext.Provider value={value}>{children}</BrowseContext.Provider>
  );
}

export function useBrowse(): BrowseContextValue {
  const ctx = useContext(BrowseContext);
  if (!ctx) {
    throw new Error('useBrowse must be used within a BrowseProvider');
  }
  return ctx;
}

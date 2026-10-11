import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Region } from 'react-native-maps';

import {
  EMPTY_FILTERS,
  type EventsFilterState,
} from '../components/EventFilters';
import { loadListSort, saveListSort } from '../preferences/listSort';
import type { EventMapPin, PublicSortField } from '../types/events';
import { DEFAULT_LIST_SORT } from '../utils/listSort';

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
  /** Pins kept on the map, including ones still inside a zoomed-in view. */
  loadedPins: EventMapPin[];
  setLoadedPins: (pins: EventMapPin[]) => void;
  /** Explicit box total from GET /events/map `total`, when the server sends it. */
  mapBoxTotal: number | null;
  setMapBoxTotal: (total: number | null) => void;
};

const BrowseContext = createContext<BrowseContextValue | null>(null);

export function BrowseProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<EventsFilterState>(EMPTY_FILTERS);
  const [sort, setSortState] = useState<PublicSortField>(DEFAULT_LIST_SORT);
  const [sortTouched, setSortTouchedState] = useState(false);
  const userChoseSort = useRef(false);

  useEffect(() => {
    let live = true;
    void loadListSort().then((next) => {
      if (!live || userChoseSort.current) return;
      setSortState(next);
    });
    return () => {
      live = false;
    };
  }, []);

  const setSort = useCallback((next: PublicSortField) => {
    userChoseSort.current = true;
    setSortState(next);
    void saveListSort(next);
  }, []);

  const setSortTouched = useCallback((next: boolean) => {
    setSortTouchedState(next);
  }, []);

  const [mapType, setMapType] = useState<MapBaseType>('standard');
  const [viewport, setViewport] = useState<Region | null>(null);
  const [viewportReason, setViewportReason] = useState<ViewportReason>('program');
  const [appliedCitySlug, setAppliedCitySlug] = useState<string | null>(null);
  const [loadedPins, setLoadedPinsState] = useState<EventMapPin[]>([]);
  const [mapBoxTotal, setMapBoxTotal] = useState<number | null>(null);
  const setLoadedPins = useCallback((pins: EventMapPin[]) => {
    setLoadedPinsState(pins);
  }, []);

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
      loadedPins,
      setLoadedPins,
      mapBoxTotal,
      setMapBoxTotal,
    }),
    [
      filters,
      patchFilters,
      sort,
      setSort,
      sortTouched,
      setSortTouched,
      mapType,
      viewport,
      viewportReason,
      commitViewport,
      appliedCitySlug,
      loadedPins,
      setLoadedPins,
      mapBoxTotal,
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

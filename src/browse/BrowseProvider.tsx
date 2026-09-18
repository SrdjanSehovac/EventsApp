import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  EMPTY_FILTERS,
  type EventsFilterState,
} from '../components/EventFilters';
import type { PublicSortField } from '../types/events';

export type MapBaseType = 'standard' | 'satellite';

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
};

const BrowseContext = createContext<BrowseContextValue | null>(null);

export function BrowseProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<EventsFilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<PublicSortField>('starts_at');
  const [sortTouched, setSortTouched] = useState(false);
  const [mapType, setMapType] = useState<MapBaseType>('standard');

  const patchFilters = useCallback((partial: Partial<EventsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

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
    }),
    [filters, patchFilters, sort, sortTouched, mapType],
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

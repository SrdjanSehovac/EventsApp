export type PaginationMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type Page<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type DistBucket = {
  key: string;
  label: string;
  count: number;
};

export type GeoMode = 'default' | 'nearby' | 'city';
export type GeoSource = 'default' | 'header' | 'city';

export type GeoContext = {
  mode: GeoMode;
  source: GeoSource;
  lat: number;
  lng: number;
  city?: string | null;
};

export type UserGeo = {
  lat: number;
  lng: number;
};

export type ApiErrorBody = {
  detail?: string | { msg: string }[];
};

import type { GeoContext, PaginationMeta } from './common';

export type EventStatus = 'active' | 'cancelled' | 'ended' | 'hidden';
export type ScheduleType = 'one_shot' | 'multi_occurrence' | 'date_range';
export type Ticketing =
  | 'free'
  | 'rsvp'
  | 'ticketed'
  | 'door'
  | 'donation'
  | 'unknown';
export type PublicSortField =
  | 'starts_at'
  | '-starts_at'
  | 'distance'
  | '-distance';
export type SortField =
  | 'starts_at'
  | '-starts_at'
  | 'created_at'
  | '-created_at'
  | 'scraped_at'
  | '-scraped_at';
export type WhenPreset = 'now' | 'today' | 'tonight' | 'weekend' | 'upcoming';
export type SettingFilter = 'indoor' | 'outdoor' | 'hybrid' | 'unknown';

export type CategoryBrief = {
  category_id: string;
  name: string;
  slug: string;
  is_primary?: boolean;
  confidence?: number | string | null;
};

export type VenueBrief = {
  venue_id: string;
  name: string;
  slug: string;
  city: string;
  neighbourhood?: string | null;
  address_line?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type OccurrenceOut = {
  occurrence_id: string;
  starts_at: string;
  ends_at: string;
};

export type EventListItem = {
  event_id: string;
  title: string;
  summary?: string | null;
  source: string;
  source_url: string;
  status: string;
  schedule_type: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_free?: boolean | null;
  neighbourhood?: string | null;
  city?: string | null;
  primary_category?: CategoryBrief | null;
  image_url?: string | null;
  scraped_at?: string | null;
  enriched_at?: string | null;
  has_embedding?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distance_km?: number | null;
  tags?: unknown[];
  vibe?: unknown[];
};

export type EventDetail = {
  event_id: string;
  source: string;
  source_url: string;
  scraped_at?: string | null;
  title: string;
  description?: string | null;
  summary?: string | null;
  image_url?: string | null;
  venue?: VenueBrief | null;
  raw_venue_name?: string | null;
  raw_venue_address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  neighbourhood?: string | null;
  timezone: string;
  schedule_type: string;
  raw_schedule_text?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  range_start_date?: string | null;
  range_end_date?: string | null;
  daily_start_time?: string | null;
  daily_end_time?: string | null;
  closed_weekdays?: number[] | null;
  is_free?: boolean | null;
  price_min_cad?: number | string | null;
  price_max_cad?: number | string | null;
  price_notes?: string | null;
  ticketing?: string | null;
  requires_rsvp?: boolean | null;
  age_restriction?: string | null;
  audience?: unknown[];
  setting?: string | null;
  vibe?: unknown[];
  tags?: unknown[];
  accessibility_notes?: string | null;
  is_pet_friendly?: boolean | null;
  rain_or_shine?: boolean | null;
  series_name?: string | null;
  performers?: unknown[];
  enrichment_confidence?: number | string | null;
  enriched_at?: string | null;
  has_embedding?: boolean;
  status: string;
  created_at: string;
  updated_at?: string | null;
  categories: CategoryBrief[];
  occurrences: OccurrenceOut[];
};

export type EventMapPin = {
  event_id: string;
  title: string;
  latitude: number;
  longitude: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_free?: boolean | null;
  primary_category?: CategoryBrief | null;
  image_url?: string | null;
  neighbourhood?: string | null;
  distance_m?: number | null;
};

export type MapEventsResponse = {
  geo: GeoContext;
  items: EventMapPin[];
  count: number;
};

export type PublicEventListResponse = {
  geo: GeoContext;
  items: EventListItem[];
  meta: PaginationMeta;
};

export type TodayEventsResponse = {
  geo: GeoContext;
  local_date: string;
  items: EventListItem[];
  count: number;
  truncated?: boolean;
};

export type SearchHit = EventListItem & {
  score: number;
};

export type SearchEventsResponse = {
  geo: GeoContext;
  query: string;
  items: SearchHit[];
  count: number;
};

export type SimilarEventsResponse = {
  event_id: string;
  items: SearchHit[];
  count: number;
  reason?: string | null;
};

export type CityCount = {
  city: string;
  event_count: number;
};

export type NeighbourhoodCount = {
  neighbourhood: string;
  city?: string | null;
  event_count: number;
};

export type PublicEventListParams = {
  page?: number;
  page_size?: number;
  q?: string;
  city?: string;
  neighbourhood?: string;
  category?: string;
  categories?: string[];
  tags?: string[];
  vibe?: string[];
  audience?: string[];
  setting?: SettingFilter;
  is_free?: boolean;
  ticketing?: Ticketing;
  schedule_type?: ScheduleType;
  when?: WhenPreset;
  starts_after?: string;
  starts_before?: string;
  radius_km?: number;
  sort?: PublicSortField;
};

export type MapEventsParams = {
  city?: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  radius_km?: number;
  category?: string;
  categories?: string[];
  is_free?: boolean;
  when?: WhenPreset;
  starts_after?: string;
  starts_before?: string;
  limit?: number;
};

export type TodayEventsParams = {
  city?: string;
  category?: string;
  is_free?: boolean;
};

export type SearchEventsParams = {
  q: string;
  city?: string;
  category?: string;
  categories?: string[];
  is_free?: boolean;
  when?: WhenPreset;
  radius_km?: number;
  limit?: number;
};

export type SimilarEventsParams = {
  eventId: string;
  limit?: number;
  same_city?: boolean;
};

export type NeighbourhoodsParams = {
  city?: string;
};

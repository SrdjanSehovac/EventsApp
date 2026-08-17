import type { DistBucket, Page } from './common';
import type {
  EventDetail,
  EventListItem,
  EventStatus,
  ScheduleType,
  SortField,
} from './events';

export type AdminTotals = {
  events: number;
  venues: number;
  categories: number;
  active: number;
  cancelled: number;
  ended: number;
  hidden: number;
};

export type AdminCoverage = {
  with_summary: number;
  with_embedding: number;
  with_enriched_at: number;
  with_venue: number;
  with_category: number;
};

export type AdminPricing = {
  free: number;
  paid: number;
  unknown: number;
};

export type AdminFreshness = {
  scraped_last_24h: number;
  scraped_last_7d: number;
  enriched_last_24h: number;
  enriched_last_7d: number;
  upcoming: number;
  past: number;
};

export type AdminDistributions = {
  by_source: DistBucket[];
  by_status: DistBucket[];
  by_schedule_type: DistBucket[];
  by_ticketing: DistBucket[];
  by_city: DistBucket[];
  by_neighbourhood: DistBucket[];
  by_category: DistBucket[];
};

export type AdminOverview = {
  totals: AdminTotals;
  coverage: AdminCoverage;
  pricing: AdminPricing;
  freshness: AdminFreshness;
  distributions: AdminDistributions;
};

export type AdminCityBreakdown = {
  city: string;
  label: string;
  events: number;
  active: number;
  upcoming: number;
  pricing: AdminPricing;
  by_source: DistBucket[];
  by_category: DistBucket[];
  by_neighbourhood: DistBucket[];
};

export type AdminCitiesResponse = {
  cities: AdminCityBreakdown[];
  total_events: number;
};

export type AdminEventListParams = {
  page?: number;
  page_size?: number;
  q?: string;
  source?: string;
  status?: EventStatus;
  category?: string;
  city?: string;
  neighbourhood?: string;
  is_free?: boolean;
  schedule_type?: ScheduleType;
  starts_after?: string;
  starts_before?: string;
  enriched?: boolean;
  sort?: SortField;
};

export type AdminEventListResponse = Page<EventListItem>;
export type AdminEventDetail = EventDetail;

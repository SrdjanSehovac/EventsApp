export const BUSINESS_KINDS = ['venue', 'promoter', 'retail', 'other'] as const;

export type BusinessKind = (typeof BUSINESS_KINDS)[number];

export const BUSINESS_STATUSES = [
  'none',
  'pending_email',
  'pending_review',
  'verified',
  'rejected',
] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export type BusinessApplyInput = {
  business_name: string;
  website: string;
  business_email: string;
  phone?: string | null;
  city: string;
  kind: BusinessKind;
};

export type BusinessProfile = BusinessApplyInput & {
  application_id: string;
  status: Exclude<BusinessStatus, 'none'>;
  email_verified: boolean;
  bio?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string | null;
  source: 'server' | 'local';
};

export const BUSINESS_KIND_LABELS: Record<BusinessKind, string> = {
  venue: 'Venue',
  promoter: 'Promoter',
  retail: 'Retail',
  other: 'Other',
};

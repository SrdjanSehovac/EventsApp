export type SubmitEventInput = {
  title: string;
  description: string;
  city: string;
  venue_name: string;
  address: string;
  starts_at: string;
  price_cad?: number | null;
  is_free: boolean;
  category_slug?: string | null;
  category_name?: string | null;
  photo_urls?: string[];
  video_url?: string | null;
  bio?: string | null;
  rsvp_enabled?: boolean;
  rsvp_capacity?: number | null;
  rsvp_closes_at?: string | null;
  rsvp_waitlist?: boolean;
};

export type SubmittedEvent = SubmitEventInput & {
  submission_id: string;
  status: 'pending' | 'accepted' | 'active' | 'rejected' | 'local' | string;
  created_at: string;
  source: 'server' | 'local';
};

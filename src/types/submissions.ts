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
};

export type SubmittedEvent = SubmitEventInput & {
  submission_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'local';
  created_at: string;
  source: 'server' | 'local';
};

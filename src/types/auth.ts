export type LegalStatus = {
  needs_acceptance: boolean;
  accepted_at?: string | null;
  terms_version?: string | null;
  privacy_version?: string | null;
  disclaimer_version?: string | null;
};

export type AuthUser = {
  user_id: string;
  email: string;
  display_name: string;
  home_lat?: number | null;
  home_lng?: number | null;
  /** Missing on sessions stored by older builds: treated as needing acceptance. */
  legal?: LegalStatus | null;
};

export type LegalAcceptanceInput = {
  terms_version: string;
  privacy_version: string;
  disclaimer_version: string;
  accept_terms_and_privacy: boolean;
  acknowledge_disclaimer: boolean;
  age_confirmed: boolean;
  app_version?: string | null;
  platform?: string | null;
};

export type SignUpInput = {
  email: string;
  password: string;
  display_name: string;
  legal: LegalAcceptanceInput;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthSessionResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  token_type?: string;
  user?: unknown;
};

export type RawAuthUser = {
  user_id?: string | number;
  id?: string | number;
  uuid?: string;
  email?: string;
  display_name?: string;
  displayName?: string;
  name?: string;
  home_lat?: number | null;
  homeLat?: number | null;
  home_lng?: number | null;
  homeLng?: number | null;
  legal?: LegalStatus | null;
};

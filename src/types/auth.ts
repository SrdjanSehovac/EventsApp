export type AuthUser = {
  user_id: string;
  email: string;
  display_name: string;
  home_lat?: number | null;
  home_lng?: number | null;
};

export type SignUpInput = {
  email: string;
  password: string;
  display_name: string;
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
};

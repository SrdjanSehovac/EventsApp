import { ApiError, apiRequest } from './client';
import { normalizeWebsite } from '../business/proof';
import type {
  BusinessApplyInput,
  BusinessKind,
  BusinessProfile,
  BusinessStatus,
} from '../types/business';
import { BUSINESS_KINDS } from '../types/business';

/**
 * Become-a-business contract (expected under `/v1`, Bearer required).
 *
 * DIGITAL proof only — EventServer should confirm the mailbox (and, when
 * possible, that the email domain matches the website). Do not require a
 * government ID upload or a face/selfie scan.
 *
 *   POST /me/business/apply
 *        { business_name, website, business_email, phone, city, kind }
 *        → BusinessProfile (or `{ item }` / `{ business }` / `{ application }`)
 *   GET  /me/business
 *        → same shape, or 404 when the user has no application
 *   POST /me/business/verify-email
 *        { token } from the email link, or { code } typed from the message
 *   POST /me/business/resend-verification
 *        optional { business_email }
 *
 * Status: pending_email → pending_review → verified | rejected
 *
 * If these routes 404/501, the client caches the application on-device the
 * same way Submit event does.
 */

export type VerifyBusinessEmailInput = {
  token?: string;
  code?: string;
};

type RawBusiness = Partial<BusinessProfile> & {
  id?: string;
  applicationId?: string;
  businessName?: string;
  businessEmail?: string;
  emailVerified?: boolean;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
  category?: string;
  what_you_are?: string;
};

type WrappedBusiness =
  | RawBusiness
  | {
      item?: RawBusiness;
      business?: RawBusiness;
      application?: RawBusiness;
      profile?: RawBusiness;
    };

function asKind(value: unknown): BusinessKind {
  const raw = String(value ?? '').toLowerCase();
  return (BUSINESS_KINDS as readonly string[]).includes(raw)
    ? (raw as BusinessKind)
    : 'other';
}

function asStatus(value: unknown): BusinessProfile['status'] {
  const raw = String(value ?? '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (
    raw === 'pending_email' ||
    raw === 'pendingemail' ||
    raw === 'email_pending' ||
    raw === 'awaiting_email' ||
    raw === 'unverified'
  ) {
    return 'pending_email';
  }
  if (
    raw === 'pending_review' ||
    raw === 'pendingreview' ||
    raw === 'in_review' ||
    raw === 'pending' ||
    raw === 'submitted' ||
    raw === 'under_review'
  ) {
    return 'pending_review';
  }
  if (raw === 'verified' || raw === 'approved' || raw === 'active') {
    return 'verified';
  }
  if (raw === 'rejected' || raw === 'declined' || raw === 'denied') {
    return 'rejected';
  }
  return 'pending_email';
}

function unwrap(raw: WrappedBusiness | null | undefined): RawBusiness {
  if (!raw || typeof raw !== 'object') return {};
  if ('item' in raw && raw.item) return raw.item;
  if ('business' in raw && raw.business) return raw.business;
  if ('application' in raw && raw.application) return raw.application;
  if ('profile' in raw && raw.profile) return raw.profile;
  return raw as RawBusiness;
}

function hasBusinessPayload(raw: WrappedBusiness | null | undefined): boolean {
  const data = unwrap(raw);
  return Boolean(
    data.application_id ||
      data.id ||
      data.applicationId ||
      data.business_name ||
      data.businessName ||
      data.status,
  );
}

export function asBusiness(
  raw: WrappedBusiness | null | undefined,
  fallback?: Partial<BusinessApplyInput>,
  source: BusinessProfile['source'] = 'server',
): BusinessProfile {
  const data = unwrap(raw);
  const status = asStatus(data.status);
  const emailVerified =
    data.email_verified ??
    data.emailVerified ??
    (status === 'pending_review' || status === 'verified');

  return {
    application_id: String(
      data.application_id ?? data.id ?? data.applicationId ?? `local-${Date.now()}`,
    ),
    business_name: data.business_name ?? data.businessName ?? fallback?.business_name ?? '',
    website: normalizeWebsite(data.website ?? fallback?.website ?? ''),
    business_email:
      data.business_email ?? data.businessEmail ?? fallback?.business_email ?? '',
    phone: data.phone ?? fallback?.phone ?? null,
    city: data.city ?? fallback?.city ?? '',
    kind: asKind(data.kind ?? data.type ?? data.category ?? data.what_you_are ?? fallback?.kind),
    status,
    email_verified: Boolean(emailVerified),
    bio: data.bio ?? null,
    rejection_reason: data.rejection_reason ?? data.rejectionReason ?? null,
    created_at: data.created_at ?? data.createdAt ?? new Date().toISOString(),
    updated_at: data.updated_at ?? data.updatedAt ?? null,
    source,
  };
}

function applyBody(input: BusinessApplyInput) {
  return {
    business_name: input.business_name,
    website: normalizeWebsite(input.website),
    business_email: input.business_email.trim(),
    phone: input.phone?.trim() || null,
    city: input.city,
    kind: input.kind,
  };
}

export async function fetchMyBusiness(
  signal?: AbortSignal,
): Promise<BusinessProfile | null> {
  try {
    const raw = await apiRequest<WrappedBusiness | null>({
      path: '/me/business',
      signal,
    });
    if (!hasBusinessPayload(raw)) return null;
    return asBusiness(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function applyAsBusiness(
  input: BusinessApplyInput,
): Promise<BusinessProfile> {
  const payload = await apiRequest<WrappedBusiness>({
    path: '/me/business/apply',
    method: 'POST',
    body: applyBody(input),
  });
  return asBusiness(payload, input);
}

export async function verifyBusinessEmail(
  input: VerifyBusinessEmailInput,
): Promise<BusinessProfile> {
  const token = input.token?.trim();
  const code = input.code?.trim();
  const payload = await apiRequest<WrappedBusiness>({
    path: '/me/business/verify-email',
    method: 'POST',
    body: {
      ...(token ? { token } : {}),
      ...(code ? { code } : {}),
    },
  });
  return asBusiness(payload);
}

export async function resendBusinessVerification(
  businessEmail?: string,
): Promise<void> {
  await apiRequest<void>({
    path: '/me/business/resend-verification',
    method: 'POST',
    body: businessEmail ? { business_email: businessEmail } : {},
  });
}

export function isMissingBusinessRoute(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 501);
}

export type { BusinessStatus };

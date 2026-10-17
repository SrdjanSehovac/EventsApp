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
 * Organizer verification (EventServer `/v1/me/business`, Bearer required).
 *
 *   GET  /me/business               → BusinessStatusOut (application_status "none" when no application)
 *   POST /me/business/apply         { business_name, website_url?, social_url?, business_email, phone?,
 *                                     city, organizer_type, description?, business_number? }
 *   POST /me/business/verify-email  {} sends a new code · { code } confirms it
 *
 * Status: pending_email → pending_review → approved (verified) | rejected. Every application
 * is reviewed by a person; nothing is auto-approved.
 */

export type VerifyBusinessEmailInput = {
  token?: string;
  code?: string;
};

type ServerProof = {
  business_name?: string;
  website_url?: string | null;
  business_email?: string;
  phone?: string | null;
  city?: string;
  organizer_type?: string | null;
  description?: string | null;
  social_url?: string | null;
  business_number?: string | null;
  email_verified_at?: string | null;
  admin_decision?: string | null;
  admin_notes?: string | null;
  decided_at?: string | null;
};

type ServerStatus = {
  posting_tier?: string;
  application_id?: string | null;
  application_status?: string;
  proof?: ServerProof | null;
  delivery?: string | null;
  organizer_suspended?: boolean;
};

function asKind(value: unknown): BusinessKind {
  const raw = String(value ?? '').toLowerCase();
  return (BUSINESS_KINDS as readonly string[]).includes(raw) ? (raw as BusinessKind) : 'business';
}

function asStatus(value: unknown, tier?: string): BusinessProfile['status'] {
  if (tier === 'verified_business') return 'verified';
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'approved' || raw === 'verified') return 'verified';
  if (raw === 'rejected' || raw === 'withdrawn') return 'rejected';
  if (raw === 'pending_review') return 'pending_review';
  return 'pending_email';
}

function hasBusinessPayload(raw: ServerStatus | null | undefined): boolean {
  if (!raw || typeof raw !== 'object') return false;
  if (raw.posting_tier === 'verified_business') return true;
  return Boolean(raw.application_id) && raw.application_status !== 'none';
}

export function asBusiness(
  raw: ServerStatus | null | undefined,
  fallback?: Partial<BusinessApplyInput>,
  source: BusinessProfile['source'] = 'server',
): BusinessProfile {
  const data = raw ?? {};
  const proof = data.proof ?? {};
  const status = asStatus(data.application_status, data.posting_tier);
  return {
    application_id: String(data.application_id ?? `local-${Date.now()}`),
    business_name: proof.business_name ?? fallback?.business_name ?? '',
    website: proof.website_url ?? fallback?.website ?? '',
    social_url: proof.social_url ?? fallback?.social_url ?? null,
    business_email: proof.business_email ?? fallback?.business_email ?? '',
    phone: proof.phone ?? fallback?.phone ?? null,
    city: proof.city ?? fallback?.city ?? '',
    kind: asKind(proof.organizer_type ?? fallback?.kind),
    description: proof.description ?? fallback?.description ?? null,
    business_number: proof.business_number ?? fallback?.business_number ?? null,
    status,
    email_verified: Boolean(proof.email_verified_at) || status === 'verified',
    bio: null,
    rejection_reason: status === 'rejected' ? proof.admin_notes ?? null : null,
    delivery: data.delivery ?? null,
    suspended: Boolean(data.organizer_suspended),
    created_at: proof.decided_at ?? new Date().toISOString(),
    updated_at: null,
    source,
  };
}

function applyBody(input: BusinessApplyInput) {
  const website = input.website.trim() ? normalizeWebsite(input.website) : null;
  const social = input.social_url?.trim() ? normalizeWebsite(input.social_url) : null;
  return {
    business_name: input.business_name.trim(),
    website_url: website,
    social_url: social,
    business_email: input.business_email.trim(),
    phone: input.phone?.trim() || null,
    city: input.city,
    organizer_type: input.kind,
    description: input.description?.trim() || null,
    business_number: input.business_number?.trim() || null,
  };
}

export async function fetchMyBusiness(
  signal?: AbortSignal,
): Promise<BusinessProfile | null> {
  try {
    const raw = await apiRequest<ServerStatus | null>({
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
  const payload = await apiRequest<ServerStatus>({
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
  const payload = await apiRequest<ServerStatus>({
    path: '/me/business/verify-email',
    method: 'POST',
    body: code || token ? { code: code || token } : {},
  });
  return asBusiness(payload);
}

export async function resendBusinessVerification(
  _businessEmail?: string,
): Promise<void> {
  await apiRequest<void>({
    path: '/me/business/verify-email',
    method: 'POST',
    body: {},
  });
}

export function isMissingBusinessRoute(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 501);
}

export type { BusinessStatus };

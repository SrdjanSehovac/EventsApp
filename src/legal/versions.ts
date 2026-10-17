import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { API_BASE_URL } from '../config/api';
import type { LegalAcceptanceInput } from '../types/auth';

/**
 * Must match EventServer api/legal/versions.py. Bump both (and the docs in
 * /legal) together; signed-in users are asked to accept again.
 */
export const LEGAL_VERSIONS = {
  terms_version: '2026-10-17',
  privacy_version: '2026-10-17',
  disclaimer_version: '2026-10-17',
} as const;

export const MINIMUM_AGE = 16;

export type LegalDoc = 'terms' | 'privacy' | 'disclaimer';

export const LEGAL_TITLES: Record<LegalDoc, string> = {
  terms: 'Terms of Use',
  privacy: 'Privacy Policy',
  disclaimer: 'Event Liability Disclaimer',
};

export function legalUrl(doc: LegalDoc): string {
  return `${API_BASE_URL || 'https://51-161-102-13.sslip.io'}/legal/${doc}`;
}

/** Payload for signup / accept once all three boxes are ticked. */
export function legalAcceptance(): LegalAcceptanceInput {
  return {
    ...LEGAL_VERSIONS,
    accept_terms_and_privacy: true,
    acknowledge_disclaimer: true,
    age_confirmed: true,
    app_version: Constants.expoConfig?.version ?? null,
    platform: Platform.OS,
  };
}

/** True when the signed-in user must (re)accept before using the app. */
export function needsLegalAcceptance(legal: { needs_acceptance?: boolean; terms_version?: string | null; privacy_version?: string | null; disclaimer_version?: string | null } | null | undefined): boolean {
  if (!legal) return true;
  if (legal.needs_acceptance) return true;
  return (
    legal.terms_version !== LEGAL_VERSIONS.terms_version ||
    legal.privacy_version !== LEGAL_VERSIONS.privacy_version ||
    legal.disclaimer_version !== LEGAL_VERSIONS.disclaimer_version
  );
}

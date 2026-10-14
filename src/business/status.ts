import type { BusinessProfile } from '../types/business';

export function organizerStatusLabel(profile: BusinessProfile | null | undefined): string | null {
  if (!profile) return null;
  if (profile.status === 'verified') return profile.suspended ? 'Posting paused' : 'Verified organizer';
  if (profile.status === 'rejected') return 'Application not approved';
  if (profile.status === 'pending_email') return 'Pending · confirm your email';
  return 'Pending review';
}

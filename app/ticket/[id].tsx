import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AddToCalendarButton, AuthScreen, QrCode } from '../../src/components';
import { formatTicketCode, ticketQrValue } from '../../src/api/rsvp';
import { useAuth, useCancelRegistration, useMyTicket } from '../../src/hooks';
import { useTheme } from '../../src/theme';
import { eventDetailHref } from '../../src/utils/eventDetail';
import { formatCardWhen } from '../../src/utils/eventFormat';
import { friendlyPublicError } from '../../src/utils/publicError';

export default function TicketScreen() {
  const { id, new: isNew } = useLocalSearchParams<{ id: string; new?: string }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { isSignedIn, status } = useAuth();
  const { ticket, isLoading, error } = useMyTicket(id);
  const cancel = useCancelRegistration();
  const [confirming, setConfirming] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (status === 'loading' || isLoading) {
    return (
      <AuthScreen title="Ticket">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }
  if (!isSignedIn || !ticket) {
    return (
      <AuthScreen
        title="Ticket"
        subtitle={error ? friendlyPublicError(error, 'Couldn’t load your ticket.') : 'No registration for this event.'}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(eventDetailHref(id))}
          style={[styles.button, { backgroundColor: colors.primary, borderRadius: radius.md }]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>Open event</Text>
        </Pressable>
      </AuthScreen>
    );
  }

  const confirmed = ticket.status === 'confirmed';
  const where = [ticket.venue_name, ticket.address, ticket.city].filter(Boolean).join(', ');

  async function onCancel() {
    setCancelError(null);
    try {
      await cancel.mutateAsync(id);
      router.replace(eventDetailHref(id));
    } catch (err) {
      setCancelError(friendlyPublicError(err, 'Couldn’t cancel. Please try again.'));
    }
  }

  return (
    <AuthScreen
      title={isNew ? (confirmed ? 'You’re registered!' : 'You’re on the waitlist') : confirmed ? 'Your ticket' : 'Waitlist'}
      subtitle={
        isNew
          ? confirmed
            ? 'It’s saved to your Saved calendar with a reminder. Show this QR code at the door.'
            : 'We’ll move you up automatically if a spot opens. It’s saved to your Saved calendar.'
          : undefined
      }
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Pressable accessibilityRole="link" onPress={() => router.push(eventDetailHref(id))}>
          <Text style={[typography.heading, { color: colors.text, fontSize: 19 }]}>{ticket.title}</Text>
        </Pressable>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
          {formatCardWhen(ticket.starts_at)}
        </Text>
        {where ? <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{where}</Text> : null}
        {ticket.organizer_name ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>Hosted by {ticket.organizer_name}</Text>
        ) : null}

        <View style={[styles.qrWrap, { marginTop: spacing.lg }]}>
          {confirmed ? (
            <QrCode value={ticketQrValue(ticket.ticket_code)} size={232} />
          ) : (
            <View style={[styles.waitBox, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}>
              <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
              <Text style={[typography.heading, { color: colors.text, marginTop: 6 }]}>
                #{ticket.waitlist_position ?? '—'} on the waitlist
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
                Your QR ticket appears here once you’re confirmed.
              </Text>
            </View>
          )}
          <Text style={[styles.code, { color: colors.text }]} selectable>
            {formatTicketCode(ticket.ticket_code)}
          </Text>
          {ticket.checked_in_at ? (
            <Text style={[typography.caption, { color: colors.success, fontWeight: '800' }]}>Checked in</Text>
          ) : (
            <Text style={[typography.caption, { color: colors.textMuted }]}>Ticket code · free registration</Text>
          )}
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <AddToCalendarButton
          event={{ title: ticket.title, starts_at: ticket.starts_at, ends_at: ticket.ends_at, location: where || null }}
        />
      </View>

      {!ticket.checked_in_at ? (
        <View style={{ marginTop: spacing.xl }}>
          {confirming ? (
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirming(false)}
                style={[styles.half, { borderColor: colors.border, borderRadius: radius.md }]}
              >
                <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>Keep it</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm cancel registration"
                onPress={() => void onCancel()}
                disabled={cancel.isPending}
                style={[styles.half, { backgroundColor: colors.danger, borderColor: colors.danger, borderRadius: radius.md }]}
              >
                {cancel.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[typography.body, { color: '#fff', fontWeight: '700' }]}>Yes, cancel</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel registration" onPress={() => setConfirming(true)} style={styles.link}>
              <Text style={[typography.body, { color: colors.danger, fontWeight: '700' }]}>
                {confirmed ? 'Cancel registration' : 'Leave the waitlist'}
              </Text>
            </Pressable>
          )}
          {cancelError ? <Text style={[typography.caption, { color: colors.danger, marginTop: 8 }]}>{cancelError}</Text> : null}
        </View>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  qrWrap: { alignItems: 'center', gap: 6 },
  waitBox: { width: 232, height: 232, alignItems: 'center', justifyContent: 'center', padding: 16 },
  code: { fontSize: 24, fontWeight: '800', letterSpacing: 3, marginTop: 6, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, minHeight: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});

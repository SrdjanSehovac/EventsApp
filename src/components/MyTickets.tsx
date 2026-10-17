import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { formatTicketCode } from '../api/rsvp';
import { useMyTickets } from '../hooks';
import { useTheme } from '../theme';
import { formatCardWhen } from '../utils/eventFormat';

/** "My tickets": upcoming free RSVPs. Hidden when there are none. */
export function MyTickets({ enabled }: { enabled: boolean }) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const query = useMyTickets(enabled);
  const now = Date.now();
  const items = (query.data ?? []).filter((t) => {
    const end = t.ends_at ?? t.starts_at;
    return !end || new Date(end).getTime() > now - 6 * 3600e3;
  });
  if (!items.length) return null;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.heading, { color: colors.text, fontSize: 18, marginBottom: spacing.sm }]}>
        My tickets ({items.length})
      </Text>
      {items.map((t) => (
        <Pressable
          key={t.registration_id}
          accessibilityRole="button"
          accessibilityLabel={`Ticket for ${t.title}`}
          onPress={() => router.push(`/ticket/${t.event_id}`)}
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primaryMuted, borderRadius: radius.md }]}>
            <Ionicons name={t.status === 'confirmed' ? 'qr-code-outline' : 'hourglass-outline'} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[typography.body, { color: colors.text, fontWeight: '700' }]}>{t.title}</Text>
            <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
              {formatCardWhen(t.starts_at)}
              {t.venue_name ? ` · ${t.venue_name}` : ''}
            </Text>
            <Text style={[typography.caption, { color: t.status === 'confirmed' ? colors.primary : colors.warning, fontWeight: '800' }]}>
              {t.status === 'confirmed'
                ? t.checked_in_at
                  ? 'Checked in'
                  : `Registered · ${formatTicketCode(t.ticket_code)}`
                : `Waitlist #${t.waitlist_position ?? '—'}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

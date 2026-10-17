import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { AuthScreen } from '../../src/components';
import { formatTicketCode, guestListCsv, type CheckInResult } from '../../src/api/rsvp';
import { useCheckIn, useGuestList } from '../../src/hooks';
import { useTheme } from '../../src/theme';
import { friendlyPublicError } from '../../src/utils/publicError';

/**
 * Organizer guest list + door check-in. The 1.1.0 build has no camera module,
 * so check-in is by typed ticket code (the code under the guest's QR).
 * Camera scanning (expo-camera) is flagged for the next native build.
 */
export default function GuestListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing, radius } = useTheme();
  const guests = useGuestList(id);
  const checkIn = useCheckIn(id);
  const [code, setCode] = useState('');
  const [filter, setFilter] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const items = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const all = guests.data?.items ?? [];
    if (!q) return all;
    return all.filter(
      (g) =>
        (g.name ?? '').toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.ticket_code.toLowerCase().includes(q.replace(/[^a-z0-9]/g, '')),
    );
  }, [guests.data, filter]);

  async function onCheckIn(raw = code) {
    if (!raw.trim()) return;
    setResult(null);
    try {
      const res: CheckInResult = await checkIn.mutateAsync(raw);
      const who = res.guest.name || res.guest.email;
      setResult({
        ok: true,
        text: res.result === 'checked_in' ? `✓ ${who} checked in` : `${who} was already checked in`,
      });
      setCode('');
    } catch (err) {
      setResult({ ok: false, text: friendlyPublicError(err, 'Couldn’t check in that code.') });
    }
  }

  async function onExport() {
    if (!guests.data) return;
    const csv = guestListCsv(guests.data);
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `guests-${id}.csv`;
      a.click();
      return;
    }
    await Share.share({ title: `Guest list – ${guests.data.title}`, message: csv });
  }

  if (guests.isLoading) {
    return (
      <AuthScreen title="Guest list">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }
  if (guests.error || !guests.data) {
    return <AuthScreen title="Guest list" subtitle={friendlyPublicError(guests.error, 'Couldn’t load the guest list.')}>{null}</AuthScreen>;
  }

  const g = guests.data;
  const stat = (label: string, value: string) => (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
      <Text style={[typography.heading, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <AuthScreen title="Guest list" subtitle={g.title}>
      <View style={styles.stats}>
        {stat('Registered', g.capacity ? `${g.confirmed}/${g.capacity}` : String(g.confirmed))}
        {stat('Checked in', String(g.checked_in))}
        {stat('Waitlist', String(g.waitlisted))}
      </View>

      <Text style={[typography.caption, styles.label, { color: colors.textMuted, marginTop: spacing.lg }]}>CHECK IN</Text>
      <View style={styles.row}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Ticket code, e.g. X9YY-T7TW"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={() => void onCheckIn()}
          returnKeyType="done"
          style={[typography.body, styles.input, { color: colors.text, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check in"
          onPress={() => void onCheckIn()}
          disabled={checkIn.isPending}
          style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.md }]}
        >
          {checkIn.isPending ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '800' }]}>Check in</Text>}
        </Pressable>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
        Type the code printed under the guest’s QR. Camera scanning comes with the next app update.
      </Text>
      {result ? (
        <Text style={[typography.body, { color: result.ok ? colors.success : colors.danger, fontWeight: '700', marginTop: 8 }]}>
          {result.text}
        </Text>
      ) : null}

      <View style={[styles.row, { marginTop: spacing.lg, alignItems: 'center' }]}>
        <Text style={[typography.caption, styles.label, { color: colors.textMuted, flex: 1 }]}>
          GUESTS ({g.items.length})
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Export CSV" onPress={() => void onExport()} style={styles.export}>
          <Ionicons name="download-outline" size={16} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>Export CSV</Text>
        </Pressable>
      </View>
      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Search name, email or code"
        placeholderTextColor={colors.textMuted}
        style={[typography.body, styles.input, { color: colors.text, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, marginTop: 6 }]}
      />
      {items.map((guest) => (
        <View key={guest.registration_id} style={[styles.guest, { borderColor: colors.border }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
              {guest.name || guest.email}
            </Text>
            <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
              {formatTicketCode(guest.ticket_code)}
              {guest.name ? ` · ${guest.email}` : ''}
            </Text>
          </View>
          {guest.status === 'waitlisted' ? (
            <Text style={[typography.caption, { color: colors.warning, fontWeight: '800' }]}>Waitlist</Text>
          ) : guest.checked_in_at ? (
            <Text style={[typography.caption, { color: colors.success, fontWeight: '800' }]}>✓ In</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Check in ${guest.name || guest.email}`}
              onPress={() => void onCheckIn(guest.ticket_code)}
              style={[styles.smallBtn, { borderColor: colors.primary, borderRadius: radius.full }]}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>Check in</Text>
            </Pressable>
          )}
        </View>
      ))}
      {g.items.length === 0 ? (
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.md }]}>No one has registered yet.</Text>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center' },
  label: { fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, minHeight: 46 },
  btn: { minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  export: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 },
  guest: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  smallBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
});

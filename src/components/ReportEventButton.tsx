import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { REPORT_REASONS, type ReportReason } from '../api/suggestions';
import { useAuth, useReportEvent } from '../hooks';
import { useTheme } from '../theme';
import { friendlyPublicError } from '../utils/publicError';

/** "Report event" link + sheet. Any signed-in user can report; admins review reports. */
export function ReportEventButton({ eventId }: { eventId: string }) {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const report = useReportEvent();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setReason(null);
    setDetails('');
    setError(null);
  }

  async function send() {
    if (!reason) return;
    setError(null);
    try {
      await report.mutateAsync({ eventId, reason, details });
      setSent(true);
      close();
    } catch (err) {
      setError(friendlyPublicError(err, "Couldn't send the report. Please try again."));
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Report event"
        disabled={sent}
        onPress={() => (isSignedIn ? setOpen(true) : router.push('/sign-in'))}
        style={[styles.link, { marginTop: spacing.xl }]}
        hitSlop={8}
      >
        <Ionicons name={sent ? 'checkmark-circle-outline' : 'flag-outline'} size={16} color={colors.textMuted} />
        <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700' }]}>
          {sent ? 'Thanks — we’ll take a look' : 'Report event'}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
          <Pressable
            onPress={() => undefined}
            style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.lg }]}
          >
            <Text style={[typography.heading, { color: colors.text, fontSize: 18, marginBottom: spacing.sm }]}>
              What’s wrong with this event?
            </Text>
            {REPORT_REASONS.map(([value, label]) => {
              const selected = reason === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setReason(value)}
                  style={styles.option}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                  <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
                </Pressable>
              );
            })}
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Anything else? (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
              style={[
                typography.body,
                styles.input,
                { color: colors.text, borderColor: colors.border, borderRadius: radius.md },
              ]}
            />
            {error ? <Text style={[typography.caption, { color: colors.danger, marginTop: 6 }]}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={close} style={styles.btn}>
                <Text style={[typography.body, { color: colors.textSecondary, fontWeight: '700' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send report"
                disabled={!reason || report.isPending}
                onPress={() => void send()}
                style={[
                  styles.btn,
                  { backgroundColor: colors.primary, borderRadius: radius.md, opacity: !reason ? 0.5 : 1 },
                ]}
              >
                {report.isPending ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>Send report</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', minHeight: 36 },
  backdrop: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  sheet: { padding: 18, maxWidth: 480, width: '100%', alignSelf: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  input: { borderWidth: StyleSheet.hairlineWidth, minHeight: 64, padding: 10, marginTop: 8, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  btn: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
});

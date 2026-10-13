import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { BusinessCard } from '../src/components/BusinessCard';
import { MySubmissions } from '../src/components/MySubmissions';
import {
  useAuth,
  useCalendarAutoSave,
  useFavourites,
  useMyBusiness,
  useMySubmissions,
} from '../src/hooks';
import {
  REMINDER_LEADS,
  ensureNotificationPermission,
  setReminderLeads,
  setRemindersEnabled,
} from '../src/reminders';
import { leadOptionLabel } from '../src/utils/savedPlan';
import { useReminderState } from '../src/reminders/useReminders';
import { useTheme } from '../src/theme';
import { openExternalUrl } from '../src/utils/eventDetail';
import { friendlyPublicError } from '../src/utils/publicError';

// Placeholders until the public pages exist.
const PRIVACY_URL = 'https://51-161-102-13.sslip.io/privacy';
const HELP_URL = 'mailto:support@ripkeed.com?subject=EventsApp%20help';

export default function SettingsScreen() {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const router = useRouter();
  const { user, isSignedIn, status, signOut, deleteAccount } = useAuth();
  const favourites = useFavourites(isSignedIn);
  const calendarAutoSave = useCalendarAutoSave();
  const reminders = useReminderState();
  const submissionsQuery = useMySubmissions(isSignedIn);
  const businessQuery = useMyBusiness(isSignedIn);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const initial = user?.display_name?.trim()?.[0]?.toUpperCase() ?? '?';
  const version = Constants.expoConfig?.version ?? '—';

  const card = [
    styles.card,
    shadows.soft,
    { backgroundColor: colors.surface, borderRadius: radius.lg },
  ];

  function Row({
    icon,
    label,
    onPress,
    detail,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    detail?: string;
  }) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.md, fontWeight: '600' }]}>
          {label}
        </Text>
        {detail ? <Text style={[typography.caption, { color: colors.textMuted, marginRight: 6 }]}>{detail}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  function Toggle({
    label,
    hint,
    value,
    onChange,
  }: {
    label: string;
    hint: string;
    value: boolean;
    onChange: (next: boolean) => void;
  }) {
    return (
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{label}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{hint}</Text>
        </View>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.primaryMuted }}
          thumbColor={value ? colors.primary : colors.surfaceElevated}
        />
      </View>
    );
  }

  const sectionTitle = (text: string) => (
    <Text style={[styles.section, { color: colors.primary }]}>{text}</Text>
  );

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteOpen(false);
      router.back();
    } catch (error) {
      Alert.alert(
        'Couldn’t delete account',
        friendlyPublicError(error, 'Account deletion isn’t available right now. Please try again later.'),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[typography.heading, { color: colors.text, marginLeft: spacing.sm }]}>
          Account & Settings
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
        <View style={[card, styles.profile]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
            {isSignedIn ? (
              <Text style={[typography.heading, { color: colors.primary }]}>{initial}</Text>
            ) : (
              <Ionicons name="person" size={22} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {status === 'loading' ? (
              <ActivityIndicator color={colors.primary} />
            ) : isSignedIn && user ? (
              <>
                <Text style={[typography.heading, { color: colors.text }]}>{user.display_name}</Text>
                <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>{user.email}</Text>
              </>
            ) : (
              <>
                <Text style={[typography.heading, { color: colors.text }]}>Not signed in</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Sign in to save events across devices.</Text>
              </>
            )}
          </View>
        </View>
        {!isSignedIn && status !== 'loading' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Pressable onPress={() => router.push('/sign-in')} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
              <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/sign-up')} style={[styles.btn, { borderColor: colors.border, borderWidth: 1, borderRadius: radius.full }]}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>Create account</Text>
            </Pressable>
          </View>
        ) : null}

        {sectionTitle('Reminders & calendar')}
        <View style={card}>
          <Toggle
            label="Event reminders"
            hint="Notifications before each saved event"
            value={reminders?.enabled ?? true}
            onChange={(next) => {
              void (async () => {
                if (next && !(await ensureNotificationPermission())) {
                  Alert.alert('Notifications are off', 'Allow notifications for this app in iPhone Settings to get reminders.');
                }
                await setRemindersEnabled(next, favourites.data?.items ?? []);
              })();
            }}
          />
          {(reminders?.enabled ?? true) ? (
            <View style={styles.leads}>
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                Remind me (pick any)
              </Text>
              <View style={styles.leadRow}>
                {REMINDER_LEADS.map((lead) => {
                  const chosen = reminders?.leads ?? [60];
                  const on = chosen.includes(lead);
                  return (
                    <Pressable
                      key={lead}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={leadOptionLabel(lead)}
                      onPress={() => {
                        const next = on ? chosen.filter((m) => m !== lead) : [...chosen, lead];
                        void (async () => {
                          if (!on) await ensureNotificationPermission();
                          await setReminderLeads(next, favourites.data?.items ?? []);
                        })();
                      }}
                      style={[
                        styles.leadChip,
                        {
                          borderRadius: radius.full,
                          borderColor: on ? colors.primary : colors.border,
                          backgroundColor: on ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {on ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
                      <Text style={{ fontWeight: '700', fontSize: 13, color: on ? colors.onPrimary : colors.text }}>
                        {leadOptionLabel(lead)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {(reminders?.leads ?? [60]).length === 0 ? (
                <Text style={[typography.caption, { color: colors.warning, marginTop: 8 }]}>
                  No times picked, so no reminders will be sent.
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={[styles.divider, { backgroundColor: colors.hairline }]} />
          <Toggle
            label="Show saved events on My calendar"
            hint="Hearted events appear on the Saved calendar by date"
            value={calendarAutoSave.enabled}
            onChange={(next) => void calendarAutoSave.setEnabled(next)}
          />
        </View>

        {sectionTitle('Post & promote')}
        <View>
          <BusinessCard
            profile={businessQuery.data}
            signedIn={isSignedIn}
            loading={isSignedIn && businessQuery.isLoading}
            onSignIn={() => router.push('/sign-in')}
          />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <MySubmissions
            items={submissionsQuery.data ?? []}
            signedIn={isSignedIn}
            onSignIn={() => router.push('/sign-in')}
          />
        </View>

        {sectionTitle('About')}
        <View style={card}>
          <Row icon="shield-checkmark-outline" label="Privacy policy" onPress={() => void openExternalUrl(PRIVACY_URL)} />
          <View style={[styles.divider, { backgroundColor: colors.hairline }]} />
          <Row icon="help-circle-outline" label="Help & feedback" onPress={() => void openExternalUrl(HELP_URL)} />
          <View style={[styles.divider, { backgroundColor: colors.hairline }]} />
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.md, fontWeight: '600' }]}>Version</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{version}</Text>
          </View>
          {__DEV__ ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.hairline }]} />
              <Row icon="construct-outline" label="Admin tools" onPress={() => router.push('/admin')} />
            </>
          ) : null}
        </View>

        {isSignedIn ? (
          <View style={{ marginTop: spacing.xxl, alignItems: 'center', gap: spacing.lg }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={() => void signOut()}
              style={[styles.btnWide, { borderColor: colors.border, borderWidth: 1, borderRadius: radius.full, backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.text, fontWeight: '800' }}>Sign out</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete account"
              onPress={() => {
                setConfirmText('');
                setDeleteOpen(true);
              }}
              hitSlop={8}
            >
              <Text style={{ color: colors.danger, fontWeight: '700' }}>Delete account</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={[styles.modalBack, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.background, borderRadius: radius.lg }]}>
            <Text style={[typography.heading, { color: colors.text }]}>Delete account?</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              This permanently deletes your account and your saved events. It can’t be undone. Type DELETE to confirm.
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="DELETE"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Type DELETE to confirm"
              style={[styles.input, typography.body, { color: colors.text, borderColor: colors.border, borderRadius: radius.md }]}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable onPress={() => setDeleteOpen(false)} style={[styles.btn, { borderColor: colors.border, borderWidth: 1, borderRadius: radius.full }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Permanently delete account"
                disabled={confirmText.trim() !== 'DELETE' || deleting}
                onPress={() => void confirmDelete()}
                style={[
                  styles.btn,
                  {
                    backgroundColor: colors.danger,
                    borderRadius: radius.full,
                    opacity: confirmText.trim() === 'DELETE' && !deleting ? 1 : 0.4,
                  },
                ]}
              >
                {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Delete</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  card: { paddingHorizontal: 14, paddingVertical: 4 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 8 },
  leads: { paddingBottom: 12 },
  leadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  leadChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  divider: { height: StyleSheet.hairlineWidth },
  btn: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  btnWide: { alignSelf: 'stretch', minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  modalBack: { flex: 1, justifyContent: 'center', padding: 24 },
  modal: { padding: 20 },
  input: { borderWidth: 1, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, letterSpacing: 2 },
});

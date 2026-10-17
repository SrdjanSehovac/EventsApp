import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField, AuthScreen, SelectField } from '../src/components';
import { PRODUCT_CITIES, buildCityOptions } from '../src/config/cities';
import { looksLikeWebsite, normalizeWebsite } from '../src/business/proof';
import { useAuth, useSuggestEvent } from '../src/hooks';
import { useTheme } from '../src/theme';
import { friendlyPublicError } from '../src/utils/publicError';
import { toIsoStart } from '../src/utils/startTime';

export default function SuggestEventScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { isSignedIn, status } = useAuth();
  const router = useRouter();
  const suggest = useSuggestEvent();
  const cityOptions = useMemo(() => buildCityOptions([], { includeAny: false }), []);

  const [title, setTitle] = useState('');
  const [city, setCity] = useState<string>(PRODUCT_CITIES[0].name);
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (title.trim().length < 4) return setError('Add the event’s name.');
    const startsAt = toIsoStart(date, time);
    if (!startsAt) return setError('Use a date like 09/20/2026 and a time like 19:00.');
    if (address.trim().length < 6) return setError('Add the street address.');
    if (link.trim() && !looksLikeWebsite(link)) return setError('That link doesn’t look like a web address.');
    try {
      await suggest.mutateAsync({
        title: title.trim(),
        city,
        venue_name: venue.trim() || null,
        address: address.trim(),
        starts_at: startsAt,
        link_url: link.trim() ? normalizeWebsite(link) : null,
        description: description.trim() || null,
      });
      setDone(true);
    } catch (err) {
      setError(friendlyPublicError(err, "Couldn't send that suggestion. Please try again."));
    }
  }

  const button = (label: string, onPress: () => void, busy = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={busy}
      style={[styles.button, { backgroundColor: colors.primary, borderRadius: radius.md, opacity: busy ? 0.7 : 1 }]}
    >
      {busy ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>{label}</Text>
      )}
    </Pressable>
  );

  if (status === 'loading') {
    return (
      <AuthScreen title="Suggest an event">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }
  if (!isSignedIn) {
    return (
      <AuthScreen title="Suggest an event" subtitle="Create a free account (or sign in) to suggest an event.">
        {button('Create account or sign in', () => router.push({ pathname: '/sign-up', params: { reason: 'post' } }))}
      </AuthScreen>
    );
  }
  if (done) {
    return (
      <AuthScreen
        title="Thanks!"
        subtitle="Your suggestion is private. Our team checks it, and if it’s a real public event we add it to the app. You can follow it in Contribute."
      >
        {button('Done', () => router.replace('/contribute'))}
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Suggest an event"
      subtitle="Know about something that isn’t listed? Tell us. It stays private until our team has checked it."
    >
      <AuthField label="EVENT NAME" value={title} onChangeText={setTitle} placeholder="Harbourfront Jazz Night" />
      <AuthField label="DATE" value={date} onChangeText={setDate} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
      <AuthField label="START TIME" value={time} onChangeText={setTime} placeholder="19:00" keyboardType="numbers-and-punctuation" />
      <AuthField label="VENUE (OPTIONAL)" value={venue} onChangeText={setVenue} placeholder="The Rex" autoCapitalize="words" />
      <AuthField label="STREET ADDRESS" value={address} onChangeText={setAddress} placeholder="194 Queen St W" />
      <SelectField
        label="City"
        placeholder="Toronto"
        value={city}
        options={cityOptions}
        searchable
        searchPlaceholder="Search cities…"
        onChange={(next) => {
          if (next) setCity(next);
        }}
      />
      <Text style={{ height: spacing.lg }} />
      <AuthField
        label="LINK (OPTIONAL)"
        value={link}
        onChangeText={setLink}
        placeholder="Where you saw it"
        autoCapitalize="none"
        keyboardType="url"
      />
      <AuthField
        label="DETAILS (OPTIONAL)"
        value={description}
        onChangeText={setDescription}
        placeholder="Anything that helps us check it"
        multiline
      />
      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>
      ) : null}
      {button('Send suggestion', () => void onSubmit(), suggest.isPending)}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});

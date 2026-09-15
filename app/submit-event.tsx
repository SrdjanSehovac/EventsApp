import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ApiError } from '../src/api/client';
import { AuthField, AuthScreen, EventMediaFields } from '../src/components';
import { SW_ONTARIO_CITIES } from '../src/config/cities';
import { useAuth, useCategories, useMyBusiness } from '../src/hooks';
import { useSubmitEvent } from '../src/hooks/submissions';
import { colorForCategory, useTheme } from '../src/theme';

const FALLBACK_CATEGORIES = [
  { slug: 'music', name: 'Music' },
  { slug: 'food', name: 'Food & Drink' },
  { slug: 'arts', name: 'Arts' },
  { slug: 'sports', name: 'Sports' },
  { slug: 'comedy', name: 'Comedy' },
  { slug: 'community', name: 'Community' },
];

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Could not submit event.';
}

function toIsoStart(dateRaw: string, timeRaw: string): string | null {
  const date = dateRaw.trim();
  const time = timeRaw.trim() || '19:00';
  let isoDate: string | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    isoDate = date;
  } else {
    const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      isoDate = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
  }
  if (!isoDate) return null;

  const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!timeMatch) return null;
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  return `${isoDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

export default function SubmitEventScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { isSignedIn, status } = useAuth();
  const router = useRouter();
  const submit = useSubmitEvent();
  const categoriesQuery = useCategories();
  const businessQuery = useMyBusiness(isSignedIn);
  const verifiedBusiness =
    businessQuery.data?.status === 'verified' ? businessQuery.data : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState<string>(SW_ONTARIO_CITIES[0]);
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [bio, setBio] = useState('');

  const categories = useMemo(() => {
    const items = categoriesQuery.data?.items ?? [];
    if (items.length === 0) return FALLBACK_CATEGORIES;
    return items.map((item) => ({ slug: item.slug, name: item.name }));
  }, [categoriesQuery.data]);

  const selectedCategory = categories.find((item) => item.slug === categorySlug);

  async function onSubmit() {
    setError(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const startsAt = toIsoStart(date, time);
    if (!startsAt) {
      setError('Use a start date like 09/20/2026 and a time like 19:00.');
      return;
    }
    const priceCad = isFree ? 0 : Number(price);
    if (!isFree && (!Number.isFinite(priceCad) || priceCad < 0)) {
      setError('Enter a price in CAD, or mark the event as free.');
      return;
    }

    try {
      await submit.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        city,
        venue_name: venue.trim(),
        address: address.trim(),
        starts_at: startsAt,
        is_free: isFree,
        price_cad: isFree ? 0 : priceCad,
        category_slug: categorySlug,
        category_name: selectedCategory?.name ?? null,
        photo_urls: verifiedBusiness ? photoUrls : undefined,
        video_url: verifiedBusiness ? videoUrl.trim() || null : undefined,
        bio: verifiedBusiness ? bio.trim() || null : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (status === 'loading') {
    return (
      <AuthScreen title="Submit event">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <AuthScreen
        title="Submit event"
        subtitle="Sign in to send an event for the catalogue."
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={() => router.push('/sign-in')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Sign in
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  if (done) {
    return (
      <AuthScreen title="Submitted" subtitle="Thanks — it will show under My submissions on Profile.">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to profile"
          onPress={() => router.replace('/profile')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Back to Profile
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Submit event"
      subtitle={
        verifiedBusiness
          ? `Posting as ${verifiedBusiness.business_name}. Add photos, an optional clip, and a short bio.`
          : 'Share a night out, market, or show. We’ll keep it on Profile while EventServer reviews it.'
      }
    >
      <AuthField
        label="TITLE"
        value={title}
        onChangeText={setTitle}
        placeholder="Harbourfront Jazz Night"
      />
      <AuthField
        label="DESCRIPTION"
        value={description}
        onChangeText={setDescription}
        placeholder="What’s happening?"
        multiline
        style={{ minHeight: 96, textAlignVertical: 'top' }}
      />

      <Text
        style={[
          typography.caption,
          { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6, marginBottom: spacing.sm },
        ]}
      >
        CITY
      </Text>
      <View style={[styles.chipRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {SW_ONTARIO_CITIES.map((name) => {
          const selected = city === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCity(name)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: selected ? colors.onPrimary : colors.textSecondary, fontWeight: '700' },
                ]}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AuthField
        label="VENUE"
        value={venue}
        onChangeText={setVenue}
        placeholder="Harbourfront Centre"
      />
      <AuthField
        label="ADDRESS"
        value={address}
        onChangeText={setAddress}
        placeholder="235 Queens Quay W"
      />
      <AuthField
        label="START DATE"
        value={date}
        onChangeText={setDate}
        placeholder="MM/DD/YYYY"
      />
      <AuthField
        label="START TIME"
        value={time}
        onChangeText={setTime}
        placeholder="19:00"
      />

      <Text
        style={[
          typography.caption,
          { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6, marginBottom: spacing.sm },
        ]}
      >
        CATEGORY
      </Text>
      <View style={[styles.chipRow, { marginBottom: spacing.lg, gap: spacing.sm }]}>
        {categories.map((category) => {
          const selected = categorySlug === category.slug;
          const color = colorForCategory(category);
          return (
            <Pressable
              key={category.slug}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategorySlug(selected ? null : category.slug)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? color : colors.surface,
                  borderColor: color,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: selected ? '#FFFFFF' : color, fontWeight: '700' },
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isFree }}
        onPress={() => setIsFree((prev) => !prev)}
        style={[styles.freeRow, { marginBottom: spacing.lg }]}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: isFree ? colors.primary : colors.border,
              backgroundColor: isFree ? colors.primary : 'transparent',
            },
          ]}
        >
          {isFree ? (
            <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: '700' }}>✓</Text>
          ) : null}
        </View>
        <Text style={[typography.body, { color: colors.text, marginLeft: spacing.sm }]}>
          Free event
        </Text>
      </Pressable>

      {isFree ? null : (
        <AuthField
          label="PRICE (CAD)"
          value={price}
          onChangeText={setPrice}
          placeholder="25"
          keyboardType="decimal-pad"
        />
      )}

      {verifiedBusiness ? (
        <EventMediaFields
          photoUrls={photoUrls}
          onChangePhotos={setPhotoUrls}
          videoUrl={videoUrl}
          onChangeVideo={setVideoUrl}
          bio={bio}
          onChangeBio={setBio}
        />
      ) : null}

      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginBottom: spacing.md }]}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Submit event"
        onPress={() => void onSubmit()}
        disabled={submit.isPending}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            opacity: submit.isPending ? 0.7 : 1,
          },
        ]}
      >
        {submit.isPending ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Submit event
          </Text>
        )}
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

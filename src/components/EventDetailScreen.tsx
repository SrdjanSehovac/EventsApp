import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useEvent } from '../hooks';
import { colorForCategory, tintForCategory, useTheme } from '../theme';
import {
  asLabelList,
  collectPhotoUrls,
  detailToListItem,
  eventCoords,
  formatDetailPrice,
  formatFullAddress,
  formatOccurrenceLine,
  formatScheduleLines,
  formatVenueName,
  mapsSearchUrl,
  openExternalUrl,
  uniqueUrls,
} from '../utils/eventDetail';
import { EventMapSnippet } from './EventMapSnippet';
import { FavouriteButton } from './FavouriteButton';

type EventDetailScreenProps = {
  eventId: string;
};

function Chip({
  label,
  color,
  background,
}: {
  label: string;
  color: string;
  background: string;
}) {
  const { typography } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text
        style={[
          typography.caption,
          { color, fontWeight: '800', fontSize: 12 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              fontWeight: '800',
              letterSpacing: 0.4,
            },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function EventDetailScreen({ eventId }: EventDetailScreenProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const query = useEvent(eventId);
  const detail = query.data;
  const [heroFailed, setHeroFailed] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [failedThumbs, setFailedThumbs] = useState<Record<number, boolean>>({});

  const photos = useMemo(
    () => (detail ? collectPhotoUrls(detail) : []),
    [detail],
  );
  const heroUrl = photos[heroIndex] ?? photos[0] ?? null;
  const listItem = detail ? detailToListItem(detail) : null;
  const primaryCategory =
    detail?.categories.find((c) => c.is_primary) ?? detail?.categories[0] ?? null;
  const categoryColor = colorForCategory(primaryCategory);
  const coords = detail ? eventCoords(detail) : null;
  const venueName = detail ? formatVenueName(detail) : null;
  const address = detail ? formatFullAddress(detail) : null;
  const price = detail ? formatDetailPrice(detail) : null;
  const scheduleLines = detail ? formatScheduleLines(detail) : [];
  const extraCategories = (detail?.categories ?? []).filter(
    (c) => c.category_id !== primaryCategory?.category_id,
  );
  const tags = asLabelList(detail?.tags);
  const vibes = asLabelList(detail?.vibe);
  const audience = asLabelList(detail?.audience);
  const performers = asLabelList(detail?.performers);
  const ticketUrl = detail?.ticket_url?.trim() || null;
  const sourceUrl = detail?.source_url?.trim() || null;
  const externalUrl = detail?.external_url?.trim() || null;
  const videoUrl = detail?.video_url?.trim() || null;
  const linkUrls = uniqueUrls(ticketUrl, sourceUrl, externalUrl, videoUrl);
  const description =
    detail?.description?.trim() ||
    detail?.bio?.trim() ||
    detail?.summary?.trim() ||
    null;
  const bio =
    detail?.bio?.trim() &&
    detail.bio.trim() !== detail.description?.trim() &&
    detail.bio.trim() !== detail.summary?.trim()
      ? detail.bio.trim()
      : null;
  const summary =
    detail?.summary?.trim() &&
    detail.summary.trim() !== detail.description?.trim()
      ? detail.summary.trim()
      : null;

  async function shareEvent() {
    if (!detail) return;
    const url = ticketUrl || sourceUrl || externalUrl;
    const message = url ? `${detail.title}\n${url}` : detail.title;
    await Share.share({ title: detail.title, message, url: url ?? undefined });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const mapsLabel = [venueName, address].filter(Boolean).join(', ');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            linkUrls.length > 0 ? 108 + insets.bottom : spacing.xxxl,
        }}
      >
        <View style={styles.hero}>
          {heroUrl && !heroFailed ? (
            <Image
              source={{ uri: heroUrl }}
              style={styles.heroImage}
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.heroImage,
                styles.heroFallback,
                {
                  backgroundColor: primaryCategory
                    ? tintForCategory(primaryCategory, '33')
                    : colors.primaryMuted,
                },
              ]}
            >
              <Ionicons
                name="calendar"
                size={48}
                color={primaryCategory ? categoryColor : colors.primary}
              />
            </View>
          )}
          <View
            style={[
              styles.heroScrim,
              { paddingTop: insets.top + 8 },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              hitSlop={8}
              style={[
                styles.roundBtn,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.heroActions}>
              {listItem ? (
                <FavouriteButton item={listItem} variant="overlay" />
              ) : null}
              {detail ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share event"
                  onPress={shareEvent}
                  style={[
                    styles.roundBtn,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons
                    name="share-outline"
                    size={18}
                    color={colors.text}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {query.isLoading && !detail ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : query.error ? (
          <Text
            style={[
              typography.body,
              { color: colors.danger, padding: spacing.lg },
            ]}
          >
            {query.error instanceof Error
              ? query.error.message
              : 'Could not load this event.'}
          </Text>
        ) : detail ? (
          <View style={[styles.body, { paddingHorizontal: spacing.lg }]}>
            <View style={styles.chipRow}>
              {primaryCategory ? (
                <Chip
                  label={primaryCategory.name}
                  color="#FFFFFF"
                  background={categoryColor}
                />
              ) : null}
              {price ? (
                <Chip
                  label={price}
                  color={colors.primary}
                  background={colors.primaryMuted}
                />
              ) : null}
              {detail.status && detail.status !== 'active' ? (
                <Chip
                  label={detail.status}
                  color={colors.danger}
                  background={`${colors.danger}22`}
                />
              ) : null}
            </View>

            <Text
              style={[
                typography.title,
                { color: colors.text, marginTop: spacing.md, fontSize: 24 },
              ]}
            >
              {detail.title}
            </Text>
            {detail.series_name ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: spacing.xs },
                ]}
              >
                {detail.series_name}
              </Text>
            ) : null}

            {photos.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gallery}
              >
                {photos.map((url, index) =>
                  failedThumbs[index] ? null : (
                    <Pressable
                      key={`${url}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Photo ${index + 1}`}
                      onPress={() => {
                        setHeroIndex(index);
                        setHeroFailed(false);
                      }}
                      style={[
                        styles.thumb,
                        {
                          borderColor:
                            index === heroIndex
                              ? colors.primary
                              : colors.border,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.thumbImage}
                        onError={() =>
                          setFailedThumbs((prev) => ({ ...prev, [index]: true }))
                        }
                      />
                    </Pressable>
                  ),
                )}
              </ScrollView>
            ) : null}

            <Section icon="time-outline" title="When">
              {scheduleLines.map((line) => (
                <Text
                  key={line}
                  style={[
                    typography.body,
                    { color: colors.text, marginTop: 4 },
                  ]}
                >
                  {line}
                </Text>
              ))}
              {detail.occurrences?.length > 1
                ? detail.occurrences.map((occurrence) => (
                    <Text
                      key={occurrence.occurrence_id}
                      style={[
                        typography.caption,
                        {
                          color: colors.textSecondary,
                          marginTop: spacing.sm,
                        },
                      ]}
                    >
                      {formatOccurrenceLine(occurrence, detail.timezone)}
                    </Text>
                  ))
                : null}
            </Section>

            <Section icon="location-outline" title="Where">
              <Text
                style={[
                  typography.body,
                  { color: colors.text, fontWeight: '700' },
                ]}
              >
                {venueName || 'Location TBD'}
              </Text>
              {address ? (
                <Text
                  style={[
                    typography.body,
                    { color: colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  {address}
                </Text>
              ) : null}
              {coords ? (
                <View style={{ marginTop: spacing.md }}>
                  <EventMapSnippet
                    latitude={coords.lat}
                    longitude={coords.lng}
                    label={mapsLabel}
                    onPress={() =>
                      void openExternalUrl(
                        mapsSearchUrl(coords.lat, coords.lng, mapsLabel),
                      )
                    }
                  />
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.textMuted,
                        marginTop: 6,
                        fontWeight: '500',
                      },
                    ]}
                  >
                    Map © OpenStreetMap
                  </Text>
                </View>
              ) : null}
            </Section>

            {description ? (
              <Section icon="document-text-outline" title="About">
                {summary && summary !== description ? (
                  <Text
                    style={[
                      typography.body,
                      {
                        color: colors.textSecondary,
                        fontWeight: '600',
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    {summary}
                  </Text>
                ) : null}
                <Text style={[typography.body, { color: colors.text }]}>
                  {description}
                </Text>
                {bio ? (
                  <Text
                    style={[
                      typography.body,
                      { color: colors.textSecondary, marginTop: spacing.md },
                    ]}
                  >
                    {bio}
                  </Text>
                ) : null}
              </Section>
            ) : null}

            {extraCategories.length ||
            tags.length ||
            vibes.length ||
            audience.length ||
            performers.length ||
            detail.setting ||
            detail.age_restriction ||
            detail.accessibility_notes ||
            detail.is_pet_friendly ||
            detail.rain_or_shine ? (
              <Section icon="pricetag-outline" title="Details">
                <View style={styles.chipRow}>
                  {extraCategories.map((category) => (
                    <Chip
                      key={category.category_id}
                      label={category.name}
                      color={colorForCategory(category)}
                      background={tintForCategory(category, '22')}
                    />
                  ))}
                  {detail.setting &&
                  ![primaryCategory, ...extraCategories].some(
                    (category) =>
                      category &&
                      (category.slug === detail.setting ||
                        category.name.toLowerCase() ===
                          detail.setting?.toLowerCase()),
                  ) ? (
                    <Chip
                      label={detail.setting}
                      color={colors.textSecondary}
                      background={colors.surfaceElevated}
                    />
                  ) : null}
                  {detail.age_restriction ? (
                    <Chip
                      label={detail.age_restriction}
                      color={colors.textSecondary}
                      background={colors.surfaceElevated}
                    />
                  ) : null}
                  {detail.is_pet_friendly ? (
                    <Chip
                      label="Pet friendly"
                      color={colors.primary}
                      background={colors.primaryMuted}
                    />
                  ) : null}
                  {detail.rain_or_shine ? (
                    <Chip
                      label="Rain or shine"
                      color={colors.primary}
                      background={colors.primaryMuted}
                    />
                  ) : null}
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      color={colors.textSecondary}
                      background={colors.surfaceElevated}
                    />
                  ))}
                  {vibes.map((vibe) => (
                    <Chip
                      key={vibe}
                      label={vibe}
                      color={colors.textSecondary}
                      background={colors.surfaceElevated}
                    />
                  ))}
                  {audience.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      color={colors.textSecondary}
                      background={colors.surfaceElevated}
                    />
                  ))}
                </View>
                {performers.length ? (
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text, marginTop: spacing.md },
                    ]}
                  >
                    {performers.join(' · ')}
                  </Text>
                ) : null}
                {detail.accessibility_notes ? (
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.textSecondary,
                        marginTop: spacing.md,
                      },
                    ]}
                  >
                    {detail.accessibility_notes}
                  </Text>
                ) : null}
              </Section>
            ) : null}

            {linkUrls.length ? (
              <Section icon="link-outline" title="Links">
                {ticketUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => void openExternalUrl(ticketUrl)}
                    style={styles.linkRow}
                  >
                    <Ionicons
                      name="ticket-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        typography.body,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      Get tickets
                    </Text>
                  </Pressable>
                ) : null}
                {sourceUrl && sourceUrl !== ticketUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => void openExternalUrl(sourceUrl)}
                    style={styles.linkRow}
                  >
                    <Ionicons
                      name="open-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        typography.body,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      Source / website
                    </Text>
                  </Pressable>
                ) : null}
                {externalUrl &&
                externalUrl !== ticketUrl &&
                externalUrl !== sourceUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => void openExternalUrl(externalUrl)}
                    style={styles.linkRow}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        typography.body,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      More info
                    </Text>
                  </Pressable>
                ) : null}
                {videoUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => void openExternalUrl(videoUrl)}
                    style={styles.linkRow}
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        typography.body,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      Watch video
                    </Text>
                  </Pressable>
                ) : null}
              </Section>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {detail && (ticketUrl || sourceUrl) ? (
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.hairline,
            },
          ]}
        >
          {sourceUrl && ticketUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open source website"
              onPress={() => void openExternalUrl(sourceUrl)}
              style={[
                styles.secondaryCta,
                { borderColor: colors.border, borderRadius: radius.full },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: colors.text, fontWeight: '800' },
                ]}
              >
                Website
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ticketUrl ? 'Get tickets' : 'Open source'}
            onPress={() => void openExternalUrl(ticketUrl || sourceUrl)}
            style={[
              styles.primaryCta,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={[
                typography.body,
                { color: colors.onPrimary, fontWeight: '800' },
              ]}
            >
              {ticketUrl ? 'Get tickets' : 'Open source'}
            </Text>
          </Pressable>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    height: 280,
    position: 'relative',
    backgroundColor: '#1C1917',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingTop: 16,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gallery: {
    marginTop: 16,
    gap: 8,
    paddingRight: 8,
  },
  thumb: {
    width: 72,
    height: 72,
    overflow: 'hidden',
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryCta: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCta: {
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

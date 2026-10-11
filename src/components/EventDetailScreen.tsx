import { useEffect, useMemo, useState, type ReactNode } from 'react';
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

import { useOpenTickets } from '../checkout/TicketCheckoutProvider';
import { useEvent } from '../hooks';
import { colorForCategory, tintForCategory, useTheme } from '../theme';
import {
  asLabelList,
  collectPhotoUrls,
  detailToListItem,
  eventCoords,
  formatAboutBody,
  formatActionLabel,
  hostedByLine,
  formatDetailPrice,
  formatOccurrenceLine,
  formatPlaceLines,
  formatScheduleLines,
  isSchemaOrgType,
  mapsSearchUrl,
  openExternalUrl,
} from '../utils/eventDetail';
import { formatSaleBadge } from '../utils/eventFormat';
import {
  allowedOutboundUrl,
  isBlockedSourceLabel,
  resolveOutboundLink,
  sanitizePublicText,
  visibleLabels,
} from '../utils/outboundLinks';
import { parseImageFallback } from '../utils/imageFallback';
import { EventMapSnippet } from './EventMapSnippet';
import { FavouriteButton } from './FavouriteButton';
import { ImageFallbackTile } from './ImageFallbackTile';

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
  const openTickets = useOpenTickets();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const query = useEvent(eventId);
  const detail = query.data;
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    setHeroFailed(false);
  }, [eventId]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [failedThumbs, setFailedThumbs] = useState<Record<number, boolean>>({});

  const photos = useMemo(
    () => (detail ? collectPhotoUrls(detail) : []),
    [detail],
  );
  const heroUrl = photos[heroIndex] ?? photos[0] ?? null;
  const showPhoto = Boolean(heroUrl && !heroFailed);
  const imageTile = showPhoto ? null : parseImageFallback(detail?.image_fallback);
  const listItem = detail ? detailToListItem(detail) : null;
  const primaryCategory =
    detail?.categories.find((c) => c.is_primary) ?? detail?.categories[0] ?? null;
  const categoryColor = colorForCategory(primaryCategory);
  const coords = detail ? eventCoords(detail) : null;
  const place = detail ? formatPlaceLines(detail) : { name: null, address: null };
  const price = detail ? sanitizePublicText(formatDetailPrice(detail)) : null;
  const saleLabel = listItem ? formatSaleBadge(listItem) : null;
  const scheduleLines = detail ? formatScheduleLines(detail) : [];
  const occurrenceLines =
    detail && detail.occurrences && detail.occurrences.length > 1
      ? detail.occurrences
          .map((occurrence) => formatOccurrenceLine(occurrence, detail.timezone))
          .filter((line, index, all) => line !== scheduleLines[0] && all.indexOf(line) === index)
      : [];
  const extraCategories = (detail?.categories ?? []).filter(
    (c) => c.category_id !== primaryCategory?.category_id,
  );
  const publicLabels = (value: unknown) =>
    visibleLabels(asLabelList(value)).filter((label) => !isSchemaOrgType(label));
  const tags = publicLabels(detail?.tags);
  const vibes = publicLabels(detail?.vibe);
  const audience = publicLabels(detail?.audience);
  const performers = publicLabels(detail?.performers);
  const outbound = detail ? resolveOutboundLink(detail) : null;
  const actionLabel = outbound ? formatActionLabel(outbound.label, price) : null;
  const videoUrl = allowedOutboundUrl(detail?.video_url);
  const about = detail ? formatAboutBody(detail) : null;
  const seriesName = sanitizePublicText(detail?.series_name);
  const hostedBy = hostedByLine(detail?.organizer_name);

  async function shareEvent() {
    if (!detail) return;
    const url =
      allowedOutboundUrl(detail.external_url) ?? outbound?.url ?? null;
    const message = url ? `${detail.title}\n${url}` : detail.title;
    await Share.share({ title: detail.title, message, url: url ?? undefined });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const mapsLabel = [place.name, place.address].filter(Boolean).join(', ');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: outbound ? 120 + insets.bottom : spacing.xxxl,
        }}
      >
        <View style={showPhoto || imageTile ? styles.hero : styles.heroCompact}>
          {showPhoto ? (
            <Image
              source={{ uri: heroUrl!, cache: 'force-cache' }}
              style={styles.heroImage}
              resizeMode="cover"
              resizeMethod="resize"
              onError={() => setHeroFailed(true)}
            />
          ) : imageTile ? (
            <ImageFallbackTile tile={imageTile} />
          ) : (
            <View
              style={[
                styles.heroFallback,
                {
                  backgroundColor: colors.surface,
                  paddingTop: insets.top + 64,
                },
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: categoryColor, opacity: 0.18 },
                ]}
              />
              {detail?.title ? (
                <Text
                  numberOfLines={3}
                  style={[
                    typography.heading,
                    styles.heroTitle,
                    { color: colors.text },
                  ]}
                >
                  {detail.title}
                </Text>
              ) : null}
              {hostedBy ? (
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: spacing.xs },
                  ]}
                >
                  {hostedBy}
                </Text>
              ) : null}
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
              {primaryCategory && !isBlockedSourceLabel(primaryCategory.name) ? (
                <Chip
                  label={primaryCategory.name}
                  color="#FFFFFF"
                  background={categoryColor}
                />
              ) : null}
              {saleLabel ? (
                <Chip
                  label={saleLabel}
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

            {showPhoto || imageTile ? (
              <Text
                style={[
                  typography.title,
                  { color: colors.text, marginTop: spacing.md, fontSize: 24 },
                ]}
              >
                {detail.title}
              </Text>
            ) : null}
            {(showPhoto || imageTile) && hostedBy ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginTop: spacing.xs },
                ]}
              >
                {hostedBy}
              </Text>
            ) : null}
            {seriesName && !isBlockedSourceLabel(seriesName) ? (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: spacing.xs },
                ]}
              >
                {seriesName}
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
                        source={{ uri: url, cache: 'force-cache' }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                        resizeMethod="resize"
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
                ? occurrenceLines.map((line) => (
                    <Text
                      key={line}
                      style={[
                        typography.caption,
                        {
                          color: colors.textSecondary,
                          marginTop: spacing.sm,
                        },
                      ]}
                    >
                      {line}
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
                {place.name || place.address || 'Location TBD'}
              </Text>
              {place.name && place.address ? (
                <Text
                  style={[
                    typography.body,
                    { color: colors.textSecondary, marginTop: 4 },
                  ]}
                >
                  {place.address}
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

            {about ? (
              <Section icon="document-text-outline" title="About">
                <Text style={[typography.body, { color: colors.text }]}>
                  {about}
                </Text>
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
                  {extraCategories.filter((category) => !isBlockedSourceLabel(category.name)).map((category) => (
                    <Chip
                      key={category.category_id}
                      label={category.name}
                      color={colorForCategory(category)}
                      background={tintForCategory(category, '22')}
                    />
                  ))}
                  {detail.setting &&
                  !isSchemaOrgType(detail.setting) &&
                  !isBlockedSourceLabel(detail.setting) &&
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
                {sanitizePublicText(detail.accessibility_notes) ? (
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.textSecondary,
                        marginTop: spacing.md,
                      },
                    ]}
                  >
                    {sanitizePublicText(detail.accessibility_notes)}
                  </Text>
                ) : null}
              </Section>
            ) : null}

            {videoUrl ? (
              <Section icon="link-outline" title="Links">
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
              </Section>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {outbound ? (
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.hairline,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel ?? outbound.label}
            onPress={() => {
              if (!detail || !listItem) return;
              openTickets({
                url: outbound.url,
                event: detail,
                item: listItem,
              });
            }}
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
              {actionLabel}
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
  scroll: {
    flex: 1,
  },
  hero: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1C1917',
  },
  heroCompact: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroFallback: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    minHeight: 148,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
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
    position: 'relative',
  },
  thumbImage: {
    ...StyleSheet.absoluteFill,
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
});

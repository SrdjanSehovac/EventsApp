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

import { openInAppBrowser } from '../checkout/openInAppBrowser';
import { useOpenTickets } from '../checkout/TicketCheckoutProvider';
import { useRequireAccount } from '../auth';
import { useAuth, useEvent, useMyTicket, useRegisterForEvent } from '../hooks';
import { rsvpState } from '../utils/rsvpFormat';
import { colorForCategory, tintForCategory, useTheme } from '../theme';
import {
  asLabelList,
  collectPhotoUrls,
  detailToListItem,
  eventCoords,
  formatAboutBody,
  formatActionLabel,
  hostedByLine,
  organizerPageUrl,
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
  allowedOutboundUrl, platformFreeUrl,
  isBlockedSourceLabel,
  resolveOutboundLink,
  sanitizePublicText,
  visibleLabels,
} from '../utils/outboundLinks';
import { eventPhase } from '../utils/eventLive';
import { friendlyPublicError } from '../utils/publicError';
import { parseImageFallback } from '../utils/imageFallback';
import { EventMapSnippet } from './EventMapSnippet';
import { AddToCalendarButton } from './AddToCalendarButton';
import { FavouriteButton } from './FavouriteButton';
import { ImageFallbackTile } from './ImageFallbackTile';
import { PhotoViewer } from './PhotoViewer';
import { ReportEventButton } from './ReportEventButton';
import { VerifiedBadge } from './VerifiedBadge';
import { largestImageUrl } from '../utils/imageUrl';

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

function AboutCopy({ text }: { text: string }) {
  const { colors, typography, spacing } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState<number | null>(null);

  useEffect(() => {
    setExpanded(false);
    setLines(null);
  }, [text]);

  const collapsible = lines != null && lines > 8;

  return (
    <View>
      <Text
        style={[typography.body, { color: colors.text }]}
        numberOfLines={collapsible && !expanded ? 8 : undefined}
        onTextLayout={(event) => {
          if (lines != null) return;
          setLines(event.nativeEvent.lines.length);
        }}
      >
        {text}
      </Text>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Read more'}
          onPress={() => setExpanded((value) => !value)}
          hitSlop={8}
          style={{ marginTop: spacing.sm, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '800' }]}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HostedBy({ label, url }: { label: string; url: string | null }) {
  const { colors, typography, spacing } = useTheme();
  const textStyle = [
    typography.caption,
    {
      color: url ? colors.primary : colors.textSecondary,
      fontWeight: url ? ('700' as const) : ('400' as const),
      marginTop: spacing.xs,
    },
  ];
  if (!url) {
    return <Text style={textStyle}>{label}</Text>;
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        void openInAppBrowser(url, colors.primary);
      }}
      style={styles.hostedByLink}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
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

function RsvpFooter({
  eventId,
  rsvp,
  item,
}: {
  eventId: string;
  rsvp: NonNullable<import('../types/events').EventDetail['rsvp']>;
  item: import('../types/events').EventListItem | null;
}) {
  const { colors, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const requireAccount = useRequireAccount();
  const { ticket } = useMyTicket(isSignedIn ? eventId : undefined);
  const register = useRegisterForEvent();
  const [error, setError] = useState<string | null>(null);
  const state = rsvpState(rsvp, ticket?.status ?? null);
  const disabled = state.action === 'none' || register.isPending;

  async function onPress() {
    setError(null);
    if (state.action === 'ticket') {
      router.push(`/ticket/${eventId}`);
      return;
    }
    if (!requireAccount('rsvp', () => doRegister())) return;
    await doRegister();
  }

  async function doRegister() {
    try {
      await register.mutateAsync({ eventId, item });
      router.push(`/ticket/${eventId}?new=1`);
    } catch (err) {
      setError(friendlyPublicError(err, "Couldn't register. Please try again."));
    }
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.footer,
        { backgroundColor: colors.background, borderTopColor: colors.hairline, paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {state.note || error ? (
        <Text
          style={[
            typography.caption,
            { color: error ? colors.danger : rsvp.full ? colors.warning : colors.textSecondary, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
          ]}
        >
          {error ?? state.note}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={state.label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => void onPress()}
        style={[
          styles.primaryCta,
          {
            backgroundColor: state.action === 'none' ? colors.surfaceElevated : state.action === 'ticket' ? colors.surface : colors.primary,
            borderColor: colors.primary,
            borderWidth: state.action === 'ticket' ? 1.5 : 0,
            borderRadius: radius.full,
          },
        ]}
      >
        {register.isPending ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text
            style={[
              typography.body,
              {
                color: state.action === 'none' ? colors.textSecondary : state.action === 'ticket' ? colors.primary : colors.onPrimary,
                fontWeight: '800',
              },
            ]}
          >
            {state.label}
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

export function EventDetailScreen({ eventId }: EventDetailScreenProps) {
  const requireAccount = useRequireAccount();
  const { colors, typography, spacing, radius } = useTheme();
  const openTickets = useOpenTickets();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const query = useEvent(eventId);
  const detail = query.data;
  const [heroFailed, setHeroFailed] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    setHeroFailed(false);
    setPhotoOpen(false);
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
  const rsvpOn = Boolean(detail?.rsvp_enabled && detail?.rsvp);
  const outbound = detail && !rsvpOn ? resolveOutboundLink(detail) : null;
  const actionLabel = outbound ? formatActionLabel(outbound.label, price) : null;
  const videoUrl = allowedOutboundUrl(detail?.video_url);
  const about = detail ? formatAboutBody(detail) : null;
  const seriesName = sanitizePublicText(detail?.series_name);
  const hostedBy = hostedByLine(detail?.organizer_name);
  const organizerUrl = hostedBy ? organizerPageUrl(detail?.organizer_url) : null;
  const phase = detail ? eventPhase(detail) : 'unscheduled';
  const ended = phase === 'ended';
  const live = phase === 'live';

  function shareEvent() {
    if (!detail) return;
    if (!requireAccount('share', () => doShare())) return;
    void doShare();
  }

  async function doShare() {
    if (!detail) return;
    // Never share a competing event platform's page (Eventbrite, Meetup, ...).
    const url =
      platformFreeUrl(detail.external_url) ?? platformFreeUrl(outbound?.url) ?? null;
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
          paddingBottom: ended || outbound || rsvpOn ? 120 + insets.bottom : spacing.xxxl,
        }}
      >
        <View style={showPhoto || imageTile ? styles.hero : styles.heroCompact}>
          {showPhoto ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View full photo"
              onPress={() => setPhotoOpen(true)}
              style={StyleSheet.absoluteFill}
            >
              <Image
                source={{ uri: heroUrl!, cache: 'force-cache' }}
                style={styles.heroImage}
                resizeMode="cover"
                resizeMethod="resize"
                onError={() => setHeroFailed(true)}
              />
            </Pressable>
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
                  style={[
                    typography.heading,
                    styles.heroTitle,
                    { color: colors.text },
                  ]}
                >
                  {detail.title}
                </Text>
              ) : null}
              {hostedBy ? <HostedBy label={hostedBy} url={organizerUrl} /> : null}
              {detail?.verified_organizer ? (
                <View style={{ marginTop: spacing.xs }}>
                  <VerifiedBadge />
                </View>
              ) : null}
            </View>
          )}
          <View
            pointerEvents="box-none"
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
            {friendlyPublicError(query.error, "Couldn't load this event. Please try again.")}
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
              <HostedBy label={hostedBy} url={organizerUrl} />
            ) : null}
            {(showPhoto || imageTile) && detail.verified_organizer ? (
              <View style={{ marginTop: spacing.xs }}>
                <VerifiedBadge />
              </View>
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
              {scheduleLines.map((line, index) => (
                <View key={line} style={styles.whenRow}>
                  <Text
                    style={[
                      typography.body,
                      {
                        color: ended ? colors.textMuted : colors.text,
                        flexShrink: 1,
                      },
                    ]}
                  >
                    {line}
                  </Text>
                  {index === 0 && ended ? (
                    <Chip
                      label="Event ended"
                      color={colors.textSecondary}
                      background={colors.surfaceElevated}
                    />
                  ) : null}
                  {index === 0 && live ? (
                    <Chip
                      label="Happening now"
                      color={colors.primary}
                      background={colors.primaryMuted}
                    />
                  ) : null}
                </View>
              ))}
              {scheduleLines.length === 0 && ended ? (
                <Chip
                  label="Event ended"
                  color={colors.textSecondary}
                  background={colors.surfaceElevated}
                />
              ) : null}
              {scheduleLines.length === 0 && live ? (
                <Chip
                  label="Happening now"
                  color={colors.primary}
                  background={colors.primaryMuted}
                />
              ) : null}
              {detail.occurrences?.length > 1
                ? occurrenceLines.map((line) => (
                    <Text
                      key={line}
                      style={[
                        typography.caption,
                        {
                          color: ended ? colors.textMuted : colors.textSecondary,
                          marginTop: spacing.sm,
                        },
                      ]}
                    >
                      {line}
                    </Text>
                  ))
                : null}
              {!ended ? (
                <AddToCalendarButton
                  event={{
                    title: detail.title,
                    starts_at: detail.starts_at,
                    ends_at: detail.ends_at,
                    location: [place.name, place.address].filter(Boolean).join(', ') || null,
                    url: outbound?.url ?? null,
                  }}
                />
              ) : null}
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
                <AboutCopy text={about} />
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

            <ReportEventButton eventId={eventId} />
          </View>
        ) : null}
      </ScrollView>

      {ended ? (
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
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel="This event has ended"
            style={[
              styles.primaryCta,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, fontWeight: '800' },
              ]}
            >
              This event has ended
            </Text>
          </Pressable>
        </SafeAreaView>
      ) : rsvpOn && detail ? (
        <RsvpFooter eventId={eventId} rsvp={detail.rsvp!} item={listItem ?? null} />
      ) : outbound ? (
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
      {showPhoto && heroUrl ? (
        <PhotoViewer
          visible={photoOpen}
          uri={largestImageUrl(heroUrl, photos)}
          onClose={() => setPhotoOpen(false)}
        />
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
  hostedByLink: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
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

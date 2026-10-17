import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useOpenTickets } from '../checkout/TicketCheckoutProvider';
import { colorForCategory, tintForCategory, useTheme } from '../theme';
import type { EventListItem } from '../types/events';
import { eventDetailHref } from '../utils/eventDetail';
import {
  formatCardPlace,
  formatCardWhen,
  formatEventPlace,
  formatEventPrice,
  formatFactsRow,
  formatSaleBadge,
} from '../utils/eventFormat';
import { normalizeLinkType, platformFreeUrl } from '../utils/outboundLinks';
import {
  allowedImageUrl,
  isBlockedSourceLabel,
  resolveOutboundLink,
  sanitizePublicText,
} from '../utils/outboundLinks';
import { eventPhase, type EventPhase } from '../utils/eventLive';
import { parseImageFallback } from '../utils/imageFallback';
import { FavouriteButton } from './FavouriteButton';
import { VerifiedBadge } from './VerifiedBadge';
import { ImageFallbackTile } from './ImageFallbackTile';

type EventCardVariant = 'card' | 'listing' | 'preview' | 'photo';

type EventCardProps = {
  item: EventListItem;
  variant?: EventCardVariant;
  /** Swallow the card tap. Used while search is open so the tap only dismisses it. */
  pressDisabled?: boolean;
};

function isEnded(status: string) {
  return status === 'ended' || status === 'cancelled';
}

function TimingChip({ phase }: { phase: Extract<EventPhase, 'ended' | 'live'> }) {
  const { colors, typography } = useTheme();
  const ended = phase === 'ended';
  return (
    <View
      style={[
        styles.timingChip,
        { backgroundColor: ended ? colors.surfaceElevated : colors.primaryMuted },
      ]}
    >
      <Text
        style={[
          typography.caption,
          {
            color: ended ? colors.textSecondary : colors.primary,
            fontWeight: '800',
            fontSize: 11,
          },
        ]}
      >
        {ended ? 'Ended' : 'Happening now'}
      </Text>
    </View>
  );
}

export function EventCard({ item, variant = 'card', pressDisabled = false }: EventCardProps) {
  const { colors, typography, spacing, radius, shadows, isDark } = useTheme();
  const openTickets = useOpenTickets();
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.event_id, item.image_url]);

  const phase = eventPhase(item);
  const ended = phase === 'ended' || isEnded(item.status);
  const timingPhase = phase === 'ended' || phase === 'live' ? phase : null;
  const imageUrl = allowedImageUrl(item.image_url);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const imageTile = showImage ? null : parseImageFallback(item.image_fallback);
  const outbound = resolveOutboundLink(item);
  const summary = sanitizePublicText(item.summary);
  const categoryColor = colorForCategory(item.primary_category);
  const facts = formatFactsRow(item);
  const price = formatEventPrice(item);
  const saleLabel = formatSaleBadge(item);
  const chipLabel = saleLabel ?? price;
  const place = formatEventPlace(item);

  function openDetail() {
    if (pressDisabled) return;
    router.push(eventDetailHref(item.event_id));
  }

  async function shareEvent() {
    const url = platformFreeUrl(outbound?.url) ?? undefined;
    const message = url ? `${item.title}\n${url}` : item.title;
    await Share.share({
      title: item.title,
      message,
      url,
    });
  }

  const thumbTint = item.primary_category
    ? tintForCategory(item.primary_category, '33')
    : colors.primaryMuted;
  const hero = (
    <View style={[styles.imageFrame, { backgroundColor: thumbTint }]}>
      {showImage ? (
        <Image
          source={{ uri: imageUrl ?? undefined, cache: 'force-cache' }}
          style={styles.imageFill}
          resizeMode="cover"
          resizeMethod="resize"
          onError={() => setImageFailed(true)}
        />
      ) : imageTile ? (
        <ImageFallbackTile tile={imageTile} compact={variant === 'listing'} />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons
            name="calendar"
            size={variant === 'listing' ? 26 : 32}
            color={item.primary_category ? categoryColor : colors.primary}
          />
        </View>
      )}
    </View>
  );

  if (variant === 'photo') {
    const ticketish = outbound && phase !== 'ended' && normalizeLinkType(outbound.linkType) !== 'website';
    const ticketLabel = outbound && normalizeLinkType(outbound.linkType) === 'register' ? 'Register' : 'Tickets';
    const cardPlace = formatCardPlace(item);
    const showCategory =
      item.primary_category && !isBlockedSourceLabel(item.primary_category.name);
    return (
      <View
        style={[
          styles.photoCard,
          isDark ? null : shadows.soft,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: colors.border,
            borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <View style={styles.photoFrame}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}`}
          onPress={openDetail}
          style={StyleSheet.absoluteFill}
        >
          {hero}
        </Pressable>
        {timingPhase ? (
          <View
            pointerEvents="none"
            style={[
              styles.photoBadge,
              styles.photoTopLeft,
              { backgroundColor: timingPhase === 'live' ? '#DC2626' : 'rgba(17,20,19,0.78)' },
            ]}
          >
            {timingPhase === 'live' ? <View style={styles.liveDot} /> : null}
            <Text style={styles.photoBadgeText}>
              {timingPhase === 'live' ? 'Happening now' : 'Ended'}
            </Text>
          </View>
        ) : null}
        {chipLabel ? (
          <View
            pointerEvents="none"
            style={[
              styles.photoBadge,
              styles.photoBottomLeft,
              { backgroundColor: saleLabel ? '#DC2626' : 'rgba(17,20,19,0.78)' },
            ]}
          >
            <Text style={styles.photoBadgeText}>{chipLabel}</Text>
          </View>
        ) : null}
        <View style={styles.photoHeart}>
          <FavouriteButton item={item} variant="glass" />
        </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}`}
          onPress={openDetail}
          style={styles.photoBody}
        >
          <Text
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
            style={[styles.photoTitle, { color: colors.text }]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            style={[styles.photoLine, { color: ended ? colors.textMuted : colors.textSecondary, marginTop: 4 }]}
          >
            {formatCardWhen(item.starts_at)}
          </Text>
          {cardPlace ? (
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={[styles.photoLine, { color: colors.textSecondary }]}
            >
              {cardPlace}
            </Text>
          ) : null}
          <View style={styles.photoFooter}>
            <View style={styles.photoChips}>
              {showCategory ? (
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: tintForCategory(item.primary_category, isDark ? '55' : '22') },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}
                    style={[styles.chipText, { color: isDark ? colors.text : categoryColor }]}
                  >
                    {item.primary_category!.name}
                  </Text>
                </View>
              ) : null}
              {item.verified_organizer ? <VerifiedBadge compact /> : null}
            </View>
            {item.rsvp_enabled && !ended ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Register free for ${item.title}`}
                onPress={openDetail}
                hitSlop={6}
                style={[styles.ticketsBtn, { backgroundColor: colors.primary }]}
              >
                <Text maxFontSizeMultiplier={1.2} style={[styles.ticketsText, { color: colors.onPrimary }]}>
                  Register — Free
                </Text>
              </Pressable>
            ) : ticketish && outbound && !item.rsvp_enabled ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${ticketLabel} for ${item.title}`}
                onPress={() => openTickets({ url: outbound.url, event: item, item })}
                hitSlop={6}
                style={[styles.ticketsBtn, { backgroundColor: colors.primary }]}
              >
                <Text maxFontSizeMultiplier={1.2} style={[styles.ticketsText, { color: colors.onPrimary }]}>
                  {ticketLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </View>
    );
  }

  if (variant === 'listing') {
    return (
      <View
        style={[
          styles.listing,
          shadows.soft,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.listingMain}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            onPress={openDetail}
            style={styles.listingImage}
          >
            {hero}
          </Pressable>
          <View style={styles.listingBody}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}
              onPress={openDetail}
            >
            <View style={styles.listingTitleRow}>
              <Text
                numberOfLines={2}
                style={[
                  typography.body,
                  {
                    color: colors.text,
                    fontWeight: '700',
                    flex: 1,
                    paddingRight: 8,
                  },
                ]}
              >
                {item.title}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                {
                  color: phase === 'ended' ? colors.textMuted : colors.textSecondary,
                  marginTop: 4,
                  fontWeight: '600',
                },
              ]}
            >
              {facts}
            </Text>
            <View style={styles.listingMeta}>
              {item.verified_organizer ? <VerifiedBadge compact /> : null}
              {timingPhase ? <TimingChip phase={timingPhase} /> : null}
              {chipLabel ? (
                <View
                  style={[
                    styles.priceChip,
                    {
                      backgroundColor: saleLabel
                        ? tintForCategory(item.primary_category, '22')
                        : colors.primaryMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: saleLabel ? categoryColor : colors.primary,
                        fontWeight: '800',
                        fontSize: 12,
                      },
                    ]}
                  >
                    {chipLabel}
                  </Text>
                </View>
              ) : null}
              {item.primary_category &&
              !isBlockedSourceLabel(item.primary_category.name) ? (
                <Text
                  numberOfLines={1}
                  style={[
                    typography.caption,
                    { color: categoryColor, fontWeight: '700', flexShrink: 1 },
                  ]}
                >
                  {item.primary_category.name}
                </Text>
              ) : null}
            </View>
            {place && place !== 'Location TBD' ? (
              <Text
                numberOfLines={1}
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: 4 },
                ]}
              >
                {place}
              </Text>
            ) : null}
            </Pressable>
            {outbound && phase !== 'ended' ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={outbound.label}
                onPress={() =>
                  openTickets({ url: outbound.url, event: item, item })
                }
                style={styles.listingLink}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    typography.caption,
                    { color: colors.primary, fontWeight: '800' },
                  ]}
                >
                  {outbound.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.listingHeart}>
          <FavouriteButton item={item} variant="plain" />
        </View>
      </View>
    );
  }

  const actionLabel = 'View details';

  return (
    <View
      style={[
        styles.card,
        variant === 'preview' ? shadows.card : shadows.soft,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
        },
      ]}
    >
      <View style={[styles.imageWrap, variant === 'preview' && styles.previewImage]}>
        {hero}

        <View style={styles.heartWrap}>
          <FavouriteButton item={item} variant="overlay" />
        </View>

        {item.primary_category &&
        !isBlockedSourceLabel(item.primary_category.name) ? (
          <View
            style={[
              styles.badge,
              styles.categoryBadge,
              { backgroundColor: categoryColor },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
              ]}
            >
              {item.primary_category.name}
            </Text>
          </View>
        ) : null}

        {chipLabel ? (
          <View
            style={[
              styles.badge,
              styles.priceBadge,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: saleLabel ? categoryColor : colors.text,
                  fontSize: 11,
                  fontWeight: '800',
                },
              ]}
            >
              {chipLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ padding: spacing.lg }}>
        <Text
          numberOfLines={2}
          style={[typography.heading, { color: colors.text, fontSize: 18 }]}
        >
          {item.title}
        </Text>
        <View style={[styles.factsRow, { marginTop: spacing.sm }]}>
          <Text
            numberOfLines={1}
            style={[
              typography.caption,
              {
                color: phase === 'ended' ? colors.textMuted : colors.textSecondary,
                fontWeight: '700',
                flexShrink: 1,
              },
            ]}
          >
            {facts}
          </Text>
          {item.verified_organizer ? <VerifiedBadge compact /> : null}
              {timingPhase ? <TimingChip phase={timingPhase} /> : null}
        </View>
        {summary ? (
          <Text
            numberOfLines={2}
            style={[
              typography.caption,
              {
                color: colors.textMuted,
                marginTop: spacing.sm,
                lineHeight: 18,
              },
            ]}
          >
            {summary}
          </Text>
        ) : null}
        {outbound && phase !== 'ended' ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={outbound.label}
            onPress={() =>
              openTickets({ url: outbound.url, event: item, item })
            }
            style={[
              styles.outboundCta,
              {
                borderColor: colors.primary,
                borderRadius: radius.full,
                marginTop: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: colors.primary, fontWeight: '800' },
              ]}
            >
              {outbound.label}
            </Text>
          </Pressable>
        ) : null}

        {variant === 'preview' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={openDetail}
            style={[
              styles.previewCta,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: colors.onPrimary, fontWeight: '800' },
              ]}
            >
              {actionLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.footer, { marginTop: spacing.lg }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              onPress={openDetail}
              style={[
                styles.action,
                {
                  backgroundColor: ended ? 'transparent' : colors.primary,
                  borderColor: ended ? colors.border : colors.primary,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: ended ? colors.text : colors.onPrimary,
                    fontWeight: '700',
                  },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share event"
              onPress={shareEvent}
              style={[
                styles.share,
                {
                  borderColor: colors.border,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoCard: {
    marginHorizontal: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  photoBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoTopLeft: { top: 10, left: 10 },
  photoBottomLeft: { left: 10, bottom: 10 },
  photoBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  photoHeart: { position: 'absolute', top: 8, right: 8 },
  photoBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  photoTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  photoLine: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
  photoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    minHeight: 34,
    gap: 8,
  },
  photoChips: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexShrink: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  ticketsBtn: { paddingHorizontal: 16, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ticketsText: { fontSize: 14, fontWeight: '800' },
  card: {
    overflow: 'hidden',
  },
  imageWrap: {
    height: 148,
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    height: 168,
  },
  imageFrame: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  imageFill: {
    ...StyleSheet.absoluteFill,
  },
  imageFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryBadge: {
    left: 10,
    bottom: 10,
    maxWidth: '58%',
  },
  priceBadge: {
    right: 10,
    bottom: 10,
  },
  heartWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    marginRight: 10,
  },
  previewCta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  share: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  listing: {
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listingMain: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  // Fixed box. A percentage height resolves against the list viewport on
  // iOS and stretches every card to one screen, which also kills scrolling.
  listingImage: {
    width: 96,
    height: 96,
    marginLeft: 8,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
    position: 'relative',
  },
  listingBody: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 44,
    justifyContent: 'center',
  },
  listingTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listingLink: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  outboundCta: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  priceChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  timingChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  factsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listingHeart: {
    position: 'absolute',
    top: 6,
    right: 4,
  },
});

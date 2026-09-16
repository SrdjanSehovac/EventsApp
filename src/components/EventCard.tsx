import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colorForCategory, tintForCategory, useTheme } from '../theme';
import type { EventListItem } from '../types/events';
import {
  formatEventPrice,
  formatFactsRow,
  formatPinTime,
  formatPlaceLine,
  formatPriceLike,
  formatRelativeWhen,
} from '../utils/eventFormat';
import { FavouriteButton } from './FavouriteButton';

type EventCardVariant = 'card' | 'listing' | 'preview';

type EventCardProps = {
  item: EventListItem;
  variant?: EventCardVariant;
};

function isEnded(status: string) {
  return status === 'ended' || status === 'cancelled';
}

export function EventCard({ item, variant = 'card' }: EventCardProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const ended = isEnded(item.status);
  const showImage = Boolean(item.image_url) && !imageFailed;
  const categoryColor = colorForCategory(item.primary_category);
  const facts = formatFactsRow(item);
  const price = formatEventPrice(item);
  const priceLike = formatPriceLike(item);
  const placeLine = formatPlaceLine(item);
  const whenLabel = formatPinTime(item.starts_at);
  const relative = formatRelativeWhen(item.starts_at);
  const categoryName = item.primary_category?.name;

  async function openSource() {
    if (!item.source_url) return;
    const canOpen = await Linking.canOpenURL(item.source_url);
    if (canOpen) await Linking.openURL(item.source_url);
  }

  async function shareEvent() {
    const message = item.source_url
      ? `${item.title}\n${item.source_url}`
      : item.title;
    await Share.share({
      title: item.title,
      message,
      url: item.source_url,
    });
  }

  const hero = showImage ? (
    <Image
      source={{ uri: item.image_url ?? undefined }}
      style={styles.imageFill}
      onError={() => setImageFailed(true)}
    />
  ) : (
    <View
      style={[
        styles.imageFill,
        styles.imageFallback,
        {
          backgroundColor: item.primary_category
            ? tintForCategory(item.primary_category, '33')
            : colors.primaryMuted,
        },
      ]}
    >
      <Ionicons
        name="calendar"
        size={variant === 'listing' ? 26 : 32}
        color={item.primary_category ? categoryColor : colors.primary}
      />
    </View>
  );

  if (variant === 'listing') {
    return (
      <View
        style={[
          styles.listing,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.hairline,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}`}
          onPress={openSource}
          style={styles.listingMain}
        >
          <View style={styles.listingImage}>{hero}</View>
          <View style={styles.listingBody}>
            <Text
              numberOfLines={1}
              style={[
                typography.heading,
                { color: colors.primary, fontSize: 22, lineHeight: 26 },
              ]}
            >
              {priceLike}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                { color: colors.text, marginTop: 3, fontWeight: '700', fontSize: 13 },
              ]}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: 1, fontSize: 12 },
              ]}
            >
              {item.neighbourhood && item.city
                ? `(${item.neighbourhood}), ${item.city}`
                : placeLine}
            </Text>
            <View style={styles.metaIcons}>
              {whenLabel ? (
                <View style={styles.metaChip}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, fontSize: 12, marginLeft: 4 },
                    ]}
                  >
                    {whenLabel}
                  </Text>
                </View>
              ) : null}
              {categoryName ? (
                <View style={styles.metaChip}>
                  <Ionicons name="pricetag-outline" size={13} color={colors.textSecondary} />
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, fontSize: 12, marginLeft: 4 },
                    ]}
                  >
                    {categoryName}
                  </Text>
                </View>
              ) : null}
            </View>
            {relative ? (
              <View style={styles.agoRow}>
                <View style={[styles.agoDot, { backgroundColor: colors.primary }]} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, fontSize: 12 },
                  ]}
                >
                  {relative}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
        <View style={styles.listingHeart}>
          <FavouriteButton item={item} variant="plain" />
        </View>
      </View>
    );
  }

  const actionLabel = variant === 'preview' ? 'View details' : ended ? 'View Recap' : 'Get Ticket';

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

        {item.primary_category ? (
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

        {price ? (
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
                { color: colors.text, fontSize: 11, fontWeight: '800' },
              ]}
            >
              {price}
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
        <Text
          numberOfLines={1}
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              marginTop: spacing.sm,
              fontWeight: '700',
            },
          ]}
        >
          {facts}
        </Text>
        {item.summary ? (
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
            {item.summary}
          </Text>
        ) : null}

        {variant === 'preview' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            onPress={openSource}
            disabled={!item.source_url}
            style={[
              styles.previewCta,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
                marginTop: spacing.lg,
                opacity: item.source_url ? 1 : 0.5,
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
              onPress={openSource}
              disabled={!item.source_url}
              style={[
                styles.action,
                {
                  backgroundColor: ended ? 'transparent' : colors.primary,
                  borderColor: ended ? colors.border : colors.primary,
                  borderRadius: radius.full,
                  opacity: item.source_url ? 1 : 0.5,
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
  card: {
    overflow: 'hidden',
  },
  imageWrap: {
    height: 148,
    position: 'relative',
  },
  previewImage: {
    height: 168,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
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
    overflow: 'hidden',
    minHeight: 108,
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listingMain: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    alignItems: 'flex-start',
  },
  listingImage: {
    width: 112,
    height: 84,
    borderRadius: 4,
    overflow: 'hidden',
  },
  listingBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingRight: 36,
    justifyContent: 'flex-start',
  },
  listingHeart: {
    position: 'absolute',
    top: 6,
    right: 2,
  },
  metaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '58%',
  },
  agoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  agoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

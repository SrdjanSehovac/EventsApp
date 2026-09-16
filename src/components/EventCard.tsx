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
import { formatEventPlace, formatEventPrice, formatFactsRow } from '../utils/eventFormat';
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
  const place = formatEventPlace(item);

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
          shadows.soft,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderColor: colors.hairline,
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
                { color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
              ]}
            >
              {facts}
            </Text>
            <View style={styles.listingMeta}>
              {price ? (
                <View
                  style={[
                    styles.priceChip,
                    { backgroundColor: colors.primaryMuted },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.primary, fontWeight: '800', fontSize: 12 },
                    ]}
                  >
                    {price}
                  </Text>
                </View>
              ) : null}
              {item.primary_category ? (
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
    minHeight: 96,
    position: 'relative',
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listingMain: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    alignItems: 'stretch',
  },
  listingImage: {
    width: 108,
    minHeight: 96,
    overflow: 'hidden',
  },
  listingBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 40,
    justifyContent: 'center',
  },
  listingTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  listingHeart: {
    position: 'absolute',
    top: 6,
    right: 4,
  },
});

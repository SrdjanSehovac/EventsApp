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

import { useTheme } from '../theme';
import type { EventListItem } from '../types/events';

type EventCardProps = {
  item: EventListItem;
};

function formatEventDate(value?: string | null) {
  if (!value) return 'Schedule TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule TBD';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLocation(item: EventListItem) {
  const parts = [item.neighbourhood, item.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location TBD';
}

function isEnded(status: string) {
  return status === 'ended' || status === 'cancelled';
}

export function EventCard({ item }: EventCardProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const ended = isEnded(item.status);
  const showImage = Boolean(item.image_url) && !imageFailed;
  const actionLabel = ended ? 'View Recap' : 'Get Ticket';

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

  return (
    <View
      style={[
        styles.card,
        shadows.soft,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {showImage ? (
          <Image
            source={{ uri: item.image_url ?? undefined }}
            style={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.imageFallback,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Ionicons name="calendar" size={32} color={colors.textMuted} />
          </View>
        )}

        <View
          style={[
            styles.badge,
            styles.statusBadge,
            { backgroundColor: 'rgba(11, 11, 20, 0.78)' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: ended ? colors.danger : colors.success },
            ]}
          />
          <Text
            style={[
              typography.caption,
              {
                color: ended ? colors.danger : colors.success,
                fontSize: 11,
                fontWeight: '600',
              },
            ]}
          >
            {ended ? 'Ended' : 'Active'}
          </Text>
        </View>

        {item.primary_category ? (
          <View
            style={[
              styles.badge,
              styles.categoryBadge,
              { backgroundColor: colors.primaryMuted },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                typography.caption,
                { color: colors.primary, fontSize: 11, fontWeight: '600' },
              ]}
            >
              {item.primary_category.name}
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
        {item.summary ? (
          <Text
            numberOfLines={2}
            style={[
              typography.caption,
              {
                color: colors.textSecondary,
                marginTop: spacing.xs,
                lineHeight: 18,
              },
            ]}
          >
            {item.summary}
          </Text>
        ) : null}

        <View style={[styles.metaRow, { marginTop: spacing.md }]}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[
              typography.caption,
              { color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
            ]}
          >
            {formatEventDate(item.starts_at)}
          </Text>
        </View>
        <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[
              typography.caption,
              { color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
            ]}
          >
            {formatLocation(item)}
          </Text>
        </View>

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
                borderRadius: radius.md,
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 148,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadge: {
    left: 10,
  },
  categoryBadge: {
    right: 10,
    maxWidth: '52%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  share: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

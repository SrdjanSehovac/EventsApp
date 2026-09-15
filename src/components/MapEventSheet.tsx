import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEvent } from '../hooks';
import { useTheme } from '../theme';
import type { EventDetail, EventListItem, EventMapPin } from '../types/events';
import { EventCard } from './EventCard';

type MapEventSheetProps = {
  pin: EventMapPin;
  bottomInset: number;
  onClose: () => void;
};

export function pinToListItem(pin: EventMapPin): EventListItem {
  return {
    event_id: pin.event_id,
    title: pin.title,
    source: '',
    source_url: '',
    status: 'active',
    schedule_type: 'one_shot',
    starts_at: pin.starts_at,
    ends_at: pin.ends_at,
    is_free: pin.is_free,
    neighbourhood: pin.neighbourhood,
    primary_category: pin.primary_category,
    image_url: pin.image_url,
    latitude: pin.latitude,
    longitude: pin.longitude,
    distance_km:
      pin.distance_m != null ? pin.distance_m / 1000 : null,
  };
}

function detailToListItem(detail: EventDetail): EventListItem {
  return {
    event_id: detail.event_id,
    title: detail.title,
    summary: detail.summary,
    source: detail.source,
    source_url: detail.source_url,
    status: detail.status,
    schedule_type: detail.schedule_type,
    starts_at: detail.starts_at,
    ends_at: detail.ends_at,
    is_free: detail.is_free,
    neighbourhood: detail.neighbourhood,
    city: detail.venue?.city ?? null,
    primary_category:
      detail.categories.find((c) => c.is_primary) ??
      detail.categories[0] ??
      null,
    image_url: detail.image_url,
    latitude: detail.latitude,
    longitude: detail.longitude,
    tags: detail.tags,
    vibe: detail.vibe,
  };
}

export function MapEventSheet({
  pin,
  bottomInset,
  onClose,
}: MapEventSheetProps) {
  const { colors, spacing } = useTheme();
  const detailQuery = useEvent(pin.event_id);

  const item =
    detailQuery.data != null
      ? detailToListItem(detailQuery.data)
      : pinToListItem(pin);

  return (
    <View
      style={[
        styles.sheet,
        {
          bottom: bottomInset + spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.cardWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close event details"
          onPress={onClose}
          hitSlop={8}
          style={[
            styles.close,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
        <EventCard item={item} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  cardWrap: {
    position: 'relative',
    paddingTop: 18,
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 8,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

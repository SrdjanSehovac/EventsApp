import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEvent } from '../hooks';
import { useTheme } from '../theme';
import type { EventDetail, EventListItem, EventMapPin } from '../types/events';
import { EventCard } from './EventCard';

type MapEventSheetProps = {
  pins: EventMapPin[];
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

function SingleListing({ pin }: { pin: EventMapPin }) {
  const detailQuery = useEvent(pin.event_id);
  const item =
    detailQuery.data != null
      ? detailToListItem(detailQuery.data)
      : pinToListItem(pin);
  return <EventCard item={item} variant="listing" />;
}

export function MapEventSheet({
  pins,
  bottomInset,
  onClose,
}: MapEventSheetProps) {
  const { colors, spacing, typography, shadows } = useTheme();
  const count = pins.length;

  return (
    <View
      style={[
        styles.sheet,
        {
          bottom: bottomInset + spacing.sm,
          paddingHorizontal: spacing.md,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.panel,
          shadows.card,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '800' }]}>
            {count} {count === 1 ? 'Event' : 'Events'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close event details"
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          style={count > 1 ? styles.list : undefined}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {pins.map((pin) =>
            count === 1 ? (
              <SingleListing key={pin.event_id} pin={pin} />
            ) : (
              <EventCard
                key={pin.event_id}
                item={pinToListItem(pin)}
                variant="listing"
              />
            ),
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: '48%',
  },
  panel: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  list: {
    maxHeight: 280,
  },
});

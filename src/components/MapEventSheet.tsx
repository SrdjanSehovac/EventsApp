import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useEvent } from '../hooks';
import { useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import {
  detailToListItem,
  eventDetailHref,
  pinToListItem,
} from '../utils/eventDetail';
import { EventCard } from './EventCard';

type MapEventSheetProps = {
  pins: EventMapPin[];
  bottomInset: number;
  onClose: () => void;
};

function SingleListing({ pin }: { pin: EventMapPin }) {
  const { colors, typography, radius, spacing } = useTheme();
  const router = useRouter();
  const detailQuery = useEvent(pin.event_id);
  const item =
    detailQuery.data != null
      ? detailToListItem(detailQuery.data)
      : pinToListItem(pin);

  return (
    <View>
      <EventCard item={item} variant="listing" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View details"
        onPress={() => router.push(eventDetailHref(pin.event_id))}
        style={[
          styles.detailsCta,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.full,
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
            marginTop: 2,
          },
        ]}
      >
        <Text
          style={[
            typography.caption,
            { color: colors.onPrimary, fontWeight: '800' },
          ]}
        >
          View details
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

export function MapEventSheet({
  pins,
  bottomInset,
  onClose,
}: MapEventSheetProps) {
  const { colors, spacing, typography, shadows } = useTheme();
  const router = useRouter();
  const count = pins.length;

  return (
    <View
      style={[
        styles.sheet,
        {
          bottom: bottomInset + spacing.sm,
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
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
            {count} {count === 1 ? 'event' : 'events'}
          </Text>
          <View style={styles.headerActions}>
            {count === 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Expand event details"
                onPress={() => router.push(eventDetailHref(pins[0].event_id))}
                hitSlop={8}
              >
                <Ionicons name="expand-outline" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close event details"
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
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
    left: 10,
    right: 10,
    maxHeight: '52%',
  },
  panel: {
    borderRadius: 20,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsCta: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  list: {
    maxHeight: 280,
  },
});

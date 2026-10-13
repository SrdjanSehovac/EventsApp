import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useOpenTickets } from '../../checkout/TicketCheckoutProvider';
import { setEventReminder } from '../../reminders';
import { colorForCategory, useTheme } from '../../theme';
import type { EventListItem } from '../../types/events';
import { formatEventTime } from '../../utils/calendar';
import { eventDetailHref } from '../../utils/eventDetail';
import { formatEventPlace } from '../../utils/eventFormat';
import { eventPhase } from '../../utils/eventLive';
import { allowedImageUrl, resolveOutboundLink } from '../../utils/outboundLinks';
import { reminderFireDate } from '../../utils/savedPlan';
import { AddToCalendarButton } from '../AddToCalendarButton';

type Props = {
  item: EventListItem;
  index?: number;
  remindersOn: boolean;
  reminderOff: boolean;
};

export const SavedDayCard = memo(function SavedDayCard({
  item,
  index = 0,
  remindersOn,
  reminderOff,
}: Props) {
  const { colors, typography, radius, shadows } = useTheme();
  const router = useRouter();
  const openTickets = useOpenTickets();
  const [imgFailed, setImgFailed] = useState(false);
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    appear.setValue(0);
    Animated.timing(appear, {
      toValue: 1,
      duration: 260,
      delay: Math.min(index, 6) * 50,
      useNativeDriver: true,
    }).start();
  }, [appear, index, item.event_id]);

  const phase = eventPhase(item);
  const image = allowedImageUrl(item.image_url);
  const outbound = resolveOutboundLink(item);
  const place = formatEventPlace(item);
  const canRemind = remindersOn && Boolean(reminderFireDate(item.starts_at));
  const accent = colorForCategory(item.primary_category);

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onPress={() => router.push(eventDetailHref(item.event_id))}
        style={[
          styles.card,
          shadows.soft,
          { backgroundColor: colors.surface, borderRadius: radius.lg, borderLeftColor: accent },
        ]}
      >
        <View style={styles.top}>
          {image && !imgFailed ? (
            <Image
              source={{ uri: image }}
              onError={() => setImgFailed(true)}
              style={[styles.photo, { borderRadius: radius.md }]}
            />
          ) : (
            <View style={[styles.photo, styles.photoFallback, { borderRadius: radius.md, backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="calendar" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.copy}>
            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: colors.primary }]}>
                {item.starts_at ? formatEventTime(item.starts_at) : 'Time TBA'}
              </Text>
              {phase === 'ended' || phase === 'live' ? (
                <View
                  style={[
                    styles.status,
                    {
                      backgroundColor: phase === 'live' ? colors.primary : colors.surfaceElevated,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: phase === 'live' ? colors.onPrimary : colors.textSecondary,
                    }}
                  >
                    {phase === 'live' ? 'Happening now' : 'Ended'}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={2} style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
              {item.title}
            </Text>
            {place ? (
              <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
                {place}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          {outbound && phase !== 'ended' ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${outbound.label} for ${item.title}`}
              onPress={() => openTickets({ url: outbound.url, event: item, item })}
              style={[styles.ticket, { backgroundColor: colors.primary, borderRadius: radius.full }]}
            >
              <Ionicons name="ticket-outline" size={14} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontWeight: '800', fontSize: 12 }}>
                {outbound.label}
              </Text>
            </Pressable>
          ) : null}
          {phase !== 'ended' ? (
            <AddToCalendarButton
              compact
              event={{
                title: item.title,
                starts_at: item.starts_at,
                ends_at: item.ends_at,
                location: place || null,
                url: outbound?.url ?? null,
              }}
            />
          ) : null}
          {canRemind ? (
            <View style={styles.remind}>
              <Ionicons
                name={reminderOff ? 'notifications-off-outline' : 'notifications-outline'}
                size={16}
                color={reminderOff ? colors.textMuted : colors.primary}
              />
              <Switch
                accessibilityLabel={`Remind me 1 hour before ${item.title}`}
                value={!reminderOff}
                onValueChange={(on) => void setEventReminder(item, on)}
                trackColor={{ false: colors.border, true: colors.primaryMuted }}
                thumbColor={!reminderOff ? colors.primary : colors.surfaceElevated}
                style={styles.switch}
              />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: { padding: 12, borderLeftWidth: 4, marginBottom: 10 },
  top: { flexDirection: 'row', gap: 12 },
  photo: { width: 72, height: 72 },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { paddingHorizontal: 8, paddingVertical: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7 },
  remind: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
});

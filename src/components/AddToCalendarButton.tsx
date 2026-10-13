import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { addToDeviceCalendar, type CalendarExportEvent } from '../reminders/calendarExport';
import { useTheme } from '../theme';

export function AddToCalendarButton({
  event,
  compact = false,
}: {
  event: CalendarExportEvent;
  compact?: boolean;
}) {
  const { colors, radius } = useTheme();
  if (!event.starts_at) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add to Apple Calendar"
      onPress={() => void addToDeviceCalendar(event)}
      hitSlop={6}
      style={[
        styles.btn,
        compact ? styles.compact : null,
        { borderColor: colors.primary, borderRadius: radius.full },
      ]}
    >
      <Ionicons name="calendar-outline" size={compact ? 14 : 16} color={colors.primary} />
      <Text style={[styles.label, { color: colors.primary, fontSize: compact ? 12 : 14 }]}>
        {compact ? 'Calendar' : 'Add to Apple Calendar'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 0,
  },
  label: {
    fontWeight: '700',
  },
});

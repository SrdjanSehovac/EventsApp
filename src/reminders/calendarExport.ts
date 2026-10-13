import { Alert, Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';

import { calendarWindow } from '../utils/savedPlan';

export type CalendarExportEvent = {
  title: string;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
};

export const canAddToCalendar = Platform.OS === 'ios' || Platform.OS === 'android';

/** Opens the system "New Event" sheet prefilled, so the user picks the calendar and confirms. */
export async function addToDeviceCalendar(event: CalendarExportEvent): Promise<void> {
  const window = calendarWindow(event.starts_at, event.ends_at);
  if (!window) {
    Alert.alert('No date yet', 'This event has no date to add to your calendar.');
    return;
  }
  if (!canAddToCalendar) {
    Alert.alert('Not available', 'Adding to a calendar works in the iPhone app.');
    return;
  }
  try {
    await Calendar.createEventInCalendarAsync({
      title: event.title,
      startDate: window.start,
      endDate: window.end,
      location: event.location ?? undefined,
      url: event.url ?? undefined,
      notes: event.notes ?? undefined,
    });
  } catch {
    // Older OS path: write directly to the default calendar after asking.
    try {
      const perm = await Calendar.requestCalendarPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Calendar access is off', 'Allow calendar access in Settings to add events.');
        return;
      }
      const cal = await Calendar.getDefaultCalendarAsync();
      await Calendar.createEventAsync(cal.id, {
        title: event.title,
        startDate: window.start,
        endDate: window.end,
        location: event.location ?? undefined,
        url: event.url ?? undefined,
        notes: event.notes ?? undefined,
      });
      Alert.alert('Added', `${event.title} is in your calendar.`);
    } catch {
      Alert.alert('Couldn’t add', 'Something went wrong adding this to your calendar.');
    }
  }
}

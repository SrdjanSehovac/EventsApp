import AsyncStorage from '@react-native-async-storage/async-storage';

export const CALENDAR_AUTO_SAVE_KEY = 'eventsapp.prefs.calendarAutoSave';

/** Default ON: liked/favourited events appear on My calendar. */
export const CALENDAR_AUTO_SAVE_DEFAULT = true;

export async function getCalendarAutoSave(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_AUTO_SAVE_KEY);
    if (raw === null) return CALENDAR_AUTO_SAVE_DEFAULT;
    return raw === 'true';
  } catch {
    return CALENDAR_AUTO_SAVE_DEFAULT;
  }
}

export async function setCalendarAutoSave(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CALENDAR_AUTO_SAVE_KEY, enabled ? 'true' : 'false');
  } catch {
    // private mode / disabled storage
  }
}

import { useCallback, useEffect, useState } from 'react';

import {
  CALENDAR_AUTO_SAVE_DEFAULT,
  getCalendarAutoSave,
  setCalendarAutoSave,
} from '../preferences/calendarAutoSave';

export function useCalendarAutoSave() {
  const [enabled, setEnabled] = useState(CALENDAR_AUTO_SAVE_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const value = await getCalendarAutoSave();
      if (!cancelled) {
        setEnabled(value);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCalendarAutoSaveEnabled = useCallback(async (next: boolean) => {
    setEnabled(next);
    await setCalendarAutoSave(next);
  }, []);

  return {
    enabled,
    ready,
    setEnabled: setCalendarAutoSaveEnabled,
  };
}

import { useEffect, useState } from 'react';

import { loadReminders, subscribeReminders, type ReminderState } from './index';

export function useReminderState(): ReminderState | null {
  const [state, setState] = useState<ReminderState | null>(null);
  useEffect(() => {
    let live = true;
    void loadReminders().then((s) => live && setState(s));
    const off = subscribeReminders(setState);
    return () => {
      live = false;
      off();
    };
  }, []);
  return state;
}

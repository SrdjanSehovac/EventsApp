import { Platform } from 'react-native';

import {
  EventsMap as NativeEventsMap,
  type EventsMapHandle as NativeEventsMapHandle,
} from './EventsMap.native';
import {
  EventsMap as WebEventsMap,
  type EventsMapHandle as WebEventsMapHandle,
} from './EventsMap.web';

export type EventsMapHandle = NativeEventsMapHandle | WebEventsMapHandle;

export const EventsMap =
  Platform.OS === 'web' ? WebEventsMap : NativeEventsMap;

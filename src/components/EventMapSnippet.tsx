import { Platform } from 'react-native';

import {
  EventMapSnippet as NativeEventMapSnippet,
} from './EventMapSnippet.native';
import { EventMapSnippet as WebEventMapSnippet } from './EventMapSnippet.web';

export type EventMapSnippetProps = {
  latitude: number;
  longitude: number;
  label?: string | null;
  onPress: () => void;
};

export const EventMapSnippet =
  Platform.OS === 'web' ? WebEventMapSnippet : NativeEventMapSnippet;

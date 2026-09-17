import { useLocalSearchParams } from 'expo-router';

import { EventDetailScreen } from '../../src/components/EventDetailScreen';

export default function EventRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = params.id;
  const eventId = Array.isArray(raw) ? raw[0] : raw;

  if (!eventId) return null;
  return <EventDetailScreen eventId={eventId} />;
}

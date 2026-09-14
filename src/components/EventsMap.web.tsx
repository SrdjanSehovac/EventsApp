/**
 * Web fallback: react-native-maps is UnimplementedView on web.
 * Renders an OpenStreetMap + Leaflet iframe with event pins for demos.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import type { Region } from 'react-native-maps';

import { useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';

export type EventsMapHandle = {
  animateToRegion: (region: Region, durationMs?: number) => void;
};

type EventsMapProps = {
  pins: EventMapPin[];
  initialRegion: Region;
  userGeo?: UserGeo | null;
  selectedEventId?: string | null;
  isLoading?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
  onMarkerPress?: (pin: EventMapPin) => void;
  onMapPress?: () => void;
};


function buildLeafletHtml(
  pins: EventMapPin[],
  region: Region,
  selectedEventId: string | null | undefined,
): string {
  const markers = pins
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .map((p) => ({
      id: p.event_id,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      title: p.title ?? 'Event',
      selected: p.event_id === selectedEventId,
    }));

  const centerLat = region.latitude;
  const centerLng = region.longitude;
  const zoom = Math.max(
    10,
    Math.min(14, Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.02)))),
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #e8eef5; }
    .pin-label { font: 12px/1.2 system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const pins = ${JSON.stringify(markers)};
    const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${zoom});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    const byId = {};
    for (const p of pins) {
      const color = p.selected ? '#e11d48' : '#2563eb';
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: p.selected ? 11 : 8,
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
      }).addTo(map);
      marker.bindPopup('<div class="pin-label"><strong>' + p.title.replace(/</g,'&lt;') + '</strong></div>');
      marker.on('click', () => {
        window.parent.postMessage({ type: 'map-pin', eventId: p.id }, '*');
      });
      byId[p.id] = marker;
    }
    window.addEventListener('message', (ev) => {
      if (!ev.data || ev.data.type !== 'map-animate') return;
      map.setView([ev.data.lat, ev.data.lng], ev.data.zoom || map.getZoom(), { animate: true });
    });
    map.on('click', () => {
      window.parent.postMessage({ type: 'map-press' }, '*');
    });
    map.on('moveend', () => {
      const b = map.getBounds();
      const c = map.getCenter();
      window.parent.postMessage({
        type: 'map-region',
        latitude: c.lat,
        longitude: c.lng,
        latitudeDelta: Math.abs(b.getNorth() - b.getSouth()),
        longitudeDelta: Math.abs(b.getEast() - b.getWest()),
      }, '*');
    });
  </script>
</body>
</html>`;
}

export const EventsMap = forwardRef<EventsMapHandle, EventsMapProps>(
  function EventsMapWeb(
    {
      pins,
      initialRegion,
      selectedEventId,
      isLoading = false,
      onRegionChangeComplete,
      onMarkerPress,
      onMapPress,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const pinsById = useMemo(() => {
      const map = new Map<string, EventMapPin>();
      for (const p of pins) map.set(p.event_id, p);
      return map;
    }, [pins]);

    useImperativeHandle(ref, () => ({
      animateToRegion(region, _durationMs = 450) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'map-animate',
            lat: region.latitude,
            lng: region.longitude,
            zoom: Math.max(
              10,
              Math.min(
                14,
                Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.02))),
              ),
            ),
          },
          '*',
        );
      },
    }));

    useEffect(() => {
      const onMessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'map-pin' && typeof data.eventId === 'string') {
          const pin = pinsById.get(data.eventId);
          if (pin) onMarkerPress?.(pin);
        } else if (data.type === 'map-press') {
          onMapPress?.();
        } else if (data.type === 'map-region') {
          onRegionChangeComplete?.({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: data.latitudeDelta,
            longitudeDelta: data.longitudeDelta,
          });
        }
      };
      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }, [onMarkerPress, onMapPress, onRegionChangeComplete, pinsById]);

    const html = useMemo(
      () => buildLeafletHtml(pins, initialRegion, selectedEventId),
      // Rebuild when pin set / selection / center seed changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pins, selectedEventId, initialRegion.latitude, initialRegion.longitude, initialRegion.latitudeDelta],
    );

    return (
      <View style={styles.container}>
        {/* @ts-expect-error iframe is valid on react-native-web */}
        <iframe
          ref={iframeRef as never}
          title="Events map"
          srcDoc={html}
          style={{
            border: '0',
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        {isLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#e8eef5',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});

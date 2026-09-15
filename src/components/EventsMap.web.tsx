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

import { colorForCategory, useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';
import { isEventLive } from '../utils/eventLive';

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLeafletHtml(
  pins: EventMapPin[],
  region: Region,
  selectedEventId: string | null | undefined,
): string {
  const nowMs = Date.now();
  const markers = pins
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .map((p) => ({
      id: p.event_id,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      title: escapeHtml(p.title ?? 'Event'),
      selected: p.event_id === selectedEventId,
      live: isEventLive(p, nowMs),
      color: colorForCategory(p.primary_category),
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
    html, body, #map { height: 100%; margin: 0; background: #f4efe6; }
    .pin-label { font: 12px/1.2 system-ui, sans-serif; }
    .evt-wrap { position: relative; width: 28px; height: 36px; }
    .evt-dot {
      width: 16px; height: 16px; border-radius: 50%;
      background: var(--c, #E23E57);
      border: 3px solid #fff;
      box-shadow: 0 0 0 1.5px rgba(43,29,22,.55), 0 2px 5px rgba(43,29,22,.28);
      position: absolute; left: 6px; top: 8px;
    }
    .evt-wrap.live .evt-dot::after {
      content: '';
      position: absolute; inset: -7px; border-radius: 50%;
      border: 2px solid var(--c, #E23E57);
      animation: pulse 1.4s ease-out infinite;
    }
    .evt-wrap.selected { height: 40px; }
    .evt-wrap.selected .evt-dot {
      width: 22px; height: 22px; left: 3px; top: 0;
      box-shadow: 0 0 0 3px rgba(226,62,87,.28), 0 0 0 5px #fff, 0 3px 8px rgba(43,29,22,.35);
    }
    .evt-wrap.selected .evt-core {
      width: 7px; height: 7px; border-radius: 50%;
      background: #fff; border: 1px solid rgba(43,29,22,.55);
      position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
    }
    .evt-wrap.selected .evt-tip {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 10px solid var(--c, #E23E57);
      position: absolute; left: 7px; top: 18px;
      filter: drop-shadow(0 1px 1px rgba(43,29,22,.35));
    }
    @keyframes pulse {
      from { opacity: .55; transform: scale(1); }
      to { opacity: 0; transform: scale(1.8); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const pins = ${JSON.stringify(markers)};
    const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap, HOT'
    }).addTo(map);
    for (const p of pins) {
      const cls = 'evt-wrap' + (p.selected ? ' selected' : '') + (p.live ? ' live' : '');
      const html = p.selected
        ? '<div class="' + cls + '" style="--c:' + p.color + '"><div class="evt-dot"><div class="evt-core"></div></div><div class="evt-tip"></div></div>'
        : '<div class="' + cls + '" style="--c:' + p.color + '"><div class="evt-dot"></div></div>';
      const icon = L.divIcon({
        className: '',
        html,
        iconSize: p.selected ? [28, 40] : [28, 32],
        iconAnchor: p.selected ? [14, 38] : [14, 16],
      });
      const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: p.selected ? 600 : p.live ? 400 : 0 }).addTo(map);
      marker.bindPopup('<div class="pin-label"><strong>' + p.title + '</strong></div>');
      marker.on('click', () => {
        window.parent.postMessage({ type: 'map-pin', eventId: p.id }, '*');
      });
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
    backgroundColor: '#f4efe6',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,246,238,0.4)',
  },
});

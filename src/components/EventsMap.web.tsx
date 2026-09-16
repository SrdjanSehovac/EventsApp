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
import { clusterPins, regionForCluster } from '../utils/clusterPins';
import { isEventLive } from '../utils/eventLive';
import { formatPinBadge } from '../utils/eventFormat';

export type EventsMapHandle = {
  animateToRegion: (region: Region, durationMs?: number) => void;
};

type EventsMapProps = {
  pins: EventMapPin[];
  initialRegion: Region;
  userGeo?: UserGeo | null;
  selectedEventId?: string | null;
  isLoading?: boolean;
  mapRegion?: Region | null;
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
  const clusters = clusterPins(pins, region);
  const markers = clusters.map((cluster) => {
    const pin = cluster.pins[0];
    return {
      id: cluster.count > 1 ? cluster.id : pin.event_id,
      eventId: pin.event_id,
      lat: cluster.latitude,
      lng: cluster.longitude,
      count: cluster.count,
      title: escapeHtml(pin.title ?? 'Event'),
      label: escapeHtml(
        cluster.count > 1 ? String(cluster.count) : formatPinBadge(pin),
      ),
      selected: cluster.count === 1 && pin.event_id === selectedEventId,
      live: cluster.count === 1 && isEventLive(pin, nowMs),
      color: colorForCategory(pin.primary_category),
      zoomLat: cluster.count > 1 ? regionForCluster(cluster).latitude : null,
      zoomLng: cluster.count > 1 ? regionForCluster(cluster).longitude : null,
      zoomDelta:
        cluster.count > 1 ? regionForCluster(cluster).latitudeDelta : null,
    };
  });

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
    html, body, #map { height: 100%; margin: 0; background: #eef4f2; }
    .pin-label { font: 12px/1.2 system-ui, sans-serif; }
    .evt-wrap { position: relative; display: flex; flex-direction: column; align-items: center; }
    .evt-badge {
      background: var(--c, #0E8A7D);
      color: #fff;
      font: 800 11px/1.2 system-ui, sans-serif;
      padding: 4px 8px;
      border-radius: 999px;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(8,51,46,.28);
      white-space: nowrap;
      max-width: 132px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .evt-wrap.selected .evt-badge {
      font-size: 12px;
      padding: 5px 10px;
      box-shadow: 0 0 0 3px rgba(14,138,125,.28), 0 3px 8px rgba(8,51,46,.35);
    }
    .evt-wrap.cluster .evt-badge {
      min-width: 32px;
      min-height: 32px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      padding: 0 8px;
    }
    .evt-caret {
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 7px solid var(--c, #0E8A7D);
      margin-top: -1px;
      filter: drop-shadow(0 1px 1px rgba(8,51,46,.25));
    }
    .evt-wrap.live .evt-badge::after {
      content: '';
      position: absolute; inset: -7px; border-radius: 50%;
      border: 2px solid var(--c, #0E8A7D);
      animation: pulse 1.4s ease-out infinite;
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
      const cls = 'evt-wrap' + (p.selected ? ' selected' : '') + (p.live ? ' live' : '') + (p.count > 1 ? ' cluster' : '');
      const html = '<div class="' + cls + '" style="--c:' + p.color + '"><div class="evt-badge">' + p.label + '</div><div class="evt-caret"></div></div>';
      const icon = L.divIcon({
        className: '',
        html,
        iconSize: [88, 40],
        iconAnchor: [44, 38],
      });
      const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: p.selected ? 600 : p.count > 1 ? 500 : p.live ? 400 : 0 }).addTo(map);
      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        if (p.count > 1 && p.zoomLat != null) {
          window.parent.postMessage({
            type: 'map-cluster',
            latitude: p.zoomLat,
            longitude: p.zoomLng,
            latitudeDelta: p.zoomDelta,
            longitudeDelta: p.zoomDelta,
          }, '*');
          return;
        }
        window.parent.postMessage({ type: 'map-pin', eventId: p.eventId }, '*');
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
      mapRegion,
      onRegionChangeComplete,
      onMarkerPress,
      onMapPress,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const ignoreMapPressUntilRef = useRef(0);
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
          ignoreMapPressUntilRef.current = Date.now() + 500;
          const pin = pinsById.get(data.eventId);
          if (pin) onMarkerPress?.(pin);
        } else if (data.type === 'map-press') {
          if (Date.now() < ignoreMapPressUntilRef.current) return;
          onMapPress?.();
        } else if (data.type === 'map-cluster') {
          onRegionChangeComplete?.({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: data.latitudeDelta,
            longitudeDelta: data.longitudeDelta,
          });
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: 'map-animate',
              lat: data.latitude,
              lng: data.longitude,
              zoom: Math.max(
                11,
                Math.min(
                  15,
                  Math.round(Math.log2(360 / Math.max(data.latitudeDelta, 0.02))),
                ),
              ),
            },
            '*',
          );
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
      () => buildLeafletHtml(pins, mapRegion ?? initialRegion, selectedEventId),
      // Rebuild on pin set / selection / search seed — not every camera pan
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pins, selectedEventId, initialRegion.latitude, initialRegion.longitude, initialRegion.latitudeDelta],
    );

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: `${colors.background}66` },
            ]}
            pointerEvents="none"
          >
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
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

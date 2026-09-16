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

import type { MapBaseType } from '../browse';
import { useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';
import { clusterPins } from '../utils/clusterPins';

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
  mapType?: MapBaseType;
  onRegionChangeComplete?: (region: Region) => void;
  onMarkerPress?: (pin: EventMapPin) => void;
  onClusterPress?: (pins: EventMapPin[]) => void;
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
  mapType: MapBaseType,
): string {
  const clusters = clusterPins(pins, region);
  const markers = clusters.map((cluster) => {
    const pin = cluster.pins[0];
    return {
      id: cluster.count > 1 ? cluster.id : pin.event_id,
      eventId: pin.event_id,
      eventIds: cluster.pins.map((item) => item.event_id),
      lat: cluster.latitude,
      lng: cluster.longitude,
      count: cluster.count,
      title: escapeHtml(pin.title ?? 'Event'),
      label: String(cluster.count),
      selected: cluster.pins.some((item) => item.event_id === selectedEventId),
    };
  });

  const centerLat = region.latitude;
  const centerLng = region.longitude;
  const zoom = Math.max(
    10,
    Math.min(14, Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.02)))),
  );
  const satellite = mapType === 'satellite';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #eef4f2; }
    .evt-wrap { position: relative; display: flex; flex-direction: column; align-items: center; }
    .evt-head {
      background: #252A3A;
      color: #fff;
      font: 800 12px/1 system-ui, sans-serif;
      min-width: 32px;
      height: 32px;
      padding: 0 7px;
      border-radius: 16px;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(17,24,39,.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .evt-wrap.selected .evt-head {
      box-shadow: 0 0 0 3px rgba(11,110,100,.35), 0 3px 8px rgba(17,24,39,.4);
    }
    .evt-wrap.cluster .evt-head {
      min-width: 36px;
      height: 36px;
      border-radius: 18px;
      font-size: 13px;
    }
    .evt-caret {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 9px solid #252A3A;
      margin-top: -2px;
      filter: drop-shadow(0 1px 1px rgba(17,24,39,.25));
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const pins = ${JSON.stringify(markers)};
    const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${zoom});
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap, HOT'
    });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    });
    (${satellite} ? sat : osm).addTo(map);
    for (const p of pins) {
      const cls = 'evt-wrap' + (p.selected ? ' selected' : '') + (p.count > 1 ? ' cluster' : '');
      const html = '<div class="' + cls + '"><div class="evt-head">' + p.label + '</div><div class="evt-caret"></div></div>';
      const icon = L.divIcon({
        className: '',
        html,
        iconSize: [40, 44],
        iconAnchor: [20, 42],
      });
      const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: p.selected ? 600 : p.count > 1 ? 500 : 0 }).addTo(map);
      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        if (p.count > 1) {
          window.parent.postMessage({ type: 'map-cluster-open', eventIds: p.eventIds }, '*');
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
      mapType = 'standard',
      onRegionChangeComplete,
      onMarkerPress,
      onClusterPress,
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
        } else if (data.type === 'map-cluster-open' && Array.isArray(data.eventIds)) {
          ignoreMapPressUntilRef.current = Date.now() + 500;
          const clustered = data.eventIds
            .map((id: string) => pinsById.get(id))
            .filter((pin: EventMapPin | undefined): pin is EventMapPin => Boolean(pin));
          if (clustered.length) onClusterPress?.(clustered);
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
    }, [onMarkerPress, onClusterPress, onMapPress, onRegionChangeComplete, pinsById]);

    const html = useMemo(
      () => buildLeafletHtml(pins, mapRegion ?? initialRegion, selectedEventId, mapType),
      // Rebuild on pin set / selection / basemap — not every camera pan
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pins, selectedEventId, mapType, initialRegion.latitude, initialRegion.longitude, initialRegion.latitudeDelta],
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

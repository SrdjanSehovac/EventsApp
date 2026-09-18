/**
 * Web fallback: react-native-maps is UnimplementedView on web.
 * Renders OpenStreetMap + Leaflet with leaflet.markercluster so count
 * badges split into true lat/lng pins as the user zooms (Realtor.ca-style).
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
import { colorForCategory, useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';
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

function zoomFromRegion(region: Region): number {
  return Math.max(
    3,
    Math.min(18, Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.0005)))),
  );
}

function buildLeafletHtml(
  pins: EventMapPin[],
  region: Region,
  selectedEventId: string | null | undefined,
  mapType: MapBaseType,
  chrome: { background: string; primary: string },
): string {
  const nowMs = Date.now();
  // Pass every pin individually — leaflet.markercluster handles zoom splits.
  const markers = pins
    .filter(
      (pin) =>
        Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude),
    )
    .map((pin) => ({
      eventId: pin.event_id,
      lat: pin.latitude,
      lng: pin.longitude,
      title: escapeHtml(pin.title ?? 'Event'),
      label: escapeHtml(formatPinBadge(pin)),
      selected: pin.event_id === selectedEventId,
      live: isEventLive(pin, nowMs),
      color: colorForCategory(pin.primary_category),
    }));

  const centerLat = region.latitude;
  const centerLng = region.longitude;
  const zoom = zoomFromRegion(region);
  const satellite = mapType === 'satellite';
  const clusterColor = chrome.primary;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${chrome.background}; }
    .evt-wrap {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 140ms ease-out;
      transform-origin: 50% 100%;
    }
    .evt-badge {
      background: var(--c, ${chrome.primary});
      color: #fff;
      font: 800 11px/1.2 system-ui, sans-serif;
      padding: 4px 8px;
      border-radius: 999px;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(17,24,39,.22);
      white-space: nowrap;
      max-width: 132px;
      min-width: 14px;
      min-height: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: transform 140ms ease-out, border-width 140ms ease-out,
        box-shadow 140ms ease-out, filter 140ms ease-out, padding 140ms ease-out;
    }
    .evt-wrap.selected {
      transform: scale(1.16);
      z-index: 700;
    }
    .evt-wrap.selected .evt-badge {
      /* Tighter white ring + stronger category fill + category halo */
      border-width: 1.5px;
      padding: 5px 9px;
      filter: saturate(1.25) brightness(1.08) contrast(1.05);
      box-shadow:
        0 0 0 2px #ffffff,
        0 0 0 5px var(--c, ${chrome.primary}),
        0 4px 12px rgba(17,24,39,.36);
    }
    .evt-caret {
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 7px solid var(--c, ${chrome.primary});
      margin-top: -1px;
      filter: drop-shadow(0 1px 1px rgba(17,24,39,.22));
      transition: filter 140ms ease-out;
    }
    .evt-wrap.selected .evt-caret {
      filter: drop-shadow(0 1px 2px rgba(17,24,39,.35)) saturate(1.18) brightness(1.06);
    }
    .evt-cluster {
      background: ${clusterColor};
      color: #fff;
      font: 800 13px/1 system-ui, sans-serif;
      border: 3px solid #fff;
      border-radius: 999px;
      box-shadow: 0 2px 8px rgba(17,24,39,.28);
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 34px;
      min-height: 34px;
      padding: 0 8px;
    }
    .evt-cluster-wrap { display: flex; flex-direction: column; align-items: center; }
    .evt-cluster-caret {
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 8px solid ${clusterColor};
      margin-top: -2px;
      filter: drop-shadow(0 1px 1px rgba(17,24,39,.22));
    }
    .leaflet-div-icon { background: transparent; border: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const pins = ${JSON.stringify(markers)};
    const map = L.map('map', { zoomControl: true, maxZoom: 19 }).setView([${centerLat}, ${centerLng}], ${zoom});
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap, HOT'
    });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    });
    (${satellite} ? sat : osm).addTo(map);

    function pinIcon(p, selected) {
      const cls = 'evt-wrap' + (selected ? ' selected' : '') + (p.live ? ' live' : '');
      const html = '<div class="' + cls + '" style="--c:' + p.color + '"><div class="evt-badge">' + p.label + '</div><div class="evt-caret"></div></div>';
      const w = selected ? 108 : 88;
      const h = selected ? 50 : 40;
      return L.divIcon({
        className: '',
        html,
        iconSize: [w, h],
        iconAnchor: [w / 2, h - 2],
      });
    }

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 16,
      maxClusterRadius: function (z) {
        // Shrink radius as zoom increases so clusters split earlier.
        if (z >= 15) return 28;
        if (z >= 13) return 40;
        if (z >= 11) return 52;
        return 64;
      },
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        const size = count >= 100 ? 44 : count >= 10 ? 38 : 34;
        const html =
          '<div class="evt-cluster-wrap">' +
            '<div class="evt-cluster" style="min-width:' + size + 'px;min-height:' + size + 'px">' + count + '</div>' +
            '<div class="evt-cluster-caret"></div>' +
          '</div>';
        return L.divIcon({
          className: '',
          html,
          iconSize: [size + 8, size + 14],
          iconAnchor: [(size + 8) / 2, size + 12],
        });
      },
    });

    const markerById = {};
    for (const p of pins) {
      const marker = L.marker([p.lat, p.lng], {
        icon: pinIcon(p, p.selected),
        zIndexOffset: p.selected ? 600 : 0,
        eventId: p.eventId,
      });
      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev);
        window.parent.postMessage({ type: 'map-pin', eventId: p.eventId }, '*');
      });
      markerById[p.eventId] = { marker, pin: p };
      clusterGroup.addLayer(marker);
    }
    map.addLayer(clusterGroup);

    // At max zoom, open the multi-pin sheet instead of only spiderfying
    // when several events share essentially the same coordinate.
    clusterGroup.on('clusterclick', (e) => {
      if (map.getZoom() < (map.getMaxZoom() - 1)) return;
      const childMarkers = e.layer.getAllChildMarkers();
      const eventIds = childMarkers.map((m) => m.options.eventId).filter(Boolean);
      if (eventIds.length > 1) {
        L.DomEvent.stopPropagation(e);
        window.parent.postMessage({ type: 'map-cluster-open', eventIds }, '*');
      }
    });

    window.addEventListener('message', (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === 'map-animate') {
        map.setView([ev.data.lat, ev.data.lng], ev.data.zoom || map.getZoom(), { animate: true });
        return;
      }
      if (ev.data.type === 'map-select') {
        const selectedId = ev.data.eventId || null;
        for (const id of Object.keys(markerById)) {
          const entry = markerById[id];
          const selected = id === selectedId;
          entry.marker.setIcon(pinIcon(entry.pin, selected));
          entry.marker.setZIndexOffset(selected ? 600 : 0);
        }
      }
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
    // Keep last camera so pin-set rebuilds do not jump the user back out.
    const liveRegionRef = useRef<Region>(mapRegion ?? initialRegion);
    const pinsById = useMemo(() => {
      const map = new Map<string, EventMapPin>();
      for (const p of pins) map.set(p.event_id, p);
      return map;
    }, [pins]);

    useImperativeHandle(ref, () => ({
      animateToRegion(region, _durationMs = 450) {
        liveRegionRef.current = region;
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'map-animate',
            lat: region.latitude,
            lng: region.longitude,
            zoom: zoomFromRegion(region),
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
          const next: Region = {
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: data.latitudeDelta,
            longitudeDelta: data.longitudeDelta,
          };
          liveRegionRef.current = next;
          onRegionChangeComplete?.(next);
        }
      };
      window.addEventListener('message', onMessage);
      return () => window.removeEventListener('message', onMessage);
    }, [onMarkerPress, onClusterPress, onMapPress, onRegionChangeComplete, pinsById]);

    // Selection updates without rebuilding the iframe (preserves zoom/clusters).
    useEffect(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'map-select', eventId: selectedEventId ?? null },
        '*',
      );
    }, [selectedEventId]);

    const html = useMemo(
      () =>
        buildLeafletHtml(pins, liveRegionRef.current, selectedEventId, mapType, {
          background: colors.background,
          primary: colors.primary,
        }),
      // Rebuild on pin set / basemap / chrome — clustering lives inside Leaflet
      // and recomputes on every zoom/pan without a React rebuild.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [pins, mapType, colors.background, colors.primary],
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

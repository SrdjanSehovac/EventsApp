import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';
import {
  clusterNeedsZoom,
  clusterPins,
  regionForCluster,
  type PinCluster,
} from '../utils/clusterPins';
import { formatPinBadge } from '../utils/eventFormat';
import { mapStyleFor } from '../utils/mapStyle';
import type { MapBaseType } from '../browse';

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
  /** User drag, so the screen can dismiss the keyboard. */
  onPanDrag?: () => void;
  onMarkerPress?: (pin: EventMapPin) => void;
  onClusterPress?: (pins: EventMapPin[]) => void;
  onMapPress?: () => void;
  /** When true, a tap only dismisses search and must not open a pin. */
  blocksSelection?: () => boolean;
};

type PinMarkerProps = {
  cluster: PinCluster;
  fill: string;
  textColor: string;
  pinStroke: string;
  pinOutline: string;
  onPress: (cluster: PinCluster) => void;
};

const PinMarker = memo(function PinMarker({
  cluster,
  fill,
  textColor,
  pinStroke,
  pinOutline,
  onPress,
}: PinMarkerProps) {
  const pin = cluster.pins[0];
  const label = cluster.count > 1 ? String(cluster.count) : formatPinBadge(pin);
  const showDot = cluster.count === 1 && !label;
  // Width includes padding and the white border, so "Free" / "$25" / "Sale"
  // are not clipped to "Fr..." by a 44pt hit target.
  const badgeWidth =
    cluster.count > 1
      ? Math.max(44, label.length * 16 + 20)
      : Math.max(64, label.length * 8 + 28);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 350);
    return () => clearTimeout(timer);
  }, [cluster.id, label]);

  return (
    <Marker
      coordinate={{
        latitude: cluster.latitude,
        longitude: cluster.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={cluster.count > 1 ? 2 : 1}
      tracksViewChanges={tracksViewChanges}
      tappable
      stopPropagation
      onPress={() => onPress(cluster)}
    >
      <View collapsable={false} style={styles.markerHit} pointerEvents="none">
        {/* Outer halo ring, white inner ring, solid fill, then a two-layer
            pointer tip so the tip reads on both pale and green tiles. */}
        <View
          style={[
            styles.halo,
            {
              borderColor: pinOutline,
              shadowColor: pinOutline,
              borderRadius: showDot ? 13 : cluster.count > 1 ? badgeWidth / 2 + 3 : 999,
            },
          ]}
        >
          {showDot ? (
            <View style={[styles.dot, { backgroundColor: fill, borderColor: pinStroke }]} />
          ) : (
            <View
              style={[
                cluster.count > 1 ? styles.cluster : styles.badge,
                cluster.count > 1
                  ? { width: badgeWidth, height: badgeWidth, borderRadius: badgeWidth / 2 }
                  : { width: badgeWidth },
                { backgroundColor: fill, borderColor: pinStroke },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: textColor },
                  cluster.count > 1 && styles.clusterText,
                ]}
              >
                {label}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.tipWrap}>
          <View style={[styles.tipOuter, { borderTopColor: pinOutline }]} />
          <View style={[styles.tipRing, { borderTopColor: pinStroke }]} />
          <View style={[styles.tipFill, { borderTopColor: fill }]} />
        </View>
      </View>
    </Marker>
  );
});

export const EventsMap = forwardRef<EventsMapHandle, EventsMapProps>(
  function EventsMap(
    {
      pins,
      initialRegion,
      userGeo,
      isLoading = false,
      mapRegion,
      mapType = 'standard',
      onRegionChangeComplete,
      onPanDrag,
      onMarkerPress,
      onClusterPress,
      onMapPress,
      blocksSelection,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const mapRef = useRef<MapView>(null);
    const hasLoadedOnce = useRef(false);
    const ignoreMapPressUntilRef = useRef(0);

    if (!isLoading) {
      hasLoadedOnce.current = true;
    }

    useImperativeHandle(ref, () => ({
      animateToRegion(region, durationMs = 450) {
        mapRef.current?.animateToRegion(region, durationMs);
      },
    }));

    const clusters = useMemo(
      () => clusterPins(pins, mapRegion ?? initialRegion),
      [pins, mapRegion, initialRegion],
    );

    const showBlockingLoader = isLoading && !hasLoadedOnce.current;

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          mapType={mapType === 'satellite' ? 'satellite' : 'standard'}
          // Apple Maps: light or dark base to match the app theme.
          userInterfaceStyle={colors.mapStyle}
          // Google Maps (Android): muted parks so pins stand out.
          customMapStyle={mapStyleFor(colors.mapStyle)}
          showsUserLocation={Boolean(userGeo)}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsPointsOfInterests={false}
          showsTraffic={false}
          showsIndoors={false}
          toolbarEnabled={false}
          mapPadding={{ top: 8, right: 8, bottom: 8, left: 8 }}
          onRegionChangeComplete={onRegionChangeComplete}
          onPanDrag={onPanDrag ? () => onPanDrag() : undefined}
          onPress={() => {
            if (Date.now() < ignoreMapPressUntilRef.current) return;
            onMapPress?.();
          }}
        >
          {clusters.map((cluster) => {
            return (
              <PinMarker
                key={cluster.id}
                cluster={cluster}
                fill={colors.pin}
                textColor={colors.pinText}
                pinStroke={colors.pinStroke}
                pinOutline={colors.pinOutline}
                onPress={(next) => {
                  ignoreMapPressUntilRef.current = Date.now() + 400;
                  if (blocksSelection?.()) {
                    onMapPress?.();
                    return;
                  }
                  if (next.count > 1) {
                    // Spread-out clusters zoom in (Realtor.ca-style);
                    // coincident pins open the multi-event sheet.
                    if (clusterNeedsZoom(next)) {
                      mapRef.current?.animateToRegion(
                        regionForCluster(next),
                        420,
                      );
                      return;
                    }
                    onClusterPress?.(next.pins);
                    return;
                  }
                  onMarkerPress?.(next.pins[0]);
                }}
              />
            );
          })}
        </MapView>

        {showBlockingLoader ? (
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
  map: {
    ...StyleSheet.absoluteFill,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  halo: {
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2.5,
    minWidth: 44,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
  },
  cluster: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  clusterText: {
    fontSize: 14,
  },
  tipWrap: {
    width: 20,
    height: 12,
    marginTop: -2,
    alignItems: 'center',
  },
  tipOuter: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tipRing: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tipFill: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

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
  onMarkerPress?: (pin: EventMapPin) => void;
  onClusterPress?: (pins: EventMapPin[]) => void;
  onMapPress?: () => void;
};

type PinMarkerProps = {
  cluster: PinCluster;
  fill: string;
  pinStroke: string;
  pinOutline: string;
  onPress: (cluster: PinCluster) => void;
};

const PinMarker = memo(function PinMarker({
  cluster,
  fill,
  pinStroke,
  pinOutline,
  onPress,
}: PinMarkerProps) {
  const pin = cluster.pins[0];
  const label = cluster.count > 1 ? String(cluster.count) : formatPinBadge(pin);
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
      <View style={styles.markerHit} pointerEvents="none">
        <View
          style={[
            cluster.count > 1 ? styles.cluster : styles.badge,
            {
              backgroundColor: fill,
              borderColor: pinStroke,
              shadowColor: pinOutline,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.badgeText,
              cluster.count > 1 && styles.clusterText,
            ]}
          >
            {label}
          </Text>
        </View>
        <View style={[styles.caret, { borderTopColor: fill }]} />
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
      onMarkerPress,
      onClusterPress,
      onMapPress,
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
          showsUserLocation={Boolean(userGeo)}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
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
                pinStroke={colors.pinStroke}
                pinOutline={colors.pinOutline}
                onPress={(next) => {
                  ignoreMapPressUntilRef.current = Date.now() + 400;
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
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    maxWidth: 128,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  cluster: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  clusterText: {
    fontSize: 14,
  },
  caret: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

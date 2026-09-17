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
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { colorForCategory, useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';
import {
  clusterNeedsZoom,
  clusterPins,
  regionForCluster,
  type PinCluster,
} from '../utils/clusterPins';
import { isEventLive } from '../utils/eventLive';
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
  selected: boolean;
  live: boolean;
  forceTracks: boolean;
  pinStroke: string;
  pinOutline: string;
  onPress: (cluster: PinCluster) => void;
};

const PinMarker = memo(function PinMarker({
  cluster,
  selected,
  live,
  forceTracks,
  pinStroke,
  pinOutline,
  onPress,
}: PinMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [layoutReady, setLayoutReady] = useState(false);
  const pin = cluster.pins[0];
  const fill = colorForCategory(pin?.primary_category);
  const label = cluster.count > 1 ? String(cluster.count) : formatPinBadge(pin);

  useEffect(() => {
    setLayoutReady(false);
    const timer = setTimeout(() => setLayoutReady(true), 400);
    return () => clearTimeout(timer);
  }, [cluster.id, selected, live, fill, label]);

  useEffect(() => {
    if (!live || cluster.count > 1) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [live, pulse, cluster.count]);

  const ringStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.55, 0],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.2],
        }),
      },
    ],
  };

  const tracksViewChanges = live || selected || forceTracks || !layoutReady;

  return (
    <Marker
      coordinate={{
        latitude: cluster.latitude,
        longitude: cluster.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={selected ? 6 : cluster.count > 1 ? 4 : live ? 3 : 1}
      tracksViewChanges={tracksViewChanges}
      tappable
      stopPropagation
      onPress={() => onPress(cluster)}
    >
      <View style={styles.markerHit} pointerEvents="none">
        {live && cluster.count === 1 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              { borderColor: fill },
              ringStyle,
            ]}
          />
        ) : null}
        <View
          style={[
            cluster.count > 1 ? styles.cluster : styles.badge,
            selected && styles.badgeSelected,
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
              selected && styles.badgeTextSelected,
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
    const mapRef = useRef<MapView>(null);
    const hasLoadedOnce = useRef(false);
    const prevSelectedRef = useRef<string | null>(null);
    const ignoreMapPressUntilRef = useRef(0);
    const [redrawId, setRedrawId] = useState<string | null>(null);
    const [nowMs, setNowMs] = useState(() => Date.now());

    if (!isLoading) {
      hasLoadedOnce.current = true;
    }

    useImperativeHandle(ref, () => ({
      animateToRegion(region, durationMs = 450) {
        mapRef.current?.animateToRegion(region, durationMs);
      },
    }));

    useEffect(() => {
      const prev = prevSelectedRef.current;
      prevSelectedRef.current = selectedEventId ?? null;
      if (prev && prev !== selectedEventId) {
        setRedrawId(prev);
        const timer = setTimeout(() => setRedrawId(null), 350);
        return () => clearTimeout(timer);
      }
    }, [selectedEventId]);

    useEffect(() => {
      const timer = setInterval(() => setNowMs(Date.now()), 60_000);
      return () => clearInterval(timer);
    }, []);

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
            const selected = cluster.pins.some(
              (pin) => pin.event_id === selectedEventId,
            );
            const live =
              cluster.count === 1 && isEventLive(cluster.pins[0], nowMs);
            return (
              <PinMarker
                key={cluster.id}
                cluster={cluster}
                selected={selected}
                live={live}
                pinStroke={colors.pinStroke}
                pinOutline={colors.pinOutline}
                forceTracks={cluster.id === redrawId}
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
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    top: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    maxWidth: 128,
    minWidth: 18,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  badgeSelected: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cluster: {
    minWidth: 32,
    minHeight: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextSelected: {
    fontSize: 12,
  },
  clusterText: {
    fontSize: 13,
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

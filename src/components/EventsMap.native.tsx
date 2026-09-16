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

import { useTheme } from '../theme';
import type { EventMapPin } from '../types/events';
import type { UserGeo } from '../types/common';
import { clusterPins, type PinCluster } from '../utils/clusterPins';
import { isEventLive } from '../utils/eventLive';
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
  pinFill: string;
  pinStroke: string;
  onPress: (cluster: PinCluster) => void;
};

const PinMarker = memo(function PinMarker({
  cluster,
  selected,
  live,
  forceTracks,
  pinFill,
  pinStroke,
  onPress,
}: PinMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [layoutReady, setLayoutReady] = useState(false);
  const fill = pinFill;
  const label = String(cluster.count);
  const size = cluster.count > 9 ? 38 : cluster.count > 1 ? 34 : 28;

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
            styles.teardrop,
            selected && styles.teardropSelected,
            {
              width: size,
              height: size,
              backgroundColor: fill,
              borderColor: pinStroke,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: cluster.count > 1 ? 13 : 12 }]}>
            {label}
          </Text>
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
                pinFill={colors.pinFill}
                forceTracks={cluster.id === redrawId}
                onPress={(next) => {
                  ignoreMapPressUntilRef.current = Date.now() + 400;
                  if (next.count > 1) {
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
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    top: 8,
  },
  teardrop: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    borderBottomLeftRadius: 6,
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#111827',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  teardropSelected: {
    borderWidth: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    transform: [{ rotate: '45deg' }],
  },
});

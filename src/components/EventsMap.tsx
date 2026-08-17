import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { useTheme } from '../theme';
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

type PinMarkerProps = {
  pin: EventMapPin;
  selected: boolean;
  live: boolean;
  forceTracks: boolean;
  primaryColor: string;
  onPress: (pin: EventMapPin) => void;
};

const PinMarker = memo(function PinMarker({
  pin,
  selected,
  live,
  forceTracks,
  primaryColor,
  onPress,
}: PinMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [layoutReady, setLayoutReady] = useState(false);

  // Snapshot custom views once after mount; keep tracking while live/selected.
  useEffect(() => {
    setLayoutReady(false);
    const timer = setTimeout(() => setLayoutReady(true), 400);
    return () => clearTimeout(timer);
  }, [pin.event_id, selected, live]);

  useEffect(() => {
    if (!live) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        // Maps snapshot the view; JS-driven updates keep tracksViewChanges in sync.
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [live, pulse]);

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

  const size = selected ? 16 : 12;
  const color = selected || live ? primaryColor : '#64748B';
  const tracksViewChanges =
    live || selected || forceTracks || !layoutReady;

  return (
    <Marker
      coordinate={{
        latitude: pin.latitude,
        longitude: pin.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={selected ? 3 : live ? 2 : 1}
      tracksViewChanges={tracksViewChanges}
      tappable
      stopPropagation
      onPress={() => onPress(pin)}
    >
      <View style={styles.markerHit} pointerEvents="none">
        {live ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              { borderColor: primaryColor },
              ringStyle,
            ]}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              borderColor: '#FFFFFF',
            },
          ]}
        />
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
      onRegionChangeComplete,
      onMarkerPress,
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

    // Re-check live windows so pulses start/stop without a refetch.
    useEffect(() => {
      const timer = setInterval(() => setNowMs(Date.now()), 60_000);
      return () => clearInterval(timer);
    }, []);

    const showBlockingLoader = isLoading && !hasLoadedOnce.current;

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={Boolean(userGeo)}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={() => {
            // Marker taps often also bubble a map press; ignore the echo.
            if (Date.now() < ignoreMapPressUntilRef.current) return;
            onMapPress?.();
          }}
        >
          {pins.map((pin) => {
            const selected = pin.event_id === selectedEventId;
            const live = isEventLive(pin, nowMs);
            return (
              <PinMarker
                key={pin.event_id}
                pin={pin}
                selected={selected}
                live={live}
                primaryColor={colors.primary}
                forceTracks={pin.event_id === redrawId}
                onPress={(p) => {
                  ignoreMapPressUntilRef.current = Date.now() + 400;
                  onMarkerPress?.(p);
                }}
              />
            );
          })}
        </MapView>

        {showBlockingLoader ? (
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
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  markerHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  dot: {
    borderWidth: 2,
  },
});

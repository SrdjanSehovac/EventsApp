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

type PinMarkerProps = {
  pin: EventMapPin;
  selected: boolean;
  live: boolean;
  forceTracks: boolean;
  pinStroke: string;
  pinOutline: string;
  onPress: (pin: EventMapPin) => void;
};

const PinMarker = memo(function PinMarker({
  pin,
  selected,
  live,
  forceTracks,
  pinStroke,
  pinOutline,
  onPress,
}: PinMarkerProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [layoutReady, setLayoutReady] = useState(false);
  const fill = colorForCategory(pin.primary_category);

  useEffect(() => {
    setLayoutReady(false);
    const timer = setTimeout(() => setLayoutReady(true), 400);
    return () => clearTimeout(timer);
  }, [pin.event_id, selected, live, fill]);

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

  const tracksViewChanges = live || selected || forceTracks || !layoutReady;
  const headSize = selected ? 22 : 16;

  return (
    <Marker
      coordinate={{
        latitude: pin.latitude,
        longitude: pin.longitude,
      }}
      anchor={{ x: 0.5, y: selected ? 1 : 0.5 }}
      zIndex={selected ? 4 : live ? 3 : 1}
      tracksViewChanges={tracksViewChanges}
      tappable
      stopPropagation
      onPress={() => onPress(pin)}
    >
      <View
        style={[styles.markerHit, selected && styles.markerHitSelected]}
        pointerEvents="none"
      >
        {live ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              { borderColor: fill },
              ringStyle,
            ]}
          />
        ) : null}
        {selected ? (
          <View style={styles.pinColumn}>
            <View
              style={[
                styles.pinHead,
                {
                  width: headSize,
                  height: headSize,
                  borderRadius: headSize / 2,
                  backgroundColor: fill,
                  borderColor: pinStroke,
                  shadowColor: pinOutline,
                },
              ]}
            >
              <View
                style={[
                  styles.pinCore,
                  { backgroundColor: pinStroke, borderColor: pinOutline },
                ]}
              />
            </View>
            <View
              style={[
                styles.pinTip,
                {
                  borderTopColor: fill,
                },
              ]}
            />
          </View>
        ) : (
          <View
            style={[
              styles.dot,
              {
                width: headSize,
                height: headSize,
                borderRadius: headSize / 2,
                backgroundColor: fill,
                borderColor: pinStroke,
                shadowColor: pinOutline,
              },
            ]}
          />
        )}
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
                pinStroke={colors.pinStroke}
                pinOutline={colors.pinOutline}
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
    backgroundColor: 'rgba(255,246,238,0.4)',
  },
  markerHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHitSelected: {
    height: 52,
    justifyContent: 'flex-end',
  },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  pinColumn: {
    alignItems: 'center',
  },
  pinHead: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 2,
    elevation: 4,
  },
  pinCore: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -3,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dot: {
    borderWidth: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1.5,
    elevation: 3,
  },
});

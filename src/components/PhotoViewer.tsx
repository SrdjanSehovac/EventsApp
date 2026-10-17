import { useCallback, useEffect, useRef } from 'react';
import { Image, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

type PhotoViewerProps = {
  uri: string;
  visible: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

export function PhotoViewer({ uri, visible, onClose }: PhotoViewerProps) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = useCallback(() => onCloseRef.current(), []);

  const width = useSharedValue(window.width);
  const height = useSharedValue(window.height);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    width.value = window.width;
    height.value = window.height;
  }, [window.width, window.height, width, height]);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  }, [uri, visible, scale, savedScale, translateX, translateY, savedX, savedY]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE + 0.02) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
        return;
      }
      savedScale.value = scale.value;
      const maxX = ((scale.value - 1) * width.value) / 2;
      const maxY = ((scale.value - 1) * height.value) / 2;
      const nextX = clamp(translateX.value, -maxX, maxX);
      const nextY = clamp(translateY.value, -maxY, maxY);
      translateX.value = withTiming(nextX);
      translateY.value = withTiming(nextY);
      savedX.value = nextX;
      savedY.value = nextY;
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((event) => {
      if (scale.value > 1.02) {
        const maxX = ((scale.value - 1) * width.value) / 2;
        const maxY = ((scale.value - 1) * height.value) / 2;
        translateX.value = clamp(savedX.value + event.translationX, -maxX, maxX);
        translateY.value = clamp(savedY.value + event.translationY, -maxY, maxY);
        return;
      }
      translateX.value = 0;
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (scale.value > 1.02) {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
        return;
      }
      if (translateY.value > 120 || event.velocityY > 900) {
        translateY.value = withTiming(height.value, { duration: 180 }, (finished) => {
          if (finished) runOnJS(close)();
        });
        return;
      }
      translateY.value = withTiming(0);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(16)
    .onEnd((event) => {
      if (scale.value > 1.02) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
        return;
      }
      const maxX = ((DOUBLE_TAP_SCALE - 1) * width.value) / 2;
      const maxY = ((DOUBLE_TAP_SCALE - 1) * height.value) / 2;
      const nextX = clamp((event.x - width.value / 2) * (1 - DOUBLE_TAP_SCALE), -maxX, maxX);
      const nextY = clamp((event.y - height.value / 2) * (1 - DOUBLE_TAP_SCALE), -maxY, maxY);
      scale.value = withTiming(DOUBLE_TAP_SCALE);
      savedScale.value = DOUBLE_TAP_SCALE;
      translateX.value = withTiming(nextX);
      translateY.value = withTiming(nextY);
      savedX.value = nextX;
      savedY.value = nextY;
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, 320],
      [1, 0.25],
      Extrapolation.CLAMP,
    ),
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <GestureHandlerRootView style={styles.fill}>
        <StatusBar style="light" />
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, backdropStyle]}
        />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.fill, imageStyle]}>
            <Image
              source={{ uri, cache: 'force-cache' }}
              style={styles.image}
              resizeMode="contain"
              resizeMethod="none"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </GestureDetector>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          onPress={close}
          hitSlop={8}
          style={[
            styles.close,
            { top: insets.top + 8, right: 12 },
          ]}
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});

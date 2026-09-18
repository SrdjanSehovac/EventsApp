import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type EventMapSnippetProps = {
  latitude: number;
  longitude: number;
  label?: string | null;
  onPress: () => void;
};

export function EventMapSnippet({
  latitude,
  longitude,
  onPress,
}: EventMapSnippetProps) {
  const { colors, typography, radius, shadows } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open in maps"
      onPress={onPress}
      style={[
        styles.wrap,
        shadows.soft,
        { borderRadius: radius.lg, borderColor: colors.border },
      ]}
    >
      <MapView
        style={styles.map}
        pointerEvents="none"
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        liteMode
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
      <View
        style={[
          styles.chip,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="navigate" size={14} color={colors.primary} />
        <Text
          numberOfLines={1}
          style={[typography.caption, { color: colors.text, fontWeight: '800' }]}
        >
          Open in Maps
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 168,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  chip: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

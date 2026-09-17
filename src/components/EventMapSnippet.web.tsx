import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type EventMapSnippetProps = {
  latitude: number;
  longitude: number;
  label?: string | null;
  onPress: () => void;
};

function osmTileUrl(lat: number, lng: number, zoom = 14): string {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2) *
      n,
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export function EventMapSnippet({
  latitude,
  longitude,
  onPress,
}: EventMapSnippetProps) {
  const { colors, typography, radius, shadows } = useTheme();
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open in maps"
      onPress={onPress}
      style={[
        styles.wrap,
        shadows.soft,
        {
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      {failed ? (
        <View style={styles.fallback}>
          <Ionicons name="map-outline" size={28} color={colors.primary} />
        </View>
      ) : (
        <Image
          source={{ uri: osmTileUrl(latitude, longitude) }}
          style={styles.map}
          onError={() => setFailed(true)}
        />
      )}
      <View style={styles.pinWrap} pointerEvents="none">
        <Ionicons name="location" size={28} color={colors.primary} />
      </View>
      <View
        style={[
          styles.chip,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="navigate" size={14} color={colors.primary} />
        <Text
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
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
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

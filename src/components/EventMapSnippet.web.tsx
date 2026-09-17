import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

type EventMapSnippetProps = {
  latitude: number;
  longitude: number;
  label?: string | null;
  onPress: () => void;
};

function embedUrl(lat: number, lng: number): string {
  const pad = 0.008;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${lat}%2C${lng}`;
}

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
      <iframe
        title="Event location map"
        src={embedUrl(latitude, longitude)}
        style={{
          border: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'block',
        }}
      />
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

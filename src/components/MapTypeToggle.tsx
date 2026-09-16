import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBrowse, type MapBaseType } from '../browse';
import { useTheme } from '../theme';

export function MapTypeToggle() {
  const { colors, typography, shadows } = useTheme();
  const { mapType, setMapType } = useBrowse();

  function segment(next: MapBaseType, label: string) {
    const selected = mapType === next;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        onPress={() => setMapType(next)}
        style={[
          styles.segment,
          selected && { backgroundColor: colors.surface },
        ]}
      >
        <Text
          style={[
            typography.caption,
            {
              color: selected ? colors.text : colors.textSecondary,
              fontWeight: selected ? '800' : '600',
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, shadows.soft, { backgroundColor: colors.surfaceElevated }]}>
      {segment('standard', 'Map')}
      {segment('satellite', 'Satellite')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
});

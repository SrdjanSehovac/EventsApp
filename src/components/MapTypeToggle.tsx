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
          selected && {
            backgroundColor: colors.surface,
            shadowColor: '#111827',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
      >
        <Text
          style={[
            typography.caption,
            {
              color: colors.text,
              fontWeight: selected ? '800' : '600',
              fontSize: 14,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        shadows.soft,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {segment('standard', 'Map')}
      {segment('satellite', 'Satellite')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
  },
});

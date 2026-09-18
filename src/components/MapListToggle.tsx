import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import { useTheme } from '../theme';

type MapListToggleProps = {
  bottomOffset: number;
};

export function MapListToggle({ bottomOffset }: MapListToggleProps) {
  const { colors, typography, shadows, radius } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isList = pathname === '/events' || pathname.endsWith('/events');

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomOffset }]}
    >
      <View
        style={[
          styles.pill,
          shadows.fab,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.full,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !isList }}
          accessibilityLabel="Map view"
          onPress={() => router.navigate('/')}
          style={[
            styles.segment,
            {
              backgroundColor: !isList ? colors.primary : 'transparent',
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons
            name={!isList ? 'map' : 'map-outline'}
            size={16}
            color={!isList ? colors.onPrimary : colors.textSecondary}
          />
          <Text
            style={[
              typography.caption,
              {
                color: !isList ? colors.onPrimary : colors.textSecondary,
                fontWeight: '800',
                marginLeft: 6,
              },
            ]}
          >
            Map
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isList }}
          accessibilityLabel="List view"
          onPress={() => router.navigate('/events')}
          style={[
            styles.segment,
            {
              backgroundColor: isList ? colors.primary : 'transparent',
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons
            name={isList ? 'list' : 'list-outline'}
            size={16}
            color={isList ? colors.onPrimary : colors.textSecondary}
          />
          <Text
            style={[
              typography.caption,
              {
                color: isList ? colors.onPrimary : colors.textSecondary,
                fontWeight: '800',
                marginLeft: 6,
              },
            ]}
          >
            List
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
});

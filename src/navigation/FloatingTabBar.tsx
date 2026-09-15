import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';

import { useTheme } from '../theme';

type TabMeta = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TABS: TabMeta[] = [
  {
    name: 'index',
    label: 'Map',
    icon: 'map-outline',
    iconFocused: 'map',
  },
  {
    name: 'events',
    label: 'List',
    icon: 'list-outline',
    iconFocused: 'list',
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
  },
];

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography, tabBar, shadows, spacing } = useTheme();

  const bottomPad = Math.max(insets.bottom, spacing.sm);
  const barHeight = tabBar.height + bottomPad;
  const activeRoute = state.routes[state.index]?.name;

  function navigateTo(routeName: string) {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }

  return (
    <View
      style={[
        styles.bar,
        shadows.soft,
        {
          height: barHeight,
          paddingBottom: bottomPad,
          backgroundColor: colors.tabBar,
          borderTopColor: colors.hairline,
        },
      ]}
    >
      {TABS.map((tab) => {
        const focused = activeRoute === tab.name;
        const color = focused ? colors.primary : colors.tabInactive;
        const iconName = focused ? tab.iconFocused : tab.icon;

        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={() => navigateTo(tab.name)}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: focused ? colors.primaryMuted : 'transparent',
                },
              ]}
            >
              <Ionicons name={iconName} size={tabBar.iconSize} color={color} />
            </View>
            <Text
              style={[
                typography.tabLabel,
                {
                  color,
                  marginTop: 2,
                  fontWeight: focused ? '700' : '600',
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

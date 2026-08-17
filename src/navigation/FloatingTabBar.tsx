import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';

import { useTheme } from '../theme';

type SideTab = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const SIDE_TABS: SideTab[] = [
  {
    name: 'events',
    label: 'Events',
    icon: 'calendar-outline',
    iconFocused: 'calendar',
  },
  {
    name: 'admin',
    label: 'Admin',
    icon: 'settings-outline',
    iconFocused: 'settings',
  },
];

const CENTER_ROUTE = 'index';

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, typography, tabBar, shadows, spacing } = useTheme();

  const bottomPad = Math.max(insets.bottom, spacing.sm);
  const barHeight = tabBar.height + bottomPad;

  const activeRoute = state.routes[state.index]?.name;
  const mapFocused = activeRoute === CENTER_ROUTE;

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

  function renderSideTab(tab: SideTab) {
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
        style={styles.sideTab}
      >
        <Ionicons name={iconName} size={tabBar.iconSize} color={color} />
        <Text style={[typography.tabLabel, { color, marginTop: 2 }]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrapper, { height: barHeight + tabBar.fabProtrusion }]}>
      <View
        style={[
          styles.bar,
          {
            height: barHeight,
            paddingBottom: bottomPad,
            backgroundColor: colors.tabBar,
            borderTopColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.sideGroup}>{renderSideTab(SIDE_TABS[0])}</View>

        <View style={styles.centerSpacer} />

        <View style={styles.sideGroup}>{renderSideTab(SIDE_TABS[1])}</View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={mapFocused ? { selected: true } : {}}
        accessibilityLabel="Map"
        onPress={() => navigateTo(CENTER_ROUTE)}
        style={[
          styles.fab,
          shadows.fab,
          {
            width: tabBar.fabSize,
            height: tabBar.fabSize,
            borderRadius: tabBar.fabSize / 2,
            backgroundColor: colors.accent,
            bottom: barHeight - tabBar.fabSize / 2,
            borderColor: colors.tabBar,
          },
        ]}
      >
        <Ionicons
          name={mapFocused ? 'map' : 'map-outline'}
          size={tabBar.fabIconSize}
          color={colors.onAccent}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sideTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    paddingVertical: 6,
  },
  centerSpacer: {
    width: 72,
  },
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    zIndex: 2,
  },
});

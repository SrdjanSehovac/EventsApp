import { Tabs } from 'expo-router';

import { FloatingTabBar } from '../../src/navigation/FloatingTabBar';
import { useTheme } from '../../src/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'List',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: null,
        }}
      />
    </Tabs>
  );
}

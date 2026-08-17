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
        name="events"
        options={{
          title: 'Events',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
        }}
      />
    </Tabs>
  );
}

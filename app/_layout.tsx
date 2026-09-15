import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useUserGeo } from '../src/hooks';
import { AppQueryProvider } from '../src/query';
import { AuthProvider } from '../src/auth';
import { ThemeProvider, useTheme } from '../src/theme';

function RootNavigator() {
  const { colors, isDark } = useTheme();
  // Request location once at launch; screens share the cached result.
  useUserGeo();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="account" />
        <Stack.Screen name="favourites" />
        <Stack.Screen name="submit-event" />
        <Stack.Screen name="become-business" />
        <Stack.Screen name="business" />
        <Stack.Screen name="business-verify" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppQueryProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AppQueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

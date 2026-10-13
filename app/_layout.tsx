import { Stack, useRouter } from 'expo-router';
import { Appearance, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '../src/auth';
import { TicketCheckoutProvider } from '../src/checkout/TicketCheckoutProvider';
import { hideDevMenuButton } from '../src/dev/hideDevMenuButton';
import { useUserGeo } from '../src/hooks';
import { AppQueryProvider } from '../src/query';
import { configureNotificationDisplay } from '../src/reminders';
import { eventDetailHref } from '../src/utils/eventDetail';
import { ThemeProvider, useTheme } from '../src/theme';

function RootNavigator() {
  const { colors, isDark, mode, resolvedScheme } = useTheme();
  // Native pickers, alerts and the keyboard follow the app's choice; Match
  // iPhone hands control back to iOS.
  useEffect(() => {
    if (Platform.OS === 'web' || typeof Appearance.setColorScheme !== 'function') return;
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : resolvedScheme);
  }, [mode, resolvedScheme]);
  // Request location once at launch; screens share the cached result.
  useUserGeo();

  const router = useRouter();
  useEffect(() => {
    hideDevMenuButton();
    configureNotificationDisplay();
  }, []);

  // Tapping a reminder opens that event.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.content.data?.eventId;
      if (typeof id === 'string') router.push(eventDetailHref(id));
    });
    return () => sub.remove();
  }, [router]);

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
        <Stack.Screen name="settings" />
        <Stack.Screen name="favourites" />
        <Stack.Screen name="event/[id]" />
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
            <TicketCheckoutProvider>
              <RootNavigator />
            </TicketCheckoutProvider>
          </AuthProvider>
        </AppQueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

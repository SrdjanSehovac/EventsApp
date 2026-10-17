import { Stack, useRouter } from 'expo-router';
import { Appearance, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, takePendingAction, useAuth } from '../src/auth';
import { TicketCheckoutProvider } from '../src/checkout/TicketCheckoutProvider';
import { hideDevMenuButton } from '../src/dev/hideDevMenuButton';
import { useUserGeo } from '../src/hooks';
import { AppQueryProvider } from '../src/query';
import { configureNotificationDisplay } from '../src/reminders';
import { eventDetailHref } from '../src/utils/eventDetail';
import { ThemeProvider, useTheme } from '../src/theme';

// Keep the splash up until the stored session is checked, so a user who
// must accept updated agreements never sees the app flash first.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { colors, isDark, mode, resolvedScheme } = useTheme();
  const { status, needsLegal } = useAuth();
  // Native pickers, alerts and the keyboard follow the app's choice; Match
  // iPhone hands control back to iOS.
  useEffect(() => {
    if (Platform.OS === 'web' || typeof Appearance.setColorScheme !== 'function') return;
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : resolvedScheme);
  }, [mode, resolvedScheme]);
  // Request location once at launch; screens share the cached result.
  useUserGeo();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  const router = useRouter();

  // Finish whatever the user tapped (save, share, RSVP, ...) once they have
  // an account and have accepted the current agreements. The short delay
  // lets the sign-up sheet close first.
  const ready = status === 'signedIn' && !needsLegal;
  useEffect(() => {
    if (!ready) return;
    const next = takePendingAction();
    if (!next) return;
    const t = setTimeout(() => {
      void Promise.resolve(next.run()).catch((err) => console.error('pending action', err));
    }, 350);
    return () => clearTimeout(t);
  }, [ready]);

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
        {/* Browsing is open to everyone. Saving, calendar, share, posting and
            RSVP ask for an account (useRequireAccount). Signed-in users who
            have not accepted the current agreements only see accept-terms. */}
        <Stack.Protected guard={!needsLegal}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="account" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="favourites" />
          <Stack.Screen name="submit-event" />
          <Stack.Screen name="become-business" />
          <Stack.Screen name="business" />
          <Stack.Screen name="business-verify" />
          <Stack.Screen name="contribute" />
          <Stack.Screen name="suggest-event" />
          <Stack.Screen name="ticket/[id]" />
          <Stack.Screen name="guests/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={status !== 'signedIn'}>
          <Stack.Screen name="sign-up" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={needsLegal}>
          <Stack.Screen name="accept-terms" options={{ gestureEnabled: false }} />
        </Stack.Protected>
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

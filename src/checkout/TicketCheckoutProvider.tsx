import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth';
import { EventbriteCheckoutSheet } from '../components/EventbriteCheckoutSheet';
import { favouriteKeys, useToggleFavourite } from '../hooks/favourites';
import { useTheme } from '../theme';
import type { EventListItem } from '../types/events';
import {
  ticketDestination,
  type EventbriteIdSource,
} from '../utils/eventbriteCheckout';
import { openInAppBrowser } from './openInAppBrowser';

type TicketEvent = EventbriteIdSource & {
  event_id: string;
  title: string;
};

type OpenTicketsInput = {
  url: string;
  event: TicketEvent;
  item?: EventListItem;
};

type TicketCheckoutContextValue = {
  openTickets: (input: OpenTicketsInput) => void;
};

const TicketCheckoutContext = createContext<TicketCheckoutContextValue | null>(
  null,
);

type Session = {
  title: string;
  eventbriteId: string;
  eventId: string;
  item?: EventListItem;
};

export function TicketCheckoutProvider({ children }: { children: ReactNode }) {
  const { colors, typography, spacing, radius } = useTheme();
  const { isSignedIn } = useAuth();
  const toggleFavourite = useToggleFavourite();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    saved: boolean;
  } | null>(null);

  const openTickets = useCallback(
    (input: OpenTicketsInput) => {
      const destination = ticketDestination(input.event, input.url);
      if (!destination) return;
      if (destination.kind === 'eventbrite') {
        setConfirmation(null);
        setSession({
          title: input.event.title,
          eventbriteId: destination.eventId,
          eventId: input.event.event_id,
          item: input.item,
        });
        return;
      }
      void openInAppBrowser(destination.url, colors.primary);
    },
    [colors.primary],
  );

  const onComplete = useCallback(() => {
    const current = session;
    setSession(null);
    if (!current) return;
    let saved = false;
    if (isSignedIn && current.item) {
      const cached = queryClient.getQueryData<{ items: EventListItem[] }>(
        favouriteKeys.list(),
      );
      const already =
        cached?.items.some((item) => item.event_id === current.eventId) ??
        false;
      if (already) {
        saved = true;
      } else {
        toggleFavourite.mutate(
          { eventId: current.eventId, next: true, item: current.item },
          {
            onSuccess: () => {
              setConfirmation({ title: current.title, saved: true });
            },
            onError: () => {
              setConfirmation({ title: current.title, saved: false });
            },
          },
        );
        return;
      }
    }
    setConfirmation({ title: current.title, saved });
  }, [isSignedIn, queryClient, session, toggleFavourite]);

  const value = useMemo(() => ({ openTickets }), [openTickets]);

  return (
    <TicketCheckoutContext.Provider value={value}>
      {children}
      <EventbriteCheckoutSheet
        visible={session != null}
        title={session?.title ?? 'Tickets'}
        eventId={session?.eventbriteId ?? ''}
        brandColor={colors.primary}
        onClose={() => setSession(null)}
        onComplete={onComplete}
      />
      <Modal
        visible={confirmation != null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmation(null)}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background,
                borderRadius: radius.xl,
                padding: spacing.xl,
              },
            ]}
          >
            <Text style={[typography.heading, { color: colors.text }]}>
              You're going!
            </Text>
            {confirmation?.title ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.text, marginTop: spacing.sm, fontWeight: '700' },
                ]}
              >
                {confirmation.title}
              </Text>
            ) : null}
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: spacing.md },
              ]}
            >
              Your tickets are in your Eventbrite account.
            </Text>
            {confirmation?.saved ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, marginTop: spacing.sm },
                ]}
              >
                Saved in the app.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={() => setConfirmation(null)}
              style={[
                styles.done,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.full,
                  marginTop: spacing.xl,
                },
              ]}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.onPrimary, fontWeight: '800' },
                ]}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </TicketCheckoutContext.Provider>
  );
}

export function useOpenTickets(): (input: OpenTicketsInput) => void {
  const context = useContext(TicketCheckoutContext);
  if (!context) {
    throw new Error('useOpenTickets must be used within TicketCheckoutProvider');
  }
  return context.openTickets;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  done: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

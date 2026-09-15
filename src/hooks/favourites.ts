import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addFavourite, fetchFavourites, removeFavourite } from '../api/favourites';
import { useAuth } from '../auth';
import type { EventListItem } from '../types/events';

export const favouriteKeys = {
  all: ['favourites'] as const,
  list: () => [...favouriteKeys.all, 'list'] as const,
};

export function useFavourites(enabled = true) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: favouriteKeys.list(),
    queryFn: ({ signal }) => fetchFavourites(signal),
    enabled: enabled && isSignedIn,
  });
}

export function useIsFavourited(eventId: string) {
  const query = useFavourites();
  return query.data?.items.some((item) => item.event_id === eventId) ?? false;
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async ({
      eventId,
      next,
      item,
    }: {
      eventId: string;
      next: boolean;
      item?: EventListItem;
    }) => {
      if (!isSignedIn) {
        throw new Error('Sign in to save favourites.');
      }
      if (next) await addFavourite(eventId);
      else await removeFavourite(eventId);
    },
    onMutate: async ({ eventId, next, item }) => {
      await queryClient.cancelQueries({ queryKey: favouriteKeys.list() });
      const previous = queryClient.getQueryData<{ items: EventListItem[] }>(
        favouriteKeys.list(),
      );
      queryClient.setQueryData(favouriteKeys.list(), (current: { items: EventListItem[] } | undefined) => {
        const items = current?.items ?? previous?.items ?? [];
        if (next) {
          if (items.some((entry) => entry.event_id === eventId)) {
            return { items };
          }
          return { items: item ? [item, ...items] : items };
        }
        return { items: items.filter((entry) => entry.event_id !== eventId) };
      });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favouriteKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favouriteKeys.list() });
    },
  });
}

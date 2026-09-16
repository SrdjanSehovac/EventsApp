import { Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ApiError } from '../api/client';
import { useAuth } from '../auth';
import { useIsFavourited, useToggleFavourite } from '../hooks/favourites';
import { useTheme } from '../theme';
import type { EventListItem } from '../types/events';

type FavouriteButtonProps = {
  item: EventListItem;
  variant?: 'default' | 'plain' | 'overlay';
};

function describeFavouriteError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sign in to save favourites.';
    if (error.status === 404) {
      return 'Favourites are not available on this EventServer yet (missing /v1/me/favourites).';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Could not update favourite.';
}

export function FavouriteButton({
  item,
  variant = 'default',
}: FavouriteButtonProps) {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const isFavourite = useIsFavourited(item.event_id);
  const toggle = useToggleFavourite();

  async function onPress() {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    try {
      await toggle.mutateAsync({
        eventId: item.event_id,
        next: !isFavourite,
        item,
      });
    } catch (error) {
      Alert.alert('Favourites', describeFavouriteError(error));
    }
  }

  const overlay = variant === 'overlay';
  const plain = variant === 'plain';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      onPress={onPress}
      disabled={toggle.isPending}
      hitSlop={plain ? 6 : 0}
      style={[
        styles.button,
        overlay ? shadows.soft : null,
        overlay
          ? { backgroundColor: colors.surface, borderWidth: 0 }
          : plain
            ? { borderWidth: 0, width: 36, height: 36 }
            : { borderColor: colors.border },
        { opacity: toggle.isPending ? 0.6 : 1 },
      ]}
    >
      <Ionicons
        name={isFavourite ? 'heart' : 'heart-outline'}
        size={overlay || plain ? 22 : 16}
        color={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
});

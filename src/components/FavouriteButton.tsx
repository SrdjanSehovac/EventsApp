import { Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ApiError } from '../api/client';
import { useRequireAccount } from '../auth';
import { friendlyPublicError } from '../utils/publicError';
import { useIsFavourited, useToggleFavourite } from '../hooks/favourites';
import { useTheme } from '../theme';
import type { EventListItem } from '../types/events';

type FavouriteButtonProps = {
  item: EventListItem;
  variant?: 'default' | 'plain' | 'overlay' | 'glass';
};

function describeFavouriteError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sign in to save favourites.';
  }
  return friendlyPublicError(error, "Couldn't update saved events. Please try again.");
}

export function FavouriteButton({
  item,
  variant = 'default',
}: FavouriteButtonProps) {
  const { colors, shadows } = useTheme();
  const requireAccount = useRequireAccount();
  const isFavourite = useIsFavourited(item.event_id);
  const toggle = useToggleFavourite();

  async function onPress() {
    if (!requireAccount('save', () => save(true))) return;
    await save(!isFavourite);
  }

  async function save(next: boolean) {
    try {
      await toggle.mutateAsync({
        eventId: item.event_id,
        next,
        item,
      });
    } catch (error) {
      Alert.alert('Favourites', describeFavouriteError(error));
    }
  }

  const overlay = variant === 'overlay';
  const plain = variant === 'plain';
  const glass = variant === 'glass';

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
        glass
          ? { backgroundColor: 'rgba(255,255,255,0.86)', borderWidth: 0, width: 38, height: 38, borderRadius: 19 }
          : overlay
          ? { backgroundColor: colors.surface, borderWidth: 0 }
          : plain
            ? { borderWidth: 0, width: 44, height: 44 }
            : { borderColor: colors.border },
        { opacity: toggle.isPending ? 0.6 : 1 },
      ]}
    >
      <Ionicons
        name={isFavourite ? 'heart' : 'heart-outline'}
        size={glass ? 20 : overlay || plain ? 22 : 16}
        color={glass ? (isFavourite ? '#E11D48' : '#1B1F1E') : colors.primary}
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

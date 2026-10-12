import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthScreen, EventCard } from '../src/components';
import { useAuth, useFavourites } from '../src/hooks';
import { useTheme } from '../src/theme';
import { friendlyPublicError } from '../src/utils/publicError';

function errorMessage(error: unknown) {
  return friendlyPublicError(error, "Couldn't load saved events. Please try again.");
}

export default function FavouritesScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { isSignedIn, status } = useAuth();
  const router = useRouter();
  const favouritesQuery = useFavourites(isSignedIn);

  if (status === 'loading') {
    return (
      <AuthScreen title="Favourites">
        <ActivityIndicator color={colors.primary} />
      </AuthScreen>
    );
  }

  if (!isSignedIn) {
    return (
      <AuthScreen
        title="Favourites"
        subtitle="Sign in to see events you have saved."
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          onPress={() => router.push('/sign-in')}
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={[typography.body, { color: colors.onPrimary, fontWeight: '700' }]}>
            Sign in
          </Text>
        </Pressable>
      </AuthScreen>
    );
  }

  const items = favouritesQuery.data?.items ?? [];

  return (
    <AuthScreen
      title="Favourites"
      subtitle="Events you have saved on this account."
      scroll={false}
    >
      {favouritesQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : favouritesQuery.error ? (
        <Text style={[typography.body, { color: colors.danger }]}>
          {errorMessage(favouritesQuery.error)}
        </Text>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.event_id}
          renderItem={({ item }) => <EventCard item={item} variant="listing" />}
          ListEmptyComponent={
            <Text style={[typography.body, { color: colors.textMuted }]}>
              No favourites yet. Open an event and tap the heart to save it.
            </Text>
          }
          contentContainerStyle={{ flexGrow: 0, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

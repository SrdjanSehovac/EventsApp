import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ApiError } from '../src/api/client';
import { AuthScreen, EventCard } from '../src/components';
import { useAuth, useFavourites } from '../src/hooks';
import { useTheme } from '../src/theme';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'Favourites are not available yet (EventServer needs GET /v1/me/favourites).';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Could not load favourites.';
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
          data={items}
          keyExtractor={(item) => item.event_id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.lg }}>
              <EventCard item={item} />
            </View>
          )}
          ListEmptyComponent={
            <Text style={[typography.body, { color: colors.textMuted }]}>
              No favourites yet. Open an event and tap the heart to save it.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

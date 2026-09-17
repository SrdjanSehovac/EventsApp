import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '../auth';
import { useTheme } from '../theme';

type AccountButtonProps = {
  size?: number;
};

export function AccountButton({ size = 40 }: AccountButtonProps) {
  const { colors, typography } = useTheme();
  const { user, isSignedIn } = useAuth();
  const router = useRouter();
  const initial = user?.display_name?.trim()?.[0]?.toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSignedIn ? 'Account' : 'Sign in'}
      onPress={() => router.push(isSignedIn ? '/account' : '/sign-in')}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {isSignedIn && initial ? (
        <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
          {initial}
        </Text>
      ) : (
        <Ionicons
          name={isSignedIn ? 'person' : 'person-outline'}
          size={18}
          color={colors.primary}
        />
      )}
    </Pressable>
  );
}

export function FavouritesButton({ size = 40 }: AccountButtonProps) {
  const { colors } = useTheme();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Favourites"
      onPress={() => router.push(isSignedIn ? '/favourites' : '/sign-in')}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <Ionicons
        name={isSignedIn ? 'heart' : 'heart-outline'}
        size={18}
        color={isSignedIn ? colors.danger : colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

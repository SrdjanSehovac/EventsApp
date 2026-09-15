import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { AuthField } from './AuthField';

type EventMediaFieldsProps = {
  photoUrls: string[];
  onChangePhotos: (urls: string[]) => void;
  videoUrl: string;
  onChangeVideo: (url: string) => void;
  bio: string;
  onChangeBio: (bio: string) => void;
};

export function EventMediaFields({
  photoUrls,
  onChangePhotos,
  videoUrl,
  onChangeVideo,
  bio,
  onChangeBio,
}: EventMediaFieldsProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [urlDraft, setUrlDraft] = useState('');
  const [pickerError, setPickerError] = useState<string | null>(null);

  function addUrl() {
    const next = urlDraft.trim();
    if (!next) return;
    if (!photoUrls.includes(next)) {
      onChangePhotos([...photoUrls, next]);
    }
    setUrlDraft('');
  }

  async function pickFromLibrary() {
    setPickerError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickerError('Photo library permission is needed to attach event images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });

    if (result.canceled) return;
    const uris = result.assets.map((asset) => asset.uri).filter(Boolean);
    const merged = [...photoUrls];
    for (const uri of uris) {
      if (!merged.includes(uri)) merged.push(uri);
    }
    onChangePhotos(merged);
  }

  return (
    <View>
      <AuthField
        label="SHORT BIO"
        value={bio}
        onChangeText={onChangeBio}
        placeholder="Who’s hosting, and why this night matters."
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Text
        style={[
          typography.caption,
          {
            color: colors.textMuted,
            fontWeight: '700',
            letterSpacing: 0.6,
            marginBottom: spacing.sm,
          },
        ]}
      >
        PHOTOS
      </Text>
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginBottom: spacing.sm },
        ]}
      >
        Paste image URLs or pick from your library. Event photos only — not an ID
        or selfie check.
      </Text>

      <View style={[styles.photoRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
        {photoUrls.map((uri) => (
          <View key={uri} style={styles.thumbWrap}>
            <Image source={{ uri }} style={[styles.thumb, { borderRadius: radius.sm }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={() => onChangePhotos(photoUrls.filter((item) => item !== uri))}
              style={[styles.remove, { backgroundColor: colors.danger }]}
            >
              <Ionicons name="close" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
      </View>

      <AuthField
        label="PHOTO URL"
        value={urlDraft}
        onChangeText={setUrlDraft}
        placeholder="https://…"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onSubmitEditing={addUrl}
        returnKeyType="done"
      />

      <View style={[styles.actions, { gap: spacing.sm, marginBottom: spacing.lg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add photo URL"
          onPress={addUrl}
          style={[
            styles.secondary,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
            Add URL
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose photos from library"
          onPress={() => void pickFromLibrary()}
          style={[
            styles.secondary,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
            },
          ]}
        >
          <Ionicons name="images-outline" size={16} color={colors.primary} />
          <Text
            style={[
              typography.caption,
              { color: colors.text, fontWeight: '700', marginLeft: 6 },
            ]}
          >
            Choose photos
          </Text>
        </Pressable>
      </View>

      {pickerError ? (
        <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>
          {pickerError}
        </Text>
      ) : null}

      <AuthField
        label="SHORT VIDEO URL (OPTIONAL)"
        value={videoUrl}
        onChangeText={onChangeVideo}
        placeholder="https://…"
        autoCapitalize="none"
        keyboardType="url"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  thumbWrap: {
    width: 72,
    height: 72,
  },
  thumb: {
    width: 72,
    height: 72,
    backgroundColor: '#EEE',
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  secondary: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

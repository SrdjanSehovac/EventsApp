import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ImageFallbackTile as Tile } from '../utils/imageFallback';

type ImageFallbackTileProps = {
  tile: Tile;
  /** Smaller type for the 96pt list and map thumbnails. */
  compact?: boolean;
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  nightlife: 'moon',
  music: 'musical-notes',
  comedy: 'mic',
  arts: 'color-palette',
  food_drink: 'restaurant',
  markets: 'basket',
  sales: 'pricetag',
  festivals: 'balloon',
  sports_fitness: 'fitness',
  family: 'people',
  workshops: 'hammer',
  community: 'people-circle',
};

/**
 * Emerald wash built from layered shapes. No native gradient module.
 * Deep teal, the app emerald, and a soft highlight.
 */
function EmeraldWash() {
  return (
    <>
      <View style={[styles.wash, { backgroundColor: '#0F766E' }]} />
      <View
        style={[
          styles.blob,
          {
            backgroundColor: '#115E59',
            width: '130%',
            height: '80%',
            top: '-18%',
            right: '-28%',
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            backgroundColor: '#042F2E',
            width: '100%',
            height: '70%',
            bottom: '-24%',
            left: '-18%',
            opacity: 0.45,
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            backgroundColor: '#5EEAD4',
            width: '55%',
            height: '46%',
            top: '8%',
            left: '-8%',
            opacity: 0.22,
          },
        ]}
      />
    </>
  );
}

export function ImageFallbackTile({ tile, compact = false }: ImageFallbackTileProps) {
  const label = tile.kind === 'campus' ? tile.name : tile.label;
  const icon =
    tile.kind === 'campus'
      ? 'school'
      : (CATEGORY_ICONS[tile.slug] ?? 'calendar');
  const iconSize = compact ? 22 : 36;

  return (
    <View
      style={styles.root}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <EmeraldWash />
      <View style={[styles.copy, compact ? styles.copyCompact : styles.copyHero]}>
        <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
        <Text
          numberOfLines={compact ? 3 : 2}
          style={[styles.label, compact ? styles.labelCompact : styles.labelHero]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFill,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  copy: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
    maxWidth: '100%',
  },
  copyCompact: {
    paddingHorizontal: 8,
    gap: 4,
  },
  copyHero: {
    gap: 10,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  labelHero: {
    fontSize: 20,
    lineHeight: 26,
  },
});

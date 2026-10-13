/**
 * Google Maps styles (Android). Apple Maps on iOS cannot be restyled, so it
 * only switches light/dark. Parks are desaturated and dimmed in both, so the
 * single emerald pin colour stands out.
 */
type Rule = {
  featureType?: string;
  elementType?: string;
  stylers: Record<string, string | number>[];
};

const LIGHT: Rule[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E4E8E3' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ saturation: -70 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFDDE6' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const DARK: Rule[] = [
  { elementType: 'geometry', stylers: [{ color: '#1A1F1D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9CA3A0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111514' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#202725' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2C3330' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3A423F' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E1A22' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export function mapStyleFor(scheme: 'light' | 'dark'): Rule[] {
  return scheme === 'dark' ? DARK : LIGHT;
}

/** Web tiles: one OSM basemap, restyled per theme with a CSS filter. */
export function webTileUrl(_scheme: 'light' | 'dark'): string {
  return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
}

/**
 * CSS filter for the web tile pane. Light: parks and greenery desaturated so
 * the emerald pins pop. Dark: inverted to a dark basemap, hue restored, muted.
 */
export function webTileFilter(scheme: 'light' | 'dark'): string {
  return scheme === 'dark'
    ? 'invert(1) hue-rotate(180deg) brightness(0.82) contrast(0.92) saturate(0.35)'
    : 'saturate(0.4) brightness(1.03)';
}

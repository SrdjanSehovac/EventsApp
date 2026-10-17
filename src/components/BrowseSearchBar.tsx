import {
  forwardRef,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useBrowse, usePlaceActions } from '../browse';
import { findProductCity } from '../config/cities';
import { useTheme } from '../theme';
import { eventDetailHref } from '../utils/eventDetail';
import { pinMatchesQuery } from '../utils/areaCount';
import { searchPlaces, topPlace, type PlaceMatch } from '../utils/placeSearch';

type BrowseSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPressFilters: () => void;
  filterCount?: number;
  placeholder?: string;
  /** Fired when the field gains or loses focus. */
  onActiveChange?: (active: boolean) => void;
  /** Fired when the suggestions panel shows or hides. */
  onPanelChange?: (open: boolean) => void;
};

export type BrowseSearchBarHandle = {
  /** Hide suggestions and dismiss the keyboard. */
  close: () => void;
  /**
   * True while the field is focused, and for a short time after it closes,
   * so the tap that dismisses the keyboard cannot also open a pin.
   */
  blocksMapTap: () => boolean;
};

const EVENT_LIMIT = 5;

export const BrowseSearchBar = forwardRef<BrowseSearchBarHandle, BrowseSearchBarProps>(
  function BrowseSearchBar(
    {
      value,
      onChangeText,
      onPressFilters,
      filterCount = 0,
      placeholder = 'Search cities, neighbourhoods, events…',
      onActiveChange,
      onPanelChange,
    },
    ref,
  ) {
    const { colors, typography, spacing, radius, shadows } = useTheme();
    const router = useRouter();
    const { filters, loadedPins } = useBrowse();
    const { goToPlace } = usePlaceActions();
    // Typing stays local: the map and list only change when a place or an
    // event search is committed, so keystrokes never refetch or hide pins.
    const [draft, setDraft] = useState(value);
    useEffect(() => {
      setDraft(value);
    }, [value]);
    const deferredDraft = useDeferredValue(draft);
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const stickRef = useRef(false);
    const blockMapUntil = useRef(0);
    /** The filter button sits where Cancel was; ignore it right after closing. */
    const blockFiltersUntil = useRef(0);
    const inputRef = useRef<TextInput>(null);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onActiveChangeRef = useRef(onActiveChange);
    onActiveChangeRef.current = onActiveChange;
    openRef.current = open;

    function close() {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      stickRef.current = false;
      blockMapUntil.current = Date.now() + 450;
      blockFiltersUntil.current = Date.now() + 400;
      inputRef.current?.blur();
      Keyboard.dismiss();
      if (!openRef.current) return;
      openRef.current = false;
      setOpen(false);
    }

    function blocksMapTap() {
      return openRef.current || Date.now() < blockMapUntil.current;
    }

    const apiRef = useRef({ close, blocksMapTap });
    apiRef.current.close = close;
    apiRef.current.blocksMapTap = blocksMapTap;
    useImperativeHandle(
      ref,
      () => ({
        close: () => apiRef.current.close(),
        blocksMapTap: () => apiRef.current.blocksMapTap(),
      }),
      [],
    );

    useEffect(() => {
      onActiveChangeRef.current?.(open);
    }, [open]);

    const places = useMemo(
      () =>
        searchPlaces(deferredDraft, {
          citySlug: findProductCity(filters.city)?.slug ?? null,
        }),
      [deferredDraft, filters.city],
    );
    const events = useMemo(() => {
      const query = deferredDraft.trim();
      if (!query) return [];
      return loadedPins.filter((pin) => pinMatchesQuery(pin, query)).slice(0, EVENT_LIMIT);
    }, [loadedPins, deferredDraft]);

    const showPanel = open && draft.trim().length > 0;
    const onPanelChangeRef = useRef(onPanelChange);
    onPanelChangeRef.current = onPanelChange;
    useEffect(() => {
      onPanelChangeRef.current?.(showPanel);
    }, [showPanel]);
    const hasPlaces = places.cities.length > 0 || places.neighbourhoods.length > 0;

    function choosePlace(place: PlaceMatch) {
      close();
      setDraft('');
      goToPlace(place);
    }

    function submit() {
      const text = draft.trim();
      if (!text) {
        close();
        return;
      }
      // Return on a place name goes to the best place match; anything
      // else becomes an event search in the current area.
      const place = topPlace(searchPlaces(text, {
        citySlug: findProductCity(filters.city)?.slug ?? null,
      }));
      if (place) {
        choosePlace(place);
        return;
      }
      close();
      onChangeText(text);
    }

    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <View
            style={[
              styles.search,
              shadows.soft,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={(next) => {
                stickRef.current = false;
                if (!openRef.current) {
                  openRef.current = true;
                  setOpen(true);
                }
                setDraft(next);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                blockMapUntil.current = Date.now() + 450;
                if (blurTimer.current) clearTimeout(blurTimer.current);
                blurTimer.current = setTimeout(() => {
                  if (stickRef.current) return;
                  openRef.current = false;
                  setOpen(false);
                }, 180);
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              blurOnSubmit
              onSubmitEditing={submit}
              style={[
                typography.body,
                styles.input,
                { color: colors.text, marginLeft: spacing.sm },
              ]}
            />
            {draft ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => {
                  setDraft('');
                  if (value) onChangeText('');
                }}
                hitSlop={8}
                style={styles.clear}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {open ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
              // On release, not press-in: closing on press-in swapped in the
              // filter button under the finger and the release opened Filters.
              onPress={() => close()}
              hitSlop={6}
              style={styles.cancel}
            >
              <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>
                Cancel
              </Text>
            </Pressable>
          ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            onPress={() => {
              if (Date.now() < blockFiltersUntil.current) return;
              close();
              onPressFilters();
            }}
            style={[
              styles.filter,
              shadows.soft,
              {
                backgroundColor: filterCount > 0 ? colors.primary : colors.surface,
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filterCount > 0 ? colors.onPrimary : colors.text}
            />
            {filterCount > 0 ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.onPrimary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 10,
                    fontWeight: '800',
                  }}
                >
                  {filterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          )}
        </View>

        {showPanel ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            style={[
              styles.panel,
              shadows.card,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
            onScrollBeginDrag={() => {
              stickRef.current = true;
              inputRef.current?.blur();
              Keyboard.dismiss();
            }}
          >
            <PlaceSection
              title="Cities"
              places={places.cities}
              icon="business-outline"
              onPress={choosePlace}
            />
            <PlaceSection
              title="Neighbourhoods"
              places={places.neighbourhoods}
              icon="location-outline"
              onPress={choosePlace}
            />
            {!hasPlaces ? (
              <Text
                style={[
                  typography.body,
                  styles.empty,
                  { color: colors.textMuted },
                ]}
              >
                No matching cities or neighbourhoods
              </Text>
            ) : null}
            {events.length > 0 ? (
              <View>
                <Text style={[styles.section, { color: colors.primary }]}>Events</Text>
                {events.map((pin) => {
                  const place = [pin.neighbourhood, pin.city].filter(Boolean).join(', ');
                  return (
                    <Pressable
                      key={pin.event_id}
                      accessibilityRole="button"
                      accessibilityLabel={place ? `${pin.title}, ${place}` : pin.title}
                      onPress={() => {
                        close();
                        router.push(eventDetailHref(pin.event_id));
                      }}
                      style={({ pressed }) => [
                        styles.rowItem,
                        pressed ? { backgroundColor: colors.primaryMuted } : null,
                      ]}
                    >
                      <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
                        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.copy}>
                        <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                          {pin.title}
                        </Text>
                        {place ? (
                          <Text style={[typography.caption, { color: colors.textSecondary }]}>
                            {place}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    );
  },
);

function PlaceSection({
  title,
  places,
  icon,
  onPress,
}: {
  title: string;
  places: PlaceMatch[];
  icon: 'business-outline' | 'location-outline';
  onPress: (place: PlaceMatch) => void;
}) {
  const { colors, typography } = useTheme();
  if (places.length === 0) return null;
  return (
    <View>
      <Text style={[styles.section, { color: colors.primary }]}>{title}</Text>
      {places.map((place) => (
        <Pressable
          key={place.key}
          accessibilityRole="button"
          accessibilityLabel={`${place.title}, ${place.subtitle}`}
          onPress={() => onPress(place)}
          style={({ pressed }) => [
            styles.rowItem,
            pressed ? { backgroundColor: colors.primaryMuted } : null,
          ]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
              {place.title}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {place.subtitle}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filter: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  panel: {
    marginTop: 8,
    maxHeight: 280,
    borderWidth: 1,
  },
  section: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  rowItem: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});

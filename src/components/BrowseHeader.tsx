import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { BrowseSearchBar, type BrowseSearchBarHandle } from './BrowseSearchBar';

type BrowseHeaderProps = {
  value: string;
  onChangeText: (value: string) => void;
  onPressFilters: () => void;
  filterCount?: number;
  title?: string;
  placeholder?: string;
  onActiveChange?: (active: boolean) => void;
};

export const BrowseHeader = forwardRef<BrowseSearchBarHandle, BrowseHeaderProps>(
  function BrowseHeader(
    {
      value,
      onChangeText,
      onPressFilters,
      filterCount = 0,
      title = 'Nearby events',
      placeholder = 'Search cities, neighbourhoods, events…',
      onActiveChange,
    },
    ref,
  ) {
    const { colors, typography, spacing } = useTheme();
    const searchRef = useRef<BrowseSearchBarHandle>(null);
    const [active, setActive] = useState(false);
    // The header floats over the list so the suggestions panel overlays the
    // rows instead of pushing them down. This spacer keeps the list below the
    // closed header, so the list never jumps while suggestions open.
    const [baseHeight, setBaseHeight] = useState(0);
    const panelOpen = useRef(false);
    const focusedRef = useRef(false);
    useImperativeHandle(
      ref,
      () => ({
        close: () => searchRef.current?.close(),
        blocksMapTap: () => searchRef.current?.blocksMapTap() ?? false,
      }),
      [],
    );

    return (
      <>
      <View style={{ height: baseHeight }} />
      <SafeAreaView
        edges={['top']}
        pointerEvents="box-none"
        onLayout={(event) => {
          if ((panelOpen.current || focusedRef.current) && baseHeight > 0) return;
          const next = Math.round(event.nativeEvent.layout.height);
          if (next !== baseHeight) setBaseHeight(next);
        }}
        style={[styles.header, { backgroundColor: colors.background }]}
      >
        <View style={[styles.wrap, { paddingHorizontal: spacing.lg }]}>
          <Text
            onPress={active ? () => searchRef.current?.close() : undefined}
            suppressHighlighting
            style={[typography.heading, { color: colors.text, fontSize: 22 }]}
          >
            {title}
          </Text>
          <BrowseSearchBar
            ref={searchRef}
            value={value}
            onChangeText={onChangeText}
            onPressFilters={onPressFilters}
            onPanelChange={(next) => {
              panelOpen.current = next;
            }}
            onActiveChange={(next) => {
              // Set before the panel can render, so its height is never
              // mistaken for the closed header.
              focusedRef.current = next;
              setActive(next);
              onActiveChange?.(next);
            }}
            filterCount={filterCount}
            placeholder={placeholder}
          />
        </View>
      </SafeAreaView>
      </>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
  },
  wrap: {
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
});

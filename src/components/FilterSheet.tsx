import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBrowse } from '../browse';
import { useCategories, useCities, useNeighbourhoods } from '../hooks';
import { useResponsive } from '../layout';
import { useTheme } from '../theme';
import {
  EMPTY_FILTERS,
  EventFilters,
} from './EventFilters';

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { filters, setFilters } = useBrowse();
  const [draft, setDraft] = useState(filters);

  const categoriesQuery = useCategories();
  const citiesQuery = useCities();
  const neighbourhoodsQuery = useNeighbourhoods(
    { city: draft.city ?? undefined },
    visible,
  );

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
              onPress={() => setDraft({ ...EMPTY_FILTERS, q: draft.q })}
              hitSlop={8}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, fontWeight: '700' },
                ]}
              >
                Reset
              </Text>
            </Pressable>
            <Text style={[typography.heading, { color: colors.text, fontSize: 18 }]}>
              Filters
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel filters"
              onPress={onClose}
              hitSlop={8}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, fontWeight: '700' },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xxxl,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <EventFilters
              value={draft}
              onChange={setDraft}
              categories={categoriesQuery.data?.items ?? []}
              cities={citiesQuery.data ?? []}
              neighbourhoods={neighbourhoodsQuery.data ?? []}
              showSearch={false}
              showClear={false}
            />
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={() => {
                setFilters({ ...draft, q: filters.q });
                onClose();
              }}
              style={[
                styles.apply,
                shadows.soft,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.onPrimary, fontWeight: '800' },
                ]}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 16,
  },
  apply: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

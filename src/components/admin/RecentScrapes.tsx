import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import type { EventListItem } from '../../types/events';

type RecentScrapesProps = {
  items: EventListItem[];
  title?: string;
};

function formatRelativeTime(value?: string | null): string {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function RecentScrapes({
  items,
  title = 'Recently scraped',
}: RecentScrapesProps) {
  const { colors, typography, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        shadows.soft,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <Text style={[typography.heading, { color: colors.text, fontSize: 17 }]}>
        {title}
      </Text>

      {items.length === 0 ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textMuted, marginTop: spacing.md },
          ]}
        >
          No recent scrapes
        </Text>
      ) : (
        <View style={{ marginTop: spacing.sm }}>
          {items.map((item, index) => {
            const meta = [item.source, item.city].filter(Boolean).join(' · ');
            const isLast = index === items.length - 1;
            return (
              <View
                key={item.event_id}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <View style={styles.rowMain}>
                  <Text
                    numberOfLines={1}
                    style={[typography.body, { color: colors.text, fontSize: 15 }]}
                  >
                    {item.title}
                  </Text>
                  {meta ? (
                    <Text
                      numberOfLines={1}
                      style={[
                        typography.caption,
                        { color: colors.textMuted, marginTop: 2 },
                      ]}
                    >
                      {meta}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: colors.textSecondary,
                      marginLeft: spacing.sm,
                      flexShrink: 0,
                    },
                  ]}
                >
                  {formatRelativeTime(item.scraped_at)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
});

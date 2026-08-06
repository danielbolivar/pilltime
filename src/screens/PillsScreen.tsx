import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { BigButton } from '@/src/components/BigButton';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { describeDays, describeDuration, formatClockTime } from '@/src/domain/schedule';
import { usePillStore } from '@/src/store/pillStore';

export function PillsScreen() {
  const router = useRouter();
  const pills = usePillStore((s) => s.pills);

  return (
    <AppSafeArea>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="My pills" subtitle="Tap a pill to change it." />

        <BigButton label="Add pill" onPress={() => router.push('/pill/new')} />

        {pills.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No pills yet</Text>
            <Text style={styles.emptyBody}>Add a pill to start getting reminders.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pills.map((pill) => (
              <Pressable
                key={pill.id}
                style={styles.row}
                onPress={() => router.push(`/pill/${pill.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${pill.name}`}
              >
                <Text style={styles.name}>{pill.name}</Text>
                <Text style={styles.meta}>
                  {pill.times.map((t) => formatClockTime(t)).join(' · ')}
                </Text>
                <Text style={styles.meta}>
                  {describeDays(pill.daysOfWeek)} · {describeDuration(pill.duration)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </AppSafeArea>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 88,
    justifyContent: 'center',
  },
  name: {
    ...theme.typography.headline,
    color: theme.colors.ink,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.inkSoft,
  },
  empty: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.headline,
    color: theme.colors.ink,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
}));

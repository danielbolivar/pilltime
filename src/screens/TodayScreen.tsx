import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { DoseCard, doseTimeKey } from '@/src/components/DoseCard';
import { BigButton } from '@/src/components/BigButton';
import { AppSafeArea } from '@/src/components/AppSafeArea';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { getNextPendingDose } from '@/src/domain/schedule';
import { usePillStore, useTodayDoses } from '@/src/store/pillStore';

export function TodayScreen() {
  const router = useRouter();
  const pills = usePillStore((s) => s.pills);
  const setDoseStatus = usePillStore((s) => s.setDoseStatus);
  const clearDoseStatus = usePillStore((s) => s.clearDoseStatus);
  const [tick, setTick] = useState(0);
  const doses = useTodayDoses();
  const next = getNextPendingDose(doses);
  const pendingCount = doses.filter((d) => d.status === 'pending').length;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  void tick;

  const subtitle =
    pills.length === 0
      ? 'Add a pill and we’ll remind you.'
      : pendingCount === 0
        ? 'You’re all done for now.'
        : next
          ? `Next up: ${next.pillName} at ${next.timeLabel}`
          : 'Here’s what to take today.';

  return (
    <AppSafeArea>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => setTick((t) => t + 1)} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="PillTime"
          brand
          subtitle={subtitle}
          right={
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.gear}
            >
              <Text style={styles.gearText}>Settings</Text>
            </Pressable>
          }
        />

        {pills.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Add your first pill</Text>
            <Text style={styles.emptyBody}>
              Tell PillTime the name, the time, and which days. We’ll take it from there.
            </Text>
            <BigButton label="Add pill" onPress={() => router.push('/pill/new')} />
          </View>
        ) : doses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing due today</Text>
            <Text style={styles.emptyBody}>
              No pills are scheduled for today. You can change days in My pills.
            </Text>
            <BigButton label="My pills" onPress={() => router.push('/(tabs)/pills')} variant="secondary" />
          </View>
        ) : (
          <View style={styles.list}>
            {doses.map((dose, index) => (
              <DoseCard
                key={dose.key}
                dose={dose}
                index={index}
                onTaken={() =>
                  setDoseStatus(dose.pillId, dose.date, doseTimeKey(dose), 'taken')
                }
                onSkip={() =>
                  setDoseStatus(dose.pillId, dose.date, doseTimeKey(dose), 'skipped')
                }
                onUndo={() => clearDoseStatus(dose.pillId, dose.date, doseTimeKey(dose))}
              />
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
  },
  gear: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  gearText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
  empty: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.ink,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
    marginBottom: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
  },
}));

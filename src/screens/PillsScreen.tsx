import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { BigButton } from '@/src/components/BigButton';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import {
  describeDays,
  describeDuration,
  describeReminderOffsets,
  formatClockTime,
} from '@/src/domain/schedule';
import { useT } from '@/src/i18n/useT';
import { usePillStore } from '@/src/store/pillStore';

export function PillsScreen() {
  const t = useT();
  const router = useRouter();
  const pills = usePillStore((s) => s.pills);

  return (
    <AppSafeArea>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t('pills.title')} subtitle={t('pills.subtitle')} />

        <BigButton label={t('pills.addPill')} onPress={() => router.push('/pill/new')} />

        {pills.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('pills.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('pills.emptyBody')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pills.map((pill) => (
              <Pressable
                key={pill.id}
                style={styles.row}
                onPress={() => router.push(`/pill/${pill.id}`)}
                accessibilityRole="button"
                accessibilityLabel={t('pills.editA11y', { name: pill.name })}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.name}>{pill.name}</Text>
                  <Text style={styles.editHint}>{t('common.edit')}</Text>
                </View>
                <Text style={styles.meta}>
                  {pill.times.map((time) => formatClockTime(time)).join(' · ')}
                </Text>
                <Text style={styles.meta}>
                  {describeDays(pill.daysOfWeek)} · {describeDuration(pill.duration)}
                </Text>
                <Text style={styles.meta}>
                  {describeReminderOffsets(pill.reminderOffsetsMinutes)}
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
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  name: {
    ...theme.typography.headline,
    color: theme.colors.ink,
    flex: 1,
  },
  editHint: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
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

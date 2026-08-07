import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
  buildMonthGrid,
  formatMonthTitle,
  getDayDoseSummary,
  type DayDoseSummary,
} from '@/src/domain/schedule';
import type { DoseLogEntry, Pill } from '@/src/domain/types';
import { useT } from '@/src/i18n/useT';

type Props = {
  year: number;
  month: number;
  selectedDate: string;
  todayDate: string;
  pills: Pill[];
  doseLog: Record<string, DoseLogEntry>;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function dayTone(
  summary: DayDoseSummary,
  theme: { colors: { success: string; danger: string; inkFaint: string; primary: string } },
): string | null {
  if (summary.scheduled === 0) return null;
  if (summary.pending > 0) return theme.colors.danger;
  if (summary.taken === summary.scheduled) return theme.colors.success;
  return theme.colors.inkFaint;
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  todayDate,
  pills,
  doseLog,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const t = useT();
  const { theme } = useUnistyles();
  const cells = buildMonthGrid(year, month);
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((d) => t(`days.short.${d}`));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={onPrevMonth}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.prevMonth')}
          style={styles.navBtn}
        >
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthTitle(year, month)}</Text>
        <Pressable
          onPress={onNextMonth}
          accessibilityRole="button"
          accessibilityLabel={t('calendar.nextMonth')}
          style={styles.navBtn}
        >
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekdays.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((dateStr, index) => {
          if (!dateStr) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const dayNum = Number(dateStr.slice(-2));
          const summary = getDayDoseSummary(pills, doseLog, dateStr);
          const tone = dayTone(summary, theme);
          const selected = dateStr === selectedDate;
          const isToday = dateStr === todayDate;

          return (
            <Pressable
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.cell,
                styles.dayCell,
                selected && styles.daySelected,
                isToday && !selected && styles.dayToday,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  selected && styles.dayNumSelected,
                  dateStr > todayDate && styles.dayFuture,
                ]}
              >
                {dayNum}
              </Text>
              {tone ? <View style={[styles.dot, { backgroundColor: tone }]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  monthTitle: {
    ...theme.typography.headline,
    color: theme.colors.ink,
    flex: 1,
    textAlign: 'center',
  },
  navBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 32,
    lineHeight: 36,
    color: theme.colors.primary,
    fontFamily: 'Nunito_700Bold',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.caption,
    color: theme.colors.inkFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCell: {
    borderRadius: theme.radii.sm,
  },
  daySelected: {
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  dayNum: {
    ...theme.typography.bodyBold,
    color: theme.colors.ink,
    fontSize: 18,
  },
  dayNumSelected: {
    color: theme.colors.primary,
  },
  dayFuture: {
    color: theme.colors.inkFaint,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
}));

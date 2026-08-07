import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { DoseCard, doseTimeKey } from '@/src/components/DoseCard';
import { MonthCalendar } from '@/src/components/MonthCalendar';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import {
  canEditDosesForDate,
  getDosesForDate,
  monthKeyFromDate,
  parseLocalDate,
  toLocalDateString,
} from '@/src/domain/schedule';
import { useT } from '@/src/i18n/useT';
import { usePillStore } from '@/src/store/pillStore';

export function CalendarScreen() {
  const t = useT();
  const pills = usePillStore((s) => s.pills);
  const doseLog = usePillStore((s) => s.doseLog);
  const setDoseStatus = usePillStore((s) => s.setDoseStatus);
  const clearDoseStatus = usePillStore((s) => s.clearDoseStatus);

  const todayDate = toLocalDateString();
  const initial = monthKeyFromDate(todayDate);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState(todayDate);

  const doses = useMemo(
    () => getDosesForDate(pills, doseLog, selectedDate),
    [pills, doseLog, selectedDate],
  );
  const editable = canEditDosesForDate(selectedDate);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const selectedLabel = parseLocalDate(selectedDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <AppSafeArea>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t('calendar.title')} subtitle={t('calendar.subtitle')} />

        <MonthCalendar
          year={year}
          month={month}
          selectedDate={selectedDate}
          todayDate={todayDate}
          pills={pills}
          doseLog={doseLog}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
        />

        <View style={styles.dayBlock}>
          <Text style={styles.dayTitle}>{selectedLabel}</Text>
          {!editable ? <Text style={styles.note}>{t('calendar.futureNote')}</Text> : null}

          {doses.length === 0 ? (
            <Text style={styles.empty}>{t('calendar.emptyDay')}</Text>
          ) : (
            <View style={styles.list}>
              {doses.map((dose, index) =>
                editable ? (
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
                ) : (
                  <View key={dose.key} style={styles.readOnly}>
                    <Text style={styles.readTime}>{dose.timeLabel}</Text>
                    <Text style={styles.readName}>{dose.pillName}</Text>
                  </View>
                ),
              )}
            </View>
          )}
        </View>
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
  dayBlock: {
    gap: theme.spacing.md,
  },
  dayTitle: {
    ...theme.typography.headline,
    color: theme.colors.ink,
    textTransform: 'capitalize',
  },
  note: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  list: {
    gap: theme.spacing.md,
  },
  readOnly: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  readTime: {
    ...theme.typography.caption,
    color: theme.colors.inkSoft,
  },
  readName: {
    ...theme.typography.headline,
    color: theme.colors.ink,
  },
}));

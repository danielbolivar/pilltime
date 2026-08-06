import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BigButton } from '@/src/components/BigButton';
import { ReminderOffsetsEditor } from '@/src/components/ReminderOffsetsEditor';
import {
  ALL_DAYS,
  clockToKey,
  formatClockTime,
  getDayLabels,
  toLocalDateString,
} from '@/src/domain/schedule';
import type { ClockTime, PillDuration, PillInput, Weekday } from '@/src/domain/types';
import { useT } from '@/src/i18n/useT';

type Props = {
  initial?: PillInput;
  submitLabel: string;
  onSubmit: (input: PillInput) => Promise<void>;
  onDelete?: () => void;
};

type DurationMode = 'keep' | 'until' | 'days';

function timeToDate(time: ClockTime): Date {
  const d = new Date();
  d.setHours(time.hour, time.minute, 0, 0);
  return d;
}

function dateToClock(date: Date): ClockTime {
  return { hour: date.getHours(), minute: date.getMinutes() };
}

export function PillForm({ initial, submitLabel, onSubmit, onDelete }: Props) {
  const t = useT();
  const dayLabels = getDayLabels();
  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [times, setTimes] = useState<ClockTime[]>(
    initial?.times?.length ? initial.times : [{ hour: 9, minute: 0 }],
  );
  const [days, setDays] = useState<Weekday[]>(
    initial?.daysOfWeek?.length ? initial.daysOfWeek : [...ALL_DAYS],
  );
  const [durationMode, setDurationMode] = useState<DurationMode>(
    initial?.duration.type ?? 'keep',
  );
  const [untilDate, setUntilDate] = useState(
    initial?.duration.type === 'until'
      ? initial.duration.endDate
      : toLocalDateString(new Date(Date.now() + 7 * 86400000)),
  );
  const [dayCount, setDayCount] = useState(
    initial?.duration.type === 'days' ? String(initial.duration.days) : '7',
  );
  const [offsets, setOffsets] = useState<number[]>(
    initial?.reminderOffsetsMinutes?.length
      ? [...initial.reminderOffsetsMinutes].sort((a, b) => a - b)
      : [-5, 0],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickingTimeIndex, setPickingTimeIndex] = useState<number | null>(null);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  const everyDay = days.length === 7;

  const duration: PillDuration = useMemo(() => {
    if (durationMode === 'until') return { type: 'until', endDate: untilDate };
    if (durationMode === 'days') {
      const daysNum = Math.max(1, parseInt(dayCount || '1', 10) || 1);
      return {
        type: 'days',
        days: daysNum,
        startDate: toLocalDateString(),
      };
    }
    return { type: 'keep' };
  }, [durationMode, untilDate, dayCount]);

  const toggleDay = (day: Weekday) => {
    setDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day) as Weekday[];
      }
      return [...prev, day].sort((a, b) => a - b) as Weekday[];
    });
  };

  const setEveryDay = () => setDays([...ALL_DAYS]);

  const onTimeChange = (index: number, event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setPickingTimeIndex(null);
    }
    if (event.type === 'dismissed' || !date) return;
    setTimes((prev) => prev.map((time, i) => (i === index ? dateToClock(date) : time)));
  };

  const onUntilChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowUntilPicker(false);
    }
    if (event.type === 'dismissed' || !date) return;
    setUntilDate(toLocalDateString(date));
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('form.errorName'));
      return;
    }
    if (times.length === 0) {
      setError(t('form.errorTime'));
      return;
    }
    if (days.length === 0) {
      setError(t('form.errorDays'));
      return;
    }
    if (offsets.length === 0) {
      setError(t('form.errorReminders'));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: trimmed,
        notes: notes.trim() || undefined,
        times,
        daysOfWeek: days,
        duration,
        reminderOffsetsMinutes: [...offsets].sort((a, b) => a - b),
      });
    } catch {
      setError(t('form.errorGeneric'));
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!onDelete) return;
    const label = name.trim() || '…';
    Alert.alert(t('form.deleteTitle', { name: label }), t('form.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('form.delete'), style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.label}>{t('form.nameLabel')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('form.namePlaceholder')}
          placeholderTextColor="#5C534C"
          style={styles.input}
          autoCapitalize="words"
          accessibilityLabel={t('form.nameLabel')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('form.notesLabel')}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t('form.notesPlaceholder')}
          placeholderTextColor="#5C534C"
          style={styles.input}
          accessibilityLabel={t('form.notesLabel')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('form.timeLabel')}</Text>
        {times.map((time, index) => (
          <View key={`${clockToKey(time)}-${index}`} style={styles.timeRow}>
            <Pressable
              style={styles.timeChip}
              onPress={() => setPickingTimeIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={formatClockTime(time)}
            >
              <Text style={styles.timeChipText}>{formatClockTime(time)}</Text>
            </Pressable>
            {times.length > 1 ? (
              <Pressable
                onPress={() => setTimes((prev) => prev.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel={t('form.removeTime')}
                style={styles.removeTime}
              >
                <Text style={styles.removeTimeText}>{t('common.remove')}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {pickingTimeIndex !== null ? (
          <DateTimePicker
            value={timeToDate(times[pickingTimeIndex])}
            mode="time"
            onChange={(e, d) => onTimeChange(pickingTimeIndex, e, d)}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        ) : null}
        {Platform.OS === 'ios' && pickingTimeIndex !== null ? (
          <BigButton
            label={t('form.doneWithTime')}
            onPress={() => setPickingTimeIndex(null)}
            variant="secondary"
          />
        ) : null}
        <BigButton
          label={t('form.addAnotherTime')}
          variant="ghost"
          onPress={() => setTimes((prev) => [...prev, { hour: 21, minute: 0 }])}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('form.daysLabel')}</Text>
        <Pressable
          onPress={setEveryDay}
          style={[styles.choice, everyDay && styles.choiceOn]}
          accessibilityRole="button"
        >
          <Text style={[styles.choiceText, everyDay && styles.choiceTextOn]}>
            {t('form.everyDay')}
          </Text>
        </Pressable>
        <View style={styles.dayGrid}>
          {dayLabels.map(({ day, short }) => {
            const on = days.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={[styles.dayChip, on && styles.dayChipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>{short}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('form.howLongLabel')}</Text>
        {(
          [
            { mode: 'keep' as const, titleKey: 'form.keepReminding' },
            { mode: 'until' as const, titleKey: 'form.untilDate' },
            { mode: 'days' as const, titleKey: 'form.forDays' },
          ] as const
        ).map((opt) => (
          <Pressable
            key={opt.mode}
            onPress={() => setDurationMode(opt.mode)}
            style={[styles.choice, durationMode === opt.mode && styles.choiceOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: durationMode === opt.mode }}
          >
            <Text
              style={[
                styles.choiceText,
                durationMode === opt.mode && styles.choiceTextOn,
              ]}
            >
              {t(opt.titleKey)}
            </Text>
          </Pressable>
        ))}

        {durationMode === 'until' ? (
          <View style={styles.subBlock}>
            <Pressable style={styles.timeChip} onPress={() => setShowUntilPicker(true)}>
              <Text style={styles.timeChipText}>
                {new Date(untilDate + 'T12:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </Pressable>
            {showUntilPicker ? (
              <DateTimePicker
                value={new Date(untilDate + 'T12:00:00')}
                mode="date"
                minimumDate={new Date()}
                onChange={onUntilChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
            ) : null}
            {Platform.OS === 'ios' && showUntilPicker ? (
              <BigButton
                label={t('form.doneWithDate')}
                onPress={() => setShowUntilPicker(false)}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}

        {durationMode === 'days' ? (
          <View style={styles.subBlock}>
            <Text style={styles.helper}>{t('form.howManyDays')}</Text>
            <TextInput
              value={dayCount}
              onChangeText={(value) => setDayCount(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel={t('form.howManyDays')}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('form.remindersLabel')}</Text>
        <Text style={styles.helper}>{t('form.remindersHelper')}</Text>
        <ReminderOffsetsEditor value={offsets} onChange={setOffsets} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BigButton
        label={saving ? t('common.saving') : submitLabel}
        onPress={handleSave}
        disabled={saving}
      />

      {onDelete ? (
        <View style={styles.deleteWrap}>
          <BigButton label={t('form.deletePill')} variant="danger" onPress={confirmDelete} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.headline,
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
  },
  helper: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  input: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeChip: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  timeChipText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
  removeTime: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  removeTimeText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger,
  },
  choice: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  choiceOn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  choiceText: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  choiceTextOn: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dayChip: {
    minWidth: 52,
    minHeight: 48,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  dayChipOn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  dayChipText: {
    ...theme.typography.caption,
    fontFamily: 'Nunito_700Bold',
    color: theme.colors.inkSoft,
  },
  dayChipTextOn: {
    color: theme.colors.onPrimary,
  },
  subBlock: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  error: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger,
  },
  deleteWrap: {
    marginTop: theme.spacing.md,
  },
}));

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
import { ALL_DAYS, DAY_LABELS, clockToKey, formatClockTime, toLocalDateString } from '@/src/domain/schedule';
import type { ClockTime, PillDuration, PillInput, Weekday } from '@/src/domain/types';

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
  const [remindOnTime, setRemindOnTime] = useState(
    (initial?.reminderOffsetsMinutes ?? [-5, 0]).includes(0),
  );
  const [remindEarly, setRemindEarly] = useState(
    (initial?.reminderOffsetsMinutes ?? [-5, 0]).includes(-5),
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
    setTimes((prev) => prev.map((t, i) => (i === index ? dateToClock(date) : t)));
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
      setError('Give this pill a name');
      return;
    }
    if (times.length === 0) {
      setError('Pick a time');
      return;
    }
    if (days.length === 0) {
      setError('Choose at least one day');
      return;
    }
    const offsets: number[] = [];
    if (remindEarly) offsets.push(-5);
    if (remindOnTime) offsets.push(0);
    if (offsets.length === 0) {
      setError('Turn on at least one reminder');
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
        reminderOffsetsMinutes: offsets,
      });
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!onDelete) return;
    Alert.alert(`Delete ${name.trim() || 'this pill'}?`, 'Reminders for this pill will stop.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.label}>What’s the pill called?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Vitamin D"
          placeholderTextColor="#7A8F86"
          style={styles.input}
          autoCapitalize="words"
          accessibilityLabel="Pill name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any notes? (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. 1 pill with food"
          placeholderTextColor="#7A8F86"
          style={styles.input}
          accessibilityLabel="Notes"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>What time?</Text>
        {times.map((time, index) => (
          <View key={`${clockToKey(time)}-${index}`} style={styles.timeRow}>
            <Pressable
              style={styles.timeChip}
              onPress={() => setPickingTimeIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`Time ${formatClockTime(time)}`}
            >
              <Text style={styles.timeChipText}>{formatClockTime(time)}</Text>
            </Pressable>
            {times.length > 1 ? (
              <Pressable
                onPress={() => setTimes((prev) => prev.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel="Remove time"
                style={styles.removeTime}
              >
                <Text style={styles.removeTimeText}>Remove</Text>
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
          <BigButton label="Done with time" onPress={() => setPickingTimeIndex(null)} variant="secondary" />
        ) : null}
        <BigButton
          label="Add another time"
          variant="ghost"
          onPress={() =>
            setTimes((prev) => [...prev, { hour: 21, minute: 0 }])
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Which days?</Text>
        <Pressable
          onPress={setEveryDay}
          style={[styles.choice, everyDay && styles.choiceOn]}
          accessibilityRole="button"
        >
          <Text style={[styles.choiceText, everyDay && styles.choiceTextOn]}>Every day</Text>
        </Pressable>
        <View style={styles.dayGrid}>
          {DAY_LABELS.map(({ day, short }) => {
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
        <Text style={styles.label}>How long?</Text>
        {(
          [
            { mode: 'keep' as const, title: 'Keep reminding me' },
            { mode: 'until' as const, title: 'Until a date' },
            { mode: 'days' as const, title: 'For a number of days' },
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
              {opt.title}
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
                label="Done with date"
                onPress={() => setShowUntilPicker(false)}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}

        {durationMode === 'days' ? (
          <View style={styles.subBlock}>
            <Text style={styles.helper}>How many days?</Text>
            <TextInput
              value={dayCount}
              onChangeText={(t) => setDayCount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel="Number of days"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Reminders</Text>
        <Pressable
          onPress={() => setRemindOnTime((v) => !v)}
          style={[styles.choice, remindOnTime && styles.choiceOn]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remindOnTime }}
        >
          <Text style={[styles.choiceText, remindOnTime && styles.choiceTextOn]}>
            Remind me on time
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setRemindEarly((v) => !v)}
          style={[styles.choice, remindEarly && styles.choiceOn]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remindEarly }}
        >
          <Text style={[styles.choiceText, remindEarly && styles.choiceTextOn]}>
            Remind me 5 minutes early
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BigButton
        label={saving ? 'Saving…' : submitLabel}
        onPress={handleSave}
        disabled={saving}
      />

      {onDelete ? (
        <View style={styles.deleteWrap}>
          <BigButton label="Delete pill" variant="danger" onPress={confirmDelete} />
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
    color: '#FFFFFF',
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

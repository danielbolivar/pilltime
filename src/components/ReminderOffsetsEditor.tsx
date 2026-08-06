import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  REMINDER_PRESETS_MINUTES,
  describeReminderOffset,
} from '@/src/domain/schedule';
import { useT } from '@/src/i18n/useT';

type Props = {
  value: number[];
  onChange: (next: number[]) => void;
};

function sortOffsets(offsets: number[]): number[] {
  return [...new Set(offsets)].sort((a, b) => a - b);
}

export function ReminderOffsetsEditor({ value, onChange }: Props) {
  const t = useT();
  const [customMinutes, setCustomMinutes] = useState('');

  const addOffset = (offset: number) => {
    onChange(sortOffsets([...value, offset]));
  };

  const removeOffset = (offset: number) => {
    onChange(value.filter((v) => v !== offset));
  };

  const addCustomBefore = () => {
    const mins = parseInt(customMinutes, 10);
    if (!Number.isFinite(mins) || mins <= 0) return;
    addOffset(-mins);
    setCustomMinutes('');
  };

  const availablePresets = REMINDER_PRESETS_MINUTES.filter((p) => !value.includes(p));

  return (
    <View style={styles.wrap}>
      {value.length === 0 ? (
        <Text style={styles.empty}>{t('reminders.empty')}</Text>
      ) : (
        value.map((offset) => {
          const label = describeReminderOffset(offset);
          return (
            <View key={offset} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Pressable
                onPress={() => removeOffset(offset)}
                accessibilityRole="button"
                accessibilityLabel={t('reminders.removeA11y', { label })}
                style={styles.remove}
              >
                <Text style={styles.removeText}>{t('common.remove')}</Text>
              </Pressable>
            </View>
          );
        })
      )}

      {availablePresets.length > 0 ? (
        <View style={styles.presets}>
          <Text style={styles.helper}>{t('reminders.quickAdd')}</Text>
          <View style={styles.chipRow}>
            {availablePresets.map((preset) => {
              const label = describeReminderOffset(preset);
              return (
                <Pressable
                  key={preset}
                  onPress={() => addOffset(preset)}
                  style={styles.chip}
                  accessibilityRole="button"
                  accessibilityLabel={t('reminders.addA11y', { label })}
                >
                  <Text style={styles.chipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.customBlock}>
        <Text style={styles.helper}>{t('reminders.orMinutesBefore')}</Text>
        <View style={styles.customRow}>
          <TextInput
            value={customMinutes}
            onChangeText={(text) => setCustomMinutes(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder={t('reminders.minutesPlaceholder')}
            placeholderTextColor="#5C534C"
            style={styles.input}
            accessibilityLabel={t('reminders.minutesA11y')}
          />
          <Pressable
            onPress={addCustomBefore}
            style={[styles.addBtn, !customMinutes && styles.addBtnDisabled]}
            disabled={!customMinutes}
            accessibilityRole="button"
            accessibilityLabel={t('reminders.addCustomA11y')}
          >
            <Text style={styles.addBtnText}>{t('common.add')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    gap: theme.spacing.sm,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  row: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  rowLabel: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    flex: 1,
  },
  remove: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  removeText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger,
  },
  presets: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  helper: {
    ...theme.typography.caption,
    color: theme.colors.inkSoft,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 44,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  chipText: {
    ...theme.typography.caption,
    fontFamily: 'Nunito_700Bold',
    color: theme.colors.ink,
  },
  customBlock: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  customRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  addBtn: {
    minHeight: 56,
    minWidth: 88,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  addBtnText: {
    ...theme.typography.button,
    color: theme.colors.onPrimary,
  },
}));

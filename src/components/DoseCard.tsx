import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { BigButton } from '@/src/components/BigButton';
import { clockToKey } from '@/src/domain/schedule';
import type { TodayDose } from '@/src/domain/types';
import { useT } from '@/src/i18n/useT';

type Props = {
  dose: TodayDose;
  index: number;
  onTaken: () => void;
  onSkip: () => void;
  onUndo: () => void;
};

export function DoseCard({ dose, index, onTaken, onSkip, onUndo }: Props) {
  const t = useT();
  const router = useRouter();
  const done = dose.status !== 'pending';
  const overdue = dose.isOverdue && !done;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
      style={[
        styles.card,
        overdue && styles.overdue,
        dose.status === 'taken' && styles.taken,
        dose.status === 'skipped' && styles.skipped,
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.time, overdue && styles.overdueText]}>{dose.timeLabel}</Text>
        {overdue ? <Text style={styles.badge}>{t('dose.overdue')}</Text> : null}
        {dose.status === 'taken' ? <Text style={styles.badgeDone}>{t('dose.taken')}</Text> : null}
        {dose.status === 'skipped' ? (
          <Text style={styles.badgeSkip}>{t('dose.skipped')}</Text>
        ) : null}
      </View>
      <Text style={[styles.name, overdue && styles.overdueText]}>{dose.pillName}</Text>
      {dose.notes ? (
        <Text style={[styles.notes, overdue && styles.overdueNotes]}>{dose.notes}</Text>
      ) : null}

      {done ? (
        <Pressable onPress={onUndo} accessibilityRole="button" style={styles.undo}>
          <Text style={styles.undoText}>{t('common.undo')}</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <View style={styles.actionFlex}>
            <BigButton label={t('dose.take')} onPress={onTaken} />
          </View>
          <View style={styles.actionFlex}>
            <BigButton label={t('dose.skip')} onPress={onSkip} variant="secondary" />
          </View>
        </View>
      )}

      <Pressable
        onPress={() => router.push(`/pill/${dose.pillId}`)}
        accessibilityRole="button"
        accessibilityLabel={t('dose.edit')}
        style={styles.edit}
      >
        <Text style={styles.editText}>{t('dose.edit')}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function doseTimeKey(dose: TodayDose): string {
  return clockToKey(dose.time);
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  overdue: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft,
  },
  taken: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successSoft,
  },
  skipped: {
    opacity: 0.75,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  time: {
    ...theme.typography.headline,
    color: theme.colors.ink,
  },
  overdueText: {
    color: theme.colors.ink,
  },
  badge: {
    ...theme.typography.caption,
    color: theme.colors.accentInk,
    fontFamily: 'Nunito_700Bold',
  },
  badgeDone: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontFamily: 'Nunito_700Bold',
  },
  badgeSkip: {
    ...theme.typography.caption,
    color: theme.colors.inkFaint,
    fontFamily: 'Nunito_700Bold',
  },
  name: {
    ...theme.typography.title,
    fontSize: 26,
    lineHeight: 32,
    color: theme.colors.ink,
  },
  notes: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  overdueNotes: {
    color: theme.colors.inkSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionFlex: {
    flex: 1,
  },
  undo: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  undoText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
  edit: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  editText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
}));

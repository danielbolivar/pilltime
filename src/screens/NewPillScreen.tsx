import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { PillForm } from '@/src/components/PillForm';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { PillInput } from '@/src/domain/types';
import { useT } from '@/src/i18n/useT';
import { usePillStore } from '@/src/store/pillStore';

export function NewPillScreen() {
  const t = useT();
  const router = useRouter();
  const addPill = usePillStore((s) => s.addPill);

  const onSubmit = async (input: PillInput) => {
    await addPill(input);
    router.replace('/(tabs)');
  };

  return (
    <AppSafeArea>
      <View style={styles.headerPad}>
        <ScreenHeader
          title={t('newPill.title')}
          subtitle={t('newPill.subtitle')}
          right={
            <Pressable onPress={() => router.back()} style={styles.cancel}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
          }
        />
      </View>
      <PillForm
        submitLabel={t('newPill.save')}
        onSubmit={onSubmit}
        initial={{
          name: '',
          times: [{ hour: 9, minute: 0 }],
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          duration: { type: 'keep' },
          reminderOffsetsMinutes: [-5, 0],
        }}
      />
    </AppSafeArea>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerPad: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  cancel: {
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    ...theme.typography.bodyBold,
    color: theme.colors.inkSoft,
  },
}));

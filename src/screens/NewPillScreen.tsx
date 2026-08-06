import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { PillForm } from '@/src/components/PillForm';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { PillInput } from '@/src/domain/types';
import { usePillStore } from '@/src/store/pillStore';

export function NewPillScreen() {
  const router = useRouter();
  const addPill = usePillStore((s) => s.addPill);
  const settings = usePillStore((s) => s.settings);

  const onSubmit = async (input: PillInput) => {
    await addPill(input);
    router.replace('/(tabs)');
  };

  return (
    <AppSafeArea>
      <View style={styles.headerPad}>
        <ScreenHeader
          title="Add pill"
          subtitle="A few easy questions."
          right={
            <Pressable onPress={() => router.back()} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          }
        />
      </View>
      <PillForm
        submitLabel="Save pill"
        onSubmit={onSubmit}
        initial={{
          name: '',
          times: [{ hour: 9, minute: 0 }],
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          duration: { type: 'keep' },
          reminderOffsetsMinutes: settings.defaultReminderOffsetsMinutes,
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

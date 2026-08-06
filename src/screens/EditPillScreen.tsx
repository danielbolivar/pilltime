import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { PillForm } from '@/src/components/PillForm';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { PillInput } from '@/src/domain/types';
import { usePillStore } from '@/src/store/pillStore';

export function EditPillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pill = usePillStore((s) => s.pills.find((p) => p.id === id));
  const updatePill = usePillStore((s) => s.updatePill);
  const deletePill = usePillStore((s) => s.deletePill);

  if (!pill) {
    return (
      <AppSafeArea>
        <View style={styles.headerPad}>
          <ScreenHeader title="Pill not found" subtitle="It may have been deleted." />
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancelText}>Go back</Text>
          </Pressable>
        </View>
      </AppSafeArea>
    );
  }

  const onSubmit = async (input: PillInput) => {
    await updatePill(pill.id, input);
    router.replace('/(tabs)/pills');
  };

  const onDelete = async () => {
    await deletePill(pill.id);
    router.replace('/(tabs)/pills');
  };

  return (
    <AppSafeArea>
      <View style={styles.headerPad}>
        <ScreenHeader
          title="Edit pill"
          subtitle={pill.name}
          right={
            <Pressable onPress={() => router.back()} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          }
        />
      </View>
      <PillForm
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onDelete={onDelete}
        initial={{
          name: pill.name,
          notes: pill.notes,
          times: pill.times,
          daysOfWeek: pill.daysOfWeek,
          duration: pill.duration,
          reminderOffsetsMinutes: pill.reminderOffsetsMinutes,
        }}
      />
    </AppSafeArea>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerPad: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
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

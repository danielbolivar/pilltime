import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { BigButton } from '@/src/components/BigButton';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import {
  getNotificationPermissionGranted,
  requestNotificationPermissions,
} from '@/src/notifications';
import { usePillStore } from '@/src/store/pillStore';

export function SettingsScreen() {
  const router = useRouter();
  const settings = usePillStore((s) => s.settings);
  const updateSettings = usePillStore((s) => s.updateSettings);
  const resyncAllNotifications = usePillStore((s) => s.resyncAllNotifications);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPermissionGranted().then(setGranted);
  }, []);

  const allowReminders = async () => {
    setBusy(true);
    setMessage(null);
    const result = await requestNotificationPermissions();
    setGranted(result.granted);
    updateSettings({ notificationsEnabled: result.granted });
    if (result.granted) {
      await resyncAllNotifications();
      setMessage('Reminders are on. We’ll ping you for your pills.');
    } else if (!result.canAskAgain) {
      setMessage('Reminders are blocked. Open system settings to allow them.');
    } else {
      setMessage('Reminders were not allowed. You can try again anytime.');
    }
    setBusy(false);
  };

  return (
    <AppSafeArea>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Settings"
          subtitle="Allow reminders so PillTime can ping you."
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardBody}>
            {granted
              ? 'Reminders are allowed on this phone.'
              : granted === false
                ? 'Reminders are not allowed yet.'
                : 'Checking…'}
          </Text>
          <BigButton
            label={busy ? 'Please wait…' : 'Allow reminders'}
            onPress={allowReminders}
            disabled={busy || granted === true}
          />
          {granted === false ? (
            <BigButton
              label="Open phone settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Default reminders</Text>
          <Text style={styles.cardBody}>
            New pills remind you on time and 5 minutes early. You can change this when you add a
            pill.
          </Text>
          <Text style={styles.defaults}>
            {settings.defaultReminderOffsetsMinutes.includes(-5) ? '✓ 5 minutes early' : ''}
            {'\n'}
            {settings.defaultReminderOffsetsMinutes.includes(0) ? '✓ On time' : ''}
          </Text>
        </View>

        <BigButton label="Back to Today" variant="secondary" onPress={() => router.back()} />
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
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    ...theme.typography.headline,
    color: theme.colors.ink,
  },
  cardBody: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
  defaults: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
}));

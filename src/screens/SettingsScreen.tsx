import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppSafeArea } from '@/src/components/AppSafeArea';
import { BigButton } from '@/src/components/BigButton';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { AppSettings } from '@/src/domain/types';
import { applyLanguage } from '@/src/i18n';
import { useT } from '@/src/i18n/useT';
import {
  getNotificationPermissionGranted,
  requestNotificationPermissions,
} from '@/src/notifications';
import { usePillStore } from '@/src/store/pillStore';
import { applyAppearance, type AppearanceMode } from '@/src/theme/unistyles';

type ChoiceProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ChoiceRow({ label, selected, onPress }: ChoiceProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const t = useT();
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
      setMessage(t('settings.onMessage'));
    } else if (!result.canAskAgain) {
      setMessage(t('settings.blockedMessage'));
    } else {
      setMessage(t('settings.deniedMessage'));
    }
    setBusy(false);
  };

  const setAppearance = (appearance: AppearanceMode) => {
    updateSettings({ appearance });
    applyAppearance(appearance);
  };

  const setLanguage = (language: AppSettings['language']) => {
    applyLanguage(language);
    updateSettings({ language });
  };

  return (
    <AppSafeArea>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
          right={
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('common.goBack')}
              style={styles.back}
            >
              <Text style={styles.backText}>{t('common.goBack')}</Text>
            </Pressable>
          }
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.appearanceTitle')}</Text>
          <Text style={styles.cardBody}>{t('settings.appearanceBody')}</Text>
          <ChoiceRow
            label={t('settings.appearanceDay')}
            selected={settings.appearance === 'day'}
            onPress={() => setAppearance('day')}
          />
          <ChoiceRow
            label={t('settings.appearanceNight')}
            selected={settings.appearance === 'night'}
            onPress={() => setAppearance('night')}
          />
          <ChoiceRow
            label={t('settings.appearanceHighContrast')}
            selected={settings.appearance === 'highContrast'}
            onPress={() => setAppearance('highContrast')}
          />
          <ChoiceRow
            label={t('settings.appearanceSystem')}
            selected={settings.appearance === 'system'}
            onPress={() => setAppearance('system')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.languageTitle')}</Text>
          <Text style={styles.cardBody}>{t('settings.languageBody')}</Text>
          <ChoiceRow
            label={t('settings.languageSystem')}
            selected={settings.language === 'system'}
            onPress={() => setLanguage('system')}
          />
          <ChoiceRow
            label={t('settings.languageEnglish')}
            selected={settings.language === 'en'}
            onPress={() => setLanguage('en')}
          />
          <ChoiceRow
            label={t('settings.languageSpanish')}
            selected={settings.language === 'es'}
            onPress={() => setLanguage('es')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.notifications')}</Text>
          <Text style={styles.cardBody}>
            {granted
              ? t('settings.allowed')
              : granted === false
                ? t('settings.notAllowed')
                : t('settings.checking')}
          </Text>
          <BigButton
            label={busy ? t('settings.pleaseWait') : t('settings.allow')}
            onPress={allowReminders}
            disabled={busy || granted === true}
          />
          {granted === false ? (
            <BigButton
              label={t('settings.openPhoneSettings')}
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>

        <BigButton
          label={t('settings.backToToday')}
          variant="secondary"
          onPress={() => router.back()}
        />
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
    borderWidth: 2,
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
  choice: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
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
  message: {
    ...theme.typography.body,
    color: theme.colors.ink,
  },
  back: {
    minHeight: 56,
    minWidth: 88,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  backText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
}));

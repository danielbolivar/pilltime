import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Appearance, AppState, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import 'react-native-reanimated';

import { applyLanguage } from '@/src/i18n';
import { addNotificationResponseListener } from '@/src/notifications';
import { usePillStore } from '@/src/store/pillStore';
import { applyAppearance } from '@/src/theme/unistyles';
import { syncHomeWidgets } from '@/src/widgets/update';

SplashScreen.preventAutoHideAsync();

export function RootLayoutNav() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const hydrated = usePillStore((s) => s.hydrated);
  const appearance = usePillStore((s) => s.settings.appearance);
  const language = usePillStore((s) => s.settings.language);
  const resyncAllNotifications = usePillStore((s) => s.resyncAllNotifications);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    const finish = () => usePillStore.getState().setHydrated(true);
    if (usePillStore.persist.hasHydrated()) {
      finish();
    }
    const unsub = usePillStore.persist.onFinishHydration(finish);
    return unsub;
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    applyLanguage(language);
    applyAppearance(appearance);
  }, [hydrated, language, appearance]);

  useEffect(() => {
    if (!hydrated || appearance !== 'system') return;
    const sub = Appearance.addChangeListener(() => {
      applyAppearance('system');
    });
    return () => sub.remove();
  }, [hydrated, appearance]);

  useEffect(() => {
    const sub = addNotificationResponseListener(() => {
      router.push('/(tabs)');
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    // One rebuild on launch clears leaked alarms; avoid doing this on every resume.
    void resyncAllNotifications();
    void syncHomeWidgets();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const current = usePillStore.getState().settings;
        applyLanguage(current.language);
        applyAppearance(current.appearance);
        void syncHomeWidgets();
      }
    });
    return () => sub.remove();
  }, [hydrated, resyncAllNotifications]);

  if (!fontsLoaded || !hydrated) {
    return <View style={[styles.boot, { backgroundColor: theme.colors.bg }]} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Native stack caches contentStyle — bind via useUnistyles so it updates.
        contentStyle: { backgroundColor: theme.colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pill/new" options={{ presentation: 'card' }} />
      <Stack.Screen name="pill/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
  },
});

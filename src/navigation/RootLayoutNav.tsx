import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import 'react-native-reanimated';

import { addNotificationResponseListener } from '@/src/notifications';
import { usePillStore } from '@/src/store/pillStore';

SplashScreen.preventAutoHideAsync();

export function RootLayoutNav() {
  const router = useRouter();
  const hydrated = usePillStore((s) => s.hydrated);
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
    const sub = addNotificationResponseListener(() => {
      router.push('/(tabs)');
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    resyncAllNotifications();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        resyncAllNotifications();
      }
    });
    return () => sub.remove();
  }, [hydrated, resyncAllNotifications]);

  if (!fontsLoaded || !hydrated) {
    return <View style={styles.boot} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.stack,
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

const styles = StyleSheet.create((theme) => ({
  boot: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  stack: {
    backgroundColor: theme.colors.bg,
  },
}));

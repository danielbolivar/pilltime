import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

type Props = {
  children: ReactNode;
};

/**
 * SafeAreaView is a third-party component — Unistyles ShadowTree won't update
 * its style on theme change, so we bind backgroundColor via useUnistyles.
 */
export function AppSafeArea({ children }: Props) {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  title: string;
  subtitle?: string;
  brand?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, brand = false, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <Text style={brand ? styles.brand : styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  textCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  brand: {
    ...theme.typography.brand,
    color: theme.colors.primary,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.ink,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.inkSoft,
  },
}));

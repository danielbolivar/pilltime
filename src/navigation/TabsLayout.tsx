import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useT } from '@/src/i18n/useT';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  color,
  size,
}: {
  name: IconName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function TabsLayout() {
  const t = useT();
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.bgElevated,
            borderTopColor: theme.colors.border,
          },
        ],
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.inkFaint,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? 'today' : 'today-outline'}
              color={String(color)}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? 'calendar' : 'calendar-outline'}
              color={String(color)}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pills"
        options={{
          title: t('tabs.myPills'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? 'medkit' : 'medkit-outline'}
              color={String(color)}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
});

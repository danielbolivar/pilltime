import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>;
}

export function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1F7A66',
        tabBarInactiveTintColor: '#7A8F86',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pills"
        options={{
          title: 'My pills',
          tabBarLabel: ({ focused }) => <TabLabel label="My pills" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create((theme) => ({
  tabBar: {
    backgroundColor: theme.colors.bgElevated,
    borderTopColor: theme.colors.border,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: theme.colors.inkFaint,
  },
  labelFocused: {
    color: theme.colors.primary,
  },
}));

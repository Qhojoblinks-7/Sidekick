import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useContext(ThemeContext);

  return (
    <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.profit,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            }}
          >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="expenses"
            options={{
              title: 'Expenses',
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'History',
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
              ),
            }}
          />
        </Tabs>
  );
}
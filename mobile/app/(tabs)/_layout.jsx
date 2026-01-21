import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: Colors.profit,
              tabBarInactiveTintColor: Colors.textMuted,
              tabBarStyle: {
                backgroundColor: Colors.black,
                borderTopColor: Colors.border,
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
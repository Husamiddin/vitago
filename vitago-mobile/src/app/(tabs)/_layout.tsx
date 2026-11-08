import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Home, Dumbbell, HeartPulse, Sparkles, User } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Asosiy',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="sport"
        options={{
          title: 'Sport',
          tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Sog'liq",
          tabBarIcon: ({ color, size }) => <HeartPulse size={size} color={color} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Tariflar',
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2.4} />,
        }}
      />
    </Tabs>
  );
}

/**
 * Tab Layout for Expo App
 * Bottom navigation with 7 tabs (Blueprint is inside Path screen)
 */

import { Tabs } from 'expo-router'
import {
  Home,
  ListOrdered,
  BookOpen,
  MessageCircle,
  Trophy,
  ScrollText,
  Target,
} from '@tamagui/lucide-icons'
import { useTheme } from '@my/ui'

export default function TabLayout() {
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.green10?.val,
        tabBarInactiveTintColor: theme.gray10?.val,
        tabBarStyle: {
          display: 'none', // Hide default tabs - using FloatingNavPill instead
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <ListOrdered size={24} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'The Log',
          tabBarIcon: ({ color }) => <ScrollText size={24} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Trophy size={24} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="path"
        options={{
          title: 'The Path',
          tabBarIcon: ({ color }) => <Target size={24} color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Guide',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color as any} />,
        }}
      />
      {/* Blueprint is hidden from bottom tabs - accessed via Path screen tabs */}
      <Tabs.Screen
        name="blueprint"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  )
}

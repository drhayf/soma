/**
 * Progress Screen for Expo App
 * Displays Achievement Gallery and Progress Dashboard with tabs
 */

import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, Button, Text } from '@my/ui'
import { AchievementGallery, ProgressDashboard } from 'app'

export default function ProgressScreen() {
  const insets = useSafeAreaInsets()
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8
  const [activeTab, setActiveTab] = useState<'dashboard' | 'achievements'>('dashboard')

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={topPadding}>
      {/* Tab Switcher */}
      <XStack
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        padding="$2"
        gap="$2"
      >
        <Button
          flex={1}
          size="$4"
          backgroundColor={(activeTab === 'dashboard' ? '#52a868' : '#a1a1aa') as any}
          color={(activeTab === 'dashboard' ? 'white' : '#71717a') as any}
          onPress={() => setActiveTab('dashboard')}
          pressStyle={{ scale: 0.98 }}
        >
          <Text color={(activeTab === 'dashboard' ? 'white' : '#71717a') as any} fontWeight="600">
            Dashboard
          </Text>
        </Button>
        <Button
          flex={1}
          size="$4"
          backgroundColor={(activeTab === 'achievements' ? '#52a868' : '#a1a1aa') as any}
          color={(activeTab === 'achievements' ? 'white' : '#71717a') as any}
          onPress={() => setActiveTab('achievements')}
          pressStyle={{ scale: 0.98 }}
        >
          <Text
            color={(activeTab === 'achievements' ? 'white' : '#71717a') as any}
            fontWeight="600"
          >
            Achievements
          </Text>
        </Button>
      </XStack>

      {/* Content */}
      {activeTab === 'dashboard' && <ProgressDashboard />}
      {activeTab === 'achievements' && <AchievementGallery />}
    </YStack>
  )
}

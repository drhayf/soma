/**
 * Progress Page for Next.js App
 * Displays Achievement Gallery and Progress Dashboard with tabs
 */

'use client'

import { useState } from 'react'
import { YStack, XStack, Button, Text } from '@my/ui'
import { AchievementGallery, ProgressDashboard } from 'app'

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'achievements'>('dashboard')

  return (
    <YStack flex={1} backgroundColor="$background" pt={80}>
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

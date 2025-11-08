/**
 * Local Profile - View Zustand local state and settings
 * Shows all locally persisted data (offline-first mode)
 */

import { useState } from 'react'
import { YStack, XStack, Button, Paragraph, H2, H3, Card, ScrollView, Separator } from '@my/ui'
import { User, Database, Trash2, Download, Shield } from '@tamagui/lucide-icons'
import { useProgressStore } from '../../lib/store'
import { useChatStore } from '../../lib/store'
import { useJournalStore } from '../../lib/store'
import { useAuthStore } from '../../lib/auth-store'
import { semanticColors, iconColors } from '../../lib/theme-colors'

export function LocalProfileScreen() {
  const [showDangerZone, setShowDangerZone] = useState(false)

  // Auth state - individual selectors
  const user = useAuthStore((s) => s.user)
  const hasLocalAuth = useAuthStore((s) => s.hasLocalAuth)
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled)
  const clearLocalAuth = useAuthStore((s) => s.clearLocalAuth)

  // Progress state - individual selectors to avoid object creation on every render
  const complianceStreak = useProgressStore((s) => s.complianceStreak)
  const lastCompletedDate = useProgressStore((s) => s.lastCompletedDate)
  const totalCompletions = useProgressStore((s) => s.totalCompletions)
  const resetStreak = useProgressStore((s) => s.resetStreak)

  // Chat state - get length directly
  const chatSessionsLength = useChatStore((s) => s.chatSessions.length)
  const clearAllChatSessions = useChatStore((s) => s.clearAllSessions)

  // Journal state - get length directly
  const journalEntriesLength = useJournalStore((s) => s.journalEntries.length)

  const handleExportData = () => {
    const exportData = {
      complianceStreak,
      lastCompletedDate,
      totalCompletions,
      chatSessionsCount: chatSessionsLength,
      journalEntriesCount: journalEntriesLength,
      hasLocalAuth,
      biometricEnabled,
      exportedAt: new Date().toISOString(),
    }

    console.log('[Local Profile] Export data:', exportData)

    // In production, this would download JSON file
    if (typeof window !== 'undefined') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `somatic-alignment-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" paddingBottom="$8">
        {/* Header */}
        <YStack gap="$2">
          <H2>Local Profile</H2>
          <Paragraph color="gray" fontSize="$3">
            Your local Zustand state (works offline)
          </Paragraph>
        </YStack>

        {/* User Info */}
        <Card padding="$4" gap="$3">
          <XStack gap="$3" alignItems="center">
            <User size={24} color={iconColors.primary} />
            <H3>Account Info</H3>
          </XStack>

          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Paragraph color="gray">Email</Paragraph>
              <Paragraph fontWeight="600">{user?.email || 'Not signed in'}</Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Local PIN</Paragraph>
              <Paragraph fontWeight="600">{hasLocalAuth ? '✓ Configured' : '✗ Not set'}</Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Biometric Auth</Paragraph>
              <Paragraph fontWeight="600">
                {biometricEnabled ? '✓ Enabled' : '✗ Disabled'}
              </Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Progress Stats */}
        <Card padding="$4" gap="$3">
          <XStack gap="$3" alignItems="center">
            <Database size={24} color={iconColors.success} />
            <H3>Local Progress</H3>
          </XStack>

          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Paragraph color="gray">Compliance Streak</Paragraph>
              <Paragraph fontSize="$6" fontWeight="700" color={semanticColors.success.text}>
                {complianceStreak} days
              </Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Total Completions</Paragraph>
              <Paragraph fontWeight="600">{totalCompletions}</Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Last Completed</Paragraph>
              <Paragraph fontWeight="600">{lastCompletedDate || 'Never'}</Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Local Data Stats */}
        <Card padding="$4" gap="$3">
          <XStack gap="$3" alignItems="center">
            <Database size={24} color="purple" />
            <H3>Stored Data</H3>
          </XStack>

          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Paragraph color="gray">Chat Sessions</Paragraph>
              <Paragraph fontWeight="600">{chatSessionsLength}</Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Journal Entries</Paragraph>
              <Paragraph fontWeight="600">{journalEntriesLength}</Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Storage Mode</Paragraph>
              <Paragraph fontWeight="600">Local (Zustand)</Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Actions */}
        <Card padding="$4" gap="$3">
          <H3>Data Management</H3>

          <Button size="$4" theme="blue" icon={<Download />} onPress={handleExportData}>
            Export Local Data (JSON)
          </Button>

          <Button size="$4" variant="outlined" onPress={() => setShowDangerZone(!showDangerZone)}>
            {showDangerZone ? 'Hide' : 'Show'} Danger Zone
          </Button>
        </Card>

        {/* Danger Zone */}
        {showDangerZone && (
          <Card
            padding="$4"
            gap="$3"
            backgroundColor={semanticColors.error.background}
            borderColor={semanticColors.error.border}
          >
            <XStack gap="$3" alignItems="center">
              <Shield size={24} color={iconColors.error} />
              <H3 color={semanticColors.error.textContrast}>Danger Zone</H3>
            </XStack>

            <Paragraph fontSize="$2" color={semanticColors.error.text}>
              These actions are permanent and cannot be undone!
            </Paragraph>

            <YStack gap="$2">
              <Button
                size="$4"
                theme="red"
                icon={<Trash2 />}
                onPress={() => {
                  if (confirm('Clear all local auth (PIN/biometric)?')) {
                    clearLocalAuth()
                  }
                }}
              >
                Clear Local Auth
              </Button>

              <Button
                size="$4"
                theme="red"
                variant="outlined"
                icon={<Trash2 />}
                onPress={() => {
                  if (confirm('Delete all chat sessions?')) {
                    clearAllChatSessions()
                  }
                }}
              >
                Clear All Chat History
              </Button>

              <Button
                size="$4"
                theme="red"
                variant="outlined"
                icon={<Trash2 />}
                onPress={() => {
                  if (confirm('Reset your compliance streak?')) {
                    resetStreak()
                  }
                }}
              >
                Reset Compliance Streak
              </Button>
            </YStack>
          </Card>
        )}

        {/* Info Card */}
        <Card
          padding="$4"
          gap="$2"
          backgroundColor={semanticColors.info.background}
          borderColor={semanticColors.info.border}
        >
          <Paragraph fontSize="$3" fontWeight="600" color={semanticColors.info.textContrast}>
            💡 About Local Storage
          </Paragraph>
          <Paragraph fontSize="$2" color={semanticColors.info.text}>
            All data shown here is stored locally on your device using Zustand persist. It works
            completely offline and never leaves your device unless you sync to Supabase.
          </Paragraph>
        </Card>
      </YStack>
    </ScrollView>
  )
}

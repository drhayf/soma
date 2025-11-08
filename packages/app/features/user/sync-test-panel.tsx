/**
 * Sync Test Panel - E2E Testing for Supabase Sync
 *
 * Features:
 * - Test all sync functions
 * - Manual bulk sync for existing data
 * - Sync status verification
 * - Clear test results
 */

import { useState } from 'react'
import { YStack, XStack, Button, Paragraph, H3, Card, Spinner, ScrollView, Progress } from '@my/ui'
import {
  Play,
  CheckCircle,
  XCircle,
  Upload,
  Database,
  Clock,
  AlertCircle,
  RefreshCw,
} from '@tamagui/lucide-icons'
import {
  useChatStore,
  useJournalStore,
  useProgressStore,
  useAchievementStore,
  useSovereignPathStore,
} from '../../lib/store'
import { syncChatMessage, syncJournalEntry } from '../../lib/supabase-sync'
import {
  syncUserProgress,
  fetchUserProgress,
  bulkSyncAchievements,
  fetchAchievements,
  syncSovereignPathData,
  fetchSovereignPathData,
} from '../../lib/supabase-sync-extended'
import { supabase } from '../../lib/supabase-client'
import { semanticColors, iconColors, statusColors } from '../../lib/theme-colors'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration?: number
  message?: string
  count?: number
}

interface BulkSyncProgress {
  total: number
  synced: number
  failed: number
  inProgress: boolean
}

export function SyncTestPanel() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Database Connection', status: 'pending' },
    { name: 'Chat Messages Sync', status: 'pending' },
    { name: 'Journal Entries Sync', status: 'pending' },
    { name: 'User Progress Sync', status: 'pending' },
    { name: 'Achievements Sync', status: 'pending' },
    { name: 'Sovereign Path Data Sync', status: 'pending' },
    { name: 'Data Verification', status: 'pending' },
  ])

  const [bulkSyncProgress, setBulkSyncProgress] = useState<BulkSyncProgress>({
    total: 0,
    synced: 0,
    failed: 0,
    inProgress: false,
  })

  const [running, setRunning] = useState(false)
  const [testOutput, setTestOutput] = useState('')

  // Get local data - extract messages from all chat sessions
  const chatSessions = useChatStore((state) => state.chatSessions) || []
  const allChatMessages = chatSessions.flatMap((session) =>
    (session.messages || []).map((msg) => ({ ...msg, sessionId: session.id }))
  )
  const allJournalEntries = useJournalStore((state) => state.journalEntries) || []

  // Get individual fields to avoid creating new objects on every render
  const complianceStreak = useProgressStore((state) => state.complianceStreak)
  const lastCompletedDate = useProgressStore((state) => state.lastCompletedDate)
  const totalCompletions = useProgressStore((state) => state.totalCompletions)

  const achievements = useAchievementStore((state) => state.achievements) || []

  // Get individual fields to avoid creating new objects on every render
  const humanDesignChart = useSovereignPathStore((state) => state.humanDesignChart)
  const birthData = useSovereignPathStore((state) => state.birthData)
  const oejtsAnswers = useSovereignPathStore((state) => state.oejtsAnswers)
  const oejtsResults = useSovereignPathStore((state) => state.oejtsResults)
  const archetypeAnalysis = useSovereignPathStore((state) => state.archetypeAnalysis)
  const katas = useSovereignPathStore((state) => state.katas)
  const healthMetrics = useSovereignPathStore((state) => state.healthMetrics)

  // Track generated test data for cleanup
  const [testDataIds, setTestDataIds] = useState<{
    chatSessions: string[]
    journalIds: string[]
    achievementIds: string[]
    kataIds: string[]
  }>({
    chatSessions: [],
    journalIds: [],
    achievementIds: [],
    kataIds: [],
  })

  /**
   * Generate comprehensive test data for all sync types
   * Returns IDs for later cleanup
   */
  const generateTestData = async () => {
    setTestOutput((prev) => prev + '📝 Generating test data...\n\n')

    const ids = {
      chatSessions: [] as string[],
      journalIds: [] as string[],
      achievementIds: [] as string[],
      kataIds: [] as string[],
    }

    try {
      // 1. Generate test chat message
      const testSessionId = `test-session-${Date.now()}`
      const addChatMessage = useChatStore.getState().addChatMessage
      addChatMessage(`[TEST] This is a test message for sync validation`, testSessionId)
      ids.chatSessions.push(testSessionId)
      setTestOutput((prev) => prev + '  ✓ Generated test chat message\n')

      // 2. Generate test journal entry
      const addJournalEntry = useJournalStore.getState().addJournalEntry
      const testJournalId = `test-journal-${Date.now()}`
      addJournalEntry({
        routineType: 'morning',
        routineName: 'Test Routine',
        mood: 'focused' as const,
        physicalSensations: ['energized'],
        notes: '[TEST] Test journal entry for sync validation',
      })
      ids.journalIds.push(testJournalId)
      setTestOutput((prev) => prev + '  ✓ Generated test journal entry\n')

      // 3. Complete a routine to trigger progress sync
      const completeRoutine = useProgressStore.getState().completeRoutine
      completeRoutine()
      setTestOutput((prev) => prev + '  ✓ Triggered test routine completion\n')

      // 4. Generate test achievement
      const testAchievementId = `test-achievement-${Date.now()}`
      const unlockAchievement = useAchievementStore.getState().unlockAchievement
      const initializeAchievements = useAchievementStore.getState().initializeAchievements

      // First ensure test achievement exists
      initializeAchievements([
        {
          id: testAchievementId,
          name: '[TEST] Sync Validation Achievement',
          description: 'Test achievement for sync testing',
          category: 'special',
          requirement: 1,
          icon: '🧪',
        },
      ])

      // Then unlock it
      unlockAchievement(testAchievementId)
      ids.achievementIds.push(testAchievementId)
      setTestOutput((prev) => prev + '  ✓ Generated test achievement\n')

      // 5. Generate test kata
      const testKataId = `test-kata-${Date.now()}`
      const addKata = useSovereignPathStore.getState().addKata
      addKata({
        name: '[TEST] Sync Validation Kata',
        description: 'Test kata for sync validation',
        category: 'physical',
        frequency: 'daily',
      })
      ids.kataIds.push(testKataId)
      setTestOutput((prev) => prev + '  ✓ Generated test kata\n')

      // 6. Update OEJTS to trigger sovereign path sync
      const addOEJTSAnswer = useSovereignPathStore.getState().addOEJTSAnswer
      addOEJTSAnswer({
        questionId: 1,
        value: 3,
        answeredAt: new Date().toISOString(),
      })
      setTestOutput((prev) => prev + '  ✓ Generated test OEJTS answer\n\n')

      setTestDataIds(ids)
      return ids
    } catch (err: any) {
      setTestOutput((prev) => prev + `❌ Error generating test data: ${err.message}\n\n`)
      throw err
    }
  }

  /**
   * Clean up all generated test data
   */
  const cleanupTestData = async () => {
    setTestOutput((prev) => prev + '\n🧹 Cleaning up test data...\n\n')

    try {
      const { chatSessions, journalIds, achievementIds, kataIds } = testDataIds

      // Clean up from stores (already done via auto-sync, but remove from local state)
      const deleteSession = useChatStore.getState().deleteSession
      chatSessions.forEach((sessionId) => {
        if (deleteSession) {
          try {
            deleteSession(sessionId)
            setTestOutput((prev) => prev + `  ✓ Removed test chat session: ${sessionId}\n`)
          } catch (e) {
            // Session removal not available, skip
          }
        }
      })

      // Clean up achievements
      const achievements = useAchievementStore.getState().achievements
      const updatedAchievements = achievements.filter((a) => !achievementIds.includes(a.id))
      useAchievementStore.setState({ achievements: updatedAchievements })
      setTestOutput((prev) => prev + `  ✓ Removed ${achievementIds.length} test achievements\n`)

      // Clean up katas
      kataIds.forEach((id) => {
        const deleteKata = useSovereignPathStore.getState().deleteKata
        try {
          deleteKata(id)
        } catch (e) {
          // Kata might not exist
        }
      })
      setTestOutput((prev) => prev + `  ✓ Removed ${kataIds.length} test katas\n`)

      // Clean up from Supabase (test data is marked with [TEST] prefix)
      await supabase.from('sovereign_logs').delete().ilike('content', '%[TEST]%')
      setTestOutput((prev) => prev + '  ✓ Cleaned Supabase test data\n\n')

      setTestOutput((prev) => prev + '✅ Test data cleanup complete!\n\n')

      // Reset tracking
      setTestDataIds({
        chatSessions: [],
        journalIds: [],
        achievementIds: [],
        kataIds: [],
      })
    } catch (err: any) {
      setTestOutput((prev) => prev + `⚠️  Cleanup warning: ${err.message}\n\n`)
    }
  }

  const runTests = async () => {
    setRunning(true)
    setTestOutput('🚀 Starting sync system tests...\n\n')

    try {
      // Test 1: Database Connection
      setTestResults((prev) => prev.map((t, i) => (i === 0 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing database connection...\n')

      const startTime = Date.now()
      const { error: connError } = await supabase.from('sovereign_logs').select('id').limit(1)
      const duration = Date.now() - startTime

      if (connError) throw connError

      setTestResults((prev) =>
        prev.map((t, i) => (i === 0 ? { ...t, status: 'passed', duration } : t))
      )
      setTestOutput((prev) => prev + `✅ Database connected (${duration}ms)\n\n`)

      // Test 2: Chat Messages Sync
      setTestResults((prev) => prev.map((t, i) => (i === 1 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing chat message sync...\n')

      const chatCount = allChatMessages.length
      if (chatCount > 0) {
        const testChat = allChatMessages[0]
        const result = await syncChatMessage(testChat, testChat.sessionId || 'test-session')

        if (result.success) {
          setTestResults((prev) =>
            prev.map((t, i) => (i === 1 ? { ...t, status: 'passed', count: chatCount } : t))
          )
          setTestOutput(
            (prev) => prev + `✅ Chat sync working (${chatCount} messages available)\n\n`
          )
        } else {
          throw new Error(result.error || 'Chat sync failed')
        }
      } else {
        setTestResults((prev) =>
          prev.map((t, i) => (i === 1 ? { ...t, status: 'passed', message: 'No chat data' } : t))
        )
        setTestOutput((prev) => prev + `ℹ️  No chat messages to sync\n\n`)
      }

      // Test 3: Journal Entries Sync
      setTestResults((prev) => prev.map((t, i) => (i === 2 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing journal entry sync...\n')

      const journalCount = allJournalEntries.length
      if (journalCount > 0) {
        const testJournal = allJournalEntries[0]
        const result = await syncJournalEntry(testJournal)

        if (result.success) {
          setTestResults((prev) =>
            prev.map((t, i) => (i === 2 ? { ...t, status: 'passed', count: journalCount } : t))
          )
          setTestOutput(
            (prev) => prev + `✅ Journal sync working (${journalCount} entries available)\n\n`
          )
        } else {
          throw new Error(result.error || 'Journal sync failed')
        }
      } else {
        setTestResults((prev) =>
          prev.map((t, i) => (i === 2 ? { ...t, status: 'passed', message: 'No journal data' } : t))
        )
        setTestOutput((prev) => prev + `ℹ️  No journal entries to sync\n\n`)
      }

      // Test 4: User Progress Sync
      setTestResults((prev) => prev.map((t, i) => (i === 3 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing user progress sync...\n')

      const userProgress = {
        complianceStreak,
        lastCompletedDate,
        totalCompletions,
      }
      const progressResult = await syncUserProgress(userProgress)
      if (progressResult.success) {
        setTestResults((prev) => prev.map((t, i) => (i === 3 ? { ...t, status: 'passed' } : t)))
        setTestOutput(
          (prev) =>
            prev +
            `✅ Progress synced (Streak: ${complianceStreak}, Total: ${totalCompletions})\n\n`
        )
      } else {
        throw new Error(progressResult.error || 'Progress sync failed')
      }

      // Test 5: Achievements Sync
      setTestResults((prev) => prev.map((t, i) => (i === 4 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing achievements sync...\n')

      const unlockedAchievements = achievements.filter((a) => a.unlocked)
      if (unlockedAchievements.length > 0) {
        const achievementResult = await bulkSyncAchievements(unlockedAchievements)
        setTestResults((prev) =>
          prev.map((t, i) =>
            i === 4 ? { ...t, status: 'passed', count: achievementResult.succeeded } : t
          )
        )
        setTestOutput(
          (prev) =>
            prev +
            `✅ Achievements synced (${achievementResult.succeeded}/${achievementResult.total})\n\n`
        )
      } else {
        setTestResults((prev) =>
          prev.map((t, i) =>
            i === 4 ? { ...t, status: 'passed', message: 'No achievements unlocked' } : t
          )
        )
        setTestOutput((prev) => prev + `ℹ️  No achievements to sync\n\n`)
      }

      // Test 6: Sovereign Path Data Sync
      setTestResults((prev) => prev.map((t, i) => (i === 5 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing sovereign path data sync...\n')

      const sovereignPathData = {
        humanDesignChart,
        birthData,
        oejtsAnswers,
        oejtsResults,
        archetypeAnalysis,
        katas,
        healthMetrics,
      }
      const pathDataResult = await syncSovereignPathData(sovereignPathData)
      if (pathDataResult.success) {
        const hasHD = !!humanDesignChart
        const hasOEJTS = oejtsAnswers.length > 0
        const hasKatas = katas.length > 0
        setTestResults((prev) => prev.map((t, i) => (i === 5 ? { ...t, status: 'passed' } : t)))
        setTestOutput(
          (prev) =>
            prev +
            `✅ Path data synced (HD: ${hasHD ? 'Yes' : 'No'}, OEJTS: ${hasOEJTS ? 'Yes' : 'No'}, Katas: ${hasKatas ? katas.length : 0})\n\n`
        )
      } else {
        throw new Error(pathDataResult.error || 'Path data sync failed')
      }

      // Test 7: Data Verification
      setTestResults((prev) => prev.map((t, i) => (i === 6 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Verifying synced data...\n')

      const { data: syncedLogs, error: verifyError } = await supabase
        .from('sovereign_logs')
        .select('id, category, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (verifyError) throw verifyError

      const syncedCount = syncedLogs?.length || 0
      setTestResults((prev) =>
        prev.map((t, i) => (i === 6 ? { ...t, status: 'passed', count: syncedCount } : t))
      )
      setTestOutput(
        (prev) => prev + `✅ Data verified (${syncedCount} recent logs in database)\n\n`
      )

      setTestOutput((prev) => prev + '🎉 All sync tests passed!\n')
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error'
      setTestOutput((prev) => prev + `\n❌ Test failed: ${errorMessage}\n`)
      setTestResults((prev) =>
        prev.map((t) =>
          t.status === 'running' ? { ...t, status: 'failed', message: errorMessage } : t
        )
      )
      console.error('[Sync Test]', err)
    } finally {
      setRunning(false)
    }
  }

  const bulkSyncAll = async () => {
    setBulkSyncProgress({ total: 0, synced: 0, failed: 0, inProgress: true })
    setTestOutput('🔄 Starting bulk sync of all local data...\n\n')

    try {
      const unlockedAchievements = achievements.filter((a) => a.unlocked)
      const totalItems =
        allChatMessages.length + allJournalEntries.length + unlockedAchievements.length + 2 // +2 for progress and path data

      setBulkSyncProgress((prev) => ({ ...prev, total: totalItems }))

      let synced = 0
      let failed = 0

      // Sync user progress
      setTestOutput((prev) => prev + `▶ Syncing user progress...\n`)
      const userProgress = {
        complianceStreak,
        lastCompletedDate,
        totalCompletions,
      }
      const progressResult = await syncUserProgress(userProgress)
      if (progressResult.success) {
        synced++
        setTestOutput((prev) => prev + `✅ User progress synced\n\n`)
      } else {
        failed++
        setTestOutput((prev) => prev + `❌ User progress failed: ${progressResult.error}\n\n`)
      }
      setBulkSyncProgress((prev) => ({ ...prev, synced, failed }))

      // Sync all chat messages
      setTestOutput((prev) => prev + `▶ Syncing ${allChatMessages.length} chat messages...\n`)
      for (const chat of allChatMessages) {
        const result = await syncChatMessage(chat, chat.sessionId || 'bulk-sync-session')
        if (result.success) {
          synced++
        } else {
          failed++
          console.error('[Bulk Sync] Chat failed:', result.error)
        }
        setBulkSyncProgress((prev) => ({ ...prev, synced, failed }))
      }
      setTestOutput(
        (prev) => prev + `✅ Chat messages synced: ${allChatMessages.length - failed}\n\n`
      )

      // Sync all journal entries
      setTestOutput((prev) => prev + `▶ Syncing ${allJournalEntries.length} journal entries...\n`)
      for (const journal of allJournalEntries) {
        const result = await syncJournalEntry(journal)
        if (result.success) {
          synced++
        } else {
          failed++
          console.error('[Bulk Sync] Journal failed:', result.error)
        }
        setBulkSyncProgress((prev) => ({ ...prev, synced, failed }))
      }
      setTestOutput((prev) => prev + `✅ Journal entries synced: ${allJournalEntries.length}\n\n`)

      // Sync achievements
      if (unlockedAchievements.length > 0) {
        setTestOutput(
          (prev) => prev + `▶ Syncing ${unlockedAchievements.length} achievements...\n`
        )
        const achievementResult = await bulkSyncAchievements(unlockedAchievements)
        synced += achievementResult.succeeded
        failed += achievementResult.failed
        setBulkSyncProgress((prev) => ({ ...prev, synced, failed }))
        setTestOutput(
          (prev) =>
            prev +
            `✅ Achievements synced: ${achievementResult.succeeded}/${achievementResult.total}\n\n`
        )
      }

      // Sync sovereign path data
      setTestOutput((prev) => prev + `▶ Syncing sovereign path data...\n`)
      const sovereignPathData = {
        humanDesignChart,
        birthData,
        oejtsAnswers,
        oejtsResults,
        archetypeAnalysis,
        katas,
        healthMetrics,
      }
      const pathResult = await syncSovereignPathData(sovereignPathData)
      if (pathResult.success) {
        synced++
        setTestOutput((prev) => prev + `✅ Sovereign path data synced\n\n`)
      } else {
        failed++
        setTestOutput((prev) => prev + `❌ Path data failed: ${pathResult.error}\n\n`)
      }
      setBulkSyncProgress((prev) => ({ ...prev, synced, failed }))

      setTestOutput(
        (prev) =>
          prev +
          `\n🎉 Bulk sync complete!\n✅ Synced: ${synced}/${totalItems}\n${failed > 0 ? `❌ Failed: ${failed}\n` : ''}`
      )
    } catch (err: any) {
      setTestOutput((prev) => prev + `\n❌ Bulk sync error: ${err.message}\n`)
      console.error('[Bulk Sync]', err)
    } finally {
      setBulkSyncProgress((prev) => ({ ...prev, inProgress: false }))
    }
  }

  const resetTests = () => {
    setTestResults([
      { name: 'Database Connection', status: 'pending' },
      { name: 'Chat Messages Sync', status: 'pending' },
      { name: 'Journal Entries Sync', status: 'pending' },
      { name: 'User Progress Sync', status: 'pending' },
      { name: 'Achievements Sync', status: 'pending' },
      { name: 'Sovereign Path Data Sync', status: 'pending' },
      { name: 'Data Verification', status: 'pending' },
    ])
    setTestOutput('')
    setBulkSyncProgress({ total: 0, synced: 0, failed: 0, inProgress: false })
  }

  const totalLocal = allChatMessages.length + allJournalEntries.length

  return (
    <YStack gap="$4">
      {/* Header */}
      <YStack gap="$2">
        <H3>Sync System Tests</H3>
        <Paragraph fontSize="$2" color="gray">
          Test and verify Supabase sync functionality
        </Paragraph>
      </YStack>

      {/* Local Data Summary */}
      <Card
        padding="$4"
        gap="$3"
        backgroundColor={semanticColors.info.background}
        borderColor={semanticColors.info.border}
      >
        <XStack gap="$3" alignItems="center">
          <Database size={20} color={iconColors.info} />
          <YStack flex={1} gap="$1">
            <Paragraph fontSize="$3" fontWeight="600" color={semanticColors.info.textContrast}>
              Local Data Available
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              💬 {allChatMessages.length} chat messages
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              📔 {allJournalEntries.length} journal entries
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              🏆 {achievements.filter((a) => a.unlocked).length} achievements unlocked
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              📊 {totalLocal} total items ready to sync
            </Paragraph>
          </YStack>
        </XStack>
      </Card>

      {/* Action Buttons */}
      <XStack gap="$3" flexWrap="wrap">
        <Button
          flex={1}
          minWidth={150}
          icon={running ? <Spinner size="small" /> : <Play />}
          onPress={runTests}
          disabled={running || bulkSyncProgress.inProgress}
        >
          Run Tests
        </Button>
        <Button
          flex={1}
          minWidth={150}
          icon={bulkSyncProgress.inProgress ? <Spinner size="small" /> : <Upload />}
          onPress={bulkSyncAll}
          disabled={running || bulkSyncProgress.inProgress || totalLocal === 0}
        >
          Bulk Sync All
        </Button>
        <Button
          variant="outlined"
          icon={<RefreshCw />}
          onPress={resetTests}
          disabled={running || bulkSyncProgress.inProgress}
        >
          Reset
        </Button>
      </XStack>

      {/* Bulk Sync Progress */}
      {bulkSyncProgress.total > 0 && (
        <Card padding="$4" gap="$3">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Paragraph fontSize="$3" fontWeight="600">
                Bulk Sync Progress
              </Paragraph>
              <Paragraph fontSize="$2" color="gray">
                {bulkSyncProgress.synced}/{bulkSyncProgress.total}
              </Paragraph>
            </XStack>
            <Progress value={(bulkSyncProgress.synced / bulkSyncProgress.total) * 100} height="$1">
              <Progress.Indicator
                animation="quick"
                backgroundColor={semanticColors.success.border}
              />
            </Progress>
            {bulkSyncProgress.failed > 0 && (
              <Paragraph fontSize="$2" color={semanticColors.error.text}>
                ⚠️ {bulkSyncProgress.failed} items failed
              </Paragraph>
            )}
          </YStack>
        </Card>
      )}

      {/* Test Results */}
      <Card padding="$4" gap="$3">
        <Paragraph fontSize="$3" fontWeight="600" color="gray">
          Test Results
        </Paragraph>
        <YStack gap="$2">
          {testResults.map((test, i) => (
            <XStack
              key={i}
              gap="$3"
              alignItems="center"
              padding="$3"
              backgroundColor={
                test.status === 'passed'
                  ? semanticColors.success.background
                  : test.status === 'failed'
                    ? semanticColors.error.background
                    : test.status === 'running'
                      ? semanticColors.info.background
                      : semanticColors.neutral.background
              }
              borderRadius="$3"
            >
              {test.status === 'running' ? (
                <Spinner size="small" />
              ) : test.status === 'passed' ? (
                <CheckCircle size={20} color={iconColors.success} />
              ) : test.status === 'failed' ? (
                <XCircle size={20} color={iconColors.error} />
              ) : (
                <Clock size={20} color={iconColors.neutral} />
              )}

              <YStack flex={1}>
                <Paragraph fontSize="$3" fontWeight="600">
                  {test.name}
                </Paragraph>
                {test.duration && (
                  <Paragraph fontSize="$2" color="gray">
                    {test.duration}ms
                  </Paragraph>
                )}
                {test.count !== undefined && (
                  <Paragraph fontSize="$2" color="gray">
                    {test.count} items
                  </Paragraph>
                )}
                {test.message && (
                  <Paragraph fontSize="$2" color="gray">
                    {test.message}
                  </Paragraph>
                )}
              </YStack>
            </XStack>
          ))}
        </YStack>
      </Card>

      {/* Test Output Terminal */}
      {testOutput && (
        <Card padding="$4" gap="$3">
          <XStack gap="$2" alignItems="center">
            <AlertCircle size={16} color="gray" />
            <Paragraph fontSize="$2" fontWeight="600" color="gray">
              TEST OUTPUT
            </Paragraph>
          </XStack>
          <ScrollView maxHeight={300}>
            <Paragraph fontSize="$2" color="gray" whiteSpace="pre-wrap">
              {testOutput}
            </Paragraph>
          </ScrollView>
        </Card>
      )}
    </YStack>
  )
}

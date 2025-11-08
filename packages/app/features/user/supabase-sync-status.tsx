/**
 * Supabase Sync Status - Shows what's being synced to Supabase
 * Promotes trust and transparency about data sync
 */

import { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Button,
  Paragraph,
  H3,
  Card,
  ScrollView,
  Separator,
  Spinner,
  Circle,
} from '@my/ui'
import {
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Shield,
  Cloud,
  Upload,
  Play,
  Pause,
} from '@tamagui/lucide-icons'
import { supabase, isSupabaseConfigured } from '../../lib/supabase-client'
import { useAuthStore } from '../../lib/auth-store'
import { getSyncMode, setSyncMode, getQueuedItems, flushQueue } from '../../lib/supabase-sync'
import { SyncTestPanel } from './sync-test-panel'
import { semanticColors, iconColors } from '../../lib/theme-colors'

interface SyncStats {
  sovereignLogs: number
  chatMessages: number
  journalEntries: number
  lastSync: string | null
  isOnline: boolean
}

export function SupabaseSyncStatus() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [syncMode, setSyncModeState] = useState<'auto' | 'manual'>(getSyncMode())
  const [queuedCount, setQueuedCount] = useState(getQueuedItems().length)
  const [syncing, setSyncing] = useState(false)
  const [stats, setStats] = useState<SyncStats>({
    sovereignLogs: 0,
    chatMessages: 0,
    journalEntries: 0,
    lastSync: null,
    isOnline: isSupabaseConfigured,
  })
  const [refreshing, setRefreshing] = useState(false)

  const loadSyncStats = async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }

    try {
      // Get counts from Supabase
      const { count: totalLogs } = await supabase
        .from('sovereign_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: chatCount } = await supabase
        .from('sovereign_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'chat')

      const { count: journalCount } = await supabase
        .from('sovereign_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'journal')

      // Get most recent sync timestamp
      const { data: recentLog } = await supabase
        .from('sovereign_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setStats({
        sovereignLogs: totalLogs || 0,
        chatMessages: chatCount || 0,
        journalEntries: journalCount || 0,
        lastSync: recentLog?.created_at || null,
        isOnline: true,
      })
    } catch (err: any) {
      console.error('[Sync Status] Failed to load stats:', err)
      setStats((prev) => ({ ...prev, isOnline: false }))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSyncStats()
  }, [user])

  const handleRefresh = () => {
    setRefreshing(true)
    loadSyncStats()
  }

  const handleToggleSyncMode = () => {
    const newMode = syncMode === 'auto' ? 'manual' : 'auto'
    setSyncMode(newMode)
    setSyncModeState(newMode)
    console.log(`[Sync Status] Sync mode changed to: ${newMode}`)
  }

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      const result = await flushQueue()
      console.log('[Sync Status] Manual sync complete:', result)
      setQueuedCount(0)
      // Refresh stats after sync
      await loadSyncStats()
    } catch (error) {
      console.error('[Sync Status] Manual sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <Card
        padding="$4"
        backgroundColor={semanticColors.warning.background}
        borderColor={semanticColors.warning.border}
        borderWidth={1}
      >
        <XStack gap="$3" alignItems="center">
          <AlertCircle size={24} color={iconColors.warning} />
          <YStack flex={1}>
            <Paragraph fontSize="$3" fontWeight="600" color={semanticColors.warning.textContrast}>
              Supabase Not Configured
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.warning.text}>
              All data is stored locally only
            </Paragraph>
          </YStack>
        </XStack>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card
        padding="$4"
        backgroundColor={semanticColors.neutral.background}
        borderColor={semanticColors.neutral.border}
        borderWidth={1}
      >
        <XStack gap="$3" alignItems="center">
          <Shield size={24} color={iconColors.neutral} />
          <Paragraph fontSize="$3" color={semanticColors.neutral.text}>
            Sign in to view sync status
          </Paragraph>
        </XStack>
      </Card>
    )
  }

  return (
    <YStack gap="$3">
      {/* Header */}
      <Card padding="$4" gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$3" alignItems="center">
            <Circle
              size={48}
              backgroundColor={semanticColors.info.background}
              borderColor={semanticColors.info.border}
              borderWidth={2}
            >
              <Cloud size={24} color={iconColors.info} />
            </Circle>
            <YStack>
              <H3>Supabase Sync Status</H3>
              <Paragraph fontSize="$2" color="$gray11">
                Real-time cloud synchronization
              </Paragraph>
            </YStack>
          </XStack>
          <Button
            size="$3"
            circular
            icon={refreshing ? <Spinner size="small" /> : <RefreshCw size={18} />}
            onPress={handleRefresh}
            disabled={refreshing || loading}
            chromeless
          />
        </XStack>

        {/* Sync Mode Controls */}
        <Separator />
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1}>
              <Paragraph fontSize="$3" fontWeight="600">
                {syncMode === 'auto' ? 'Auto-Sync Enabled' : 'Manual Sync Mode'}
              </Paragraph>
              <Paragraph fontSize="$2" color="$gray11">
                {syncMode === 'auto'
                  ? 'Data syncs immediately to Supabase'
                  : 'Data queued until manual sync'}
              </Paragraph>
            </YStack>
            <Button
              size="$3"
              variant={syncMode === 'auto' ? 'outlined' : undefined}
              theme={syncMode === 'auto' ? 'green' : 'blue'}
              icon={syncMode === 'auto' ? <Play size={16} /> : <Pause size={16} />}
              onPress={handleToggleSyncMode}
            >
              {syncMode === 'auto' ? 'Auto' : 'Manual'}
            </Button>
          </XStack>

          {syncMode === 'manual' && queuedCount > 0 && (
            <Card
              backgroundColor={semanticColors.warning.background}
              borderColor={semanticColors.warning.border}
              borderWidth={1}
              padding="$3"
            >
              <XStack gap="$3" alignItems="center" justifyContent="space-between">
                <YStack flex={1}>
                  <Paragraph
                    fontSize="$2"
                    fontWeight="600"
                    color={semanticColors.warning.textContrast}
                  >
                    {queuedCount} item{queuedCount !== 1 ? 's' : ''} queued
                  </Paragraph>
                  <Paragraph fontSize="$1" color={semanticColors.warning.text}>
                    Tap sync to upload to Supabase
                  </Paragraph>
                </YStack>
                <Button
                  size="$3"
                  theme="yellow"
                  icon={syncing ? <Spinner size="small" /> : <Upload size={16} />}
                  onPress={handleManualSync}
                  disabled={syncing}
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </XStack>
            </Card>
          )}
        </YStack>

        {/* Connection Status */}
        <XStack
          gap="$2"
          alignItems="center"
          paddingHorizontal="$4"
          paddingVertical="$2"
          backgroundColor={stats.isOnline ? 'green' : 'red'}
          borderRadius="$10"
          borderWidth={1}
          borderColor={stats.isOnline ? 'green' : 'red'}
        >
          <Circle size={8} backgroundColor={stats.isOnline ? 'green' : 'red'} />
          <Paragraph fontSize="$2" fontWeight="600" color="gray">
            {stats.isOnline ? 'Connected & Syncing' : 'Connection Failed'}
          </Paragraph>
        </XStack>
      </Card>

      {/* Sync Statistics */}
      {loading ? (
        <Card padding="$6" alignItems="center">
          <Spinner size="large" />
          <Paragraph color="gray" marginTop="$3">
            Loading sync stats...
          </Paragraph>
        </Card>
      ) : (
        <>
          <Card padding="$4" gap="$3">
            <XStack gap="$3" alignItems="center">
              <Database size={24} color="purple" />
              <H3>Data in Supabase</H3>
            </XStack>

            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Paragraph color="gray">Total Sovereign Logs</Paragraph>
                <XStack gap="$2" alignItems="center">
                  <Paragraph fontSize="$6" fontWeight="700" color="purple">
                    {stats.sovereignLogs}
                  </Paragraph>
                  <CheckCircle size={16} color={iconColors.success} />
                </XStack>
              </XStack>

              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <Paragraph color="gray">Chat Messages Synced</Paragraph>
                <XStack gap="$2" alignItems="center">
                  <Paragraph fontWeight="600">{stats.chatMessages}</Paragraph>
                  <CheckCircle size={16} color={iconColors.success} />
                </XStack>
              </XStack>

              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <Paragraph color="gray">Journal Entries Synced</Paragraph>
                <XStack gap="$2" alignItems="center">
                  <Paragraph fontWeight="600">{stats.journalEntries}</Paragraph>
                  <CheckCircle size={16} color={iconColors.success} />
                </XStack>
              </XStack>

              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <Paragraph color="gray">Last Sync</Paragraph>
                <Paragraph fontWeight="600">
                  {stats.lastSync
                    ? new Date(stats.lastSync).toLocaleString()
                    : 'No data synced yet'}
                </Paragraph>
              </XStack>
            </YStack>
          </Card>

          {/* RAG Status */}
          <Card
            padding="$4"
            gap="$3"
            backgroundColor={semanticColors.info.background}
            borderColor={semanticColors.info.border}
            borderWidth={1}
          >
            <XStack gap="$3" alignItems="center">
              <Eye size={24} color={iconColors.info} />
              <YStack flex={1}>
                <Paragraph fontSize="$4" fontWeight="600" color={semanticColors.info.text}>
                  RAG System Active
                </Paragraph>
                <Paragraph fontSize="$2" color={semanticColors.info.text}>
                  All {stats.sovereignLogs} logs are indexed with embeddings for semantic search
                </Paragraph>
              </YStack>
            </XStack>
          </Card>

          {/* Trust & Transparency Info */}
          <Card
            padding="$4"
            gap="$3"
            backgroundColor={semanticColors.success.background}
            borderColor={semanticColors.success.border}
            borderWidth={1}
          >
            <XStack gap="$3" alignItems="center">
              <Shield size={24} color={iconColors.success} />
              <YStack flex={1}>
                <Paragraph fontSize="$4" fontWeight="600" color={semanticColors.success.text}>
                  Your Data is Secure
                </Paragraph>
                <Paragraph fontSize="$2" color={semanticColors.success.text}>
                  • End-to-end encryption in transit{'\n'}• Row-Level Security (RLS) enforced{'\n'}•
                  Only YOU can access your data{'\n'}• All operations are logged and auditable
                </Paragraph>
              </YStack>
            </XStack>
          </Card>

          {/* What's Being Synced */}
          <Card padding="$4" gap="$3">
            <H3>What Gets Synced Automatically</H3>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <CheckCircle size={16} color={iconColors.success} />
                <Paragraph fontSize="$3">Chat messages with AI guide</Paragraph>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <CheckCircle size={16} color={iconColors.success} />
                <Paragraph fontSize="$3">Journal entries and reflections</Paragraph>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <CheckCircle size={16} color={iconColors.success} />
                <Paragraph fontSize="$3">Routine completions and progress</Paragraph>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <CheckCircle size={16} color={iconColors.success} />
                <Paragraph fontSize="$3">Achievement unlocks and milestones</Paragraph>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <CheckCircle size={16} color={iconColors.success} />
                <Paragraph fontSize="$3">384D embeddings for semantic search</Paragraph>
              </XStack>
            </YStack>
          </Card>

          {/* Sync Test Panel - Test and bulk upload existing data */}
          <SyncTestPanel />
        </>
      )}
    </YStack>
  )
}

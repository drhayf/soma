/**
 * Sync Control Panel - Toggle auto/manual sync and view queue
 */

import { useState, useEffect } from 'react'
import { YStack, XStack, Button, Paragraph, H2, H3, Card, Separator, Switch } from '@my/ui'
import { Cloud, CloudOff, Upload, Database, Trash2, RefreshCw } from '@tamagui/lucide-icons'
import {
  getSyncMode,
  setSyncMode,
  getQueuedItems,
  getQueueStats,
  flushQueue,
  clearQueue,
} from '../../lib/supabase-sync'
import { semanticColors, iconColors } from '../../lib/theme-colors'

export function SyncControlPanel() {
  const [mode, setMode] = useState<'auto' | 'manual'>(getSyncMode())
  const [queueStats, setQueueStats] = useState(getQueueStats())
  const [flushing, setFlushing] = useState(false)
  const [flushResult, setFlushResult] = useState<string | null>(null)

  const refreshStats = () => {
    setQueueStats(getQueueStats())
    setMode(getSyncMode())
  }

  useEffect(() => {
    // Refresh stats every 2 seconds when in manual mode
    if (mode === 'manual') {
      const interval = setInterval(refreshStats, 2000)
      return () => clearInterval(interval)
    }
  }, [mode])

  const handleToggleMode = () => {
    const newMode = mode === 'auto' ? 'manual' : 'auto'
    setSyncMode(newMode)
    setMode(newMode)
    refreshStats()
  }

  const handleFlushQueue = async () => {
    setFlushing(true)
    setFlushResult(null)

    try {
      const result = await flushQueue()
      setFlushResult(
        `✓ Uploaded ${result.uploaded} items, ${result.failed} failed. ${result.remainingQueue} remaining in queue.`
      )
      refreshStats()
    } catch (err: any) {
      setFlushResult(`✗ Error: ${err.message}`)
    } finally {
      setFlushing(false)
    }
  }

  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear the queue? This cannot be undone.')) {
      clearQueue()
      refreshStats()
      setFlushResult('Queue cleared')
    }
  }

  return (
    <YStack flex={1} padding="$4" gap="$4" backgroundColor="$background">
      {/* Header */}
      <YStack gap="$2">
        <H2>Supabase Sync Control</H2>
        <Paragraph color="gray" fontSize="$3">
          Control how data syncs to Supabase for RAG system
        </Paragraph>
      </YStack>

      {/* Sync Mode Toggle */}
      <Card padding="$4" gap="$3">
        <H3>Sync Mode</H3>

        <XStack gap="$4" alignItems="center" justifyContent="space-between">
          <YStack flex={1} gap="$2">
            <XStack gap="$2" alignItems="center">
              {mode === 'auto' ? (
                <Cloud size={20} color={iconColors.success} />
              ) : (
                <CloudOff size={20} color="$orange10" />
              )}
              <Paragraph fontSize="$4" fontWeight="600">
                {mode === 'auto' ? 'Auto Sync (Online)' : 'Manual Sync (Offline)'}
              </Paragraph>
            </XStack>
            <Paragraph fontSize="$2" color="gray">
              {mode === 'auto'
                ? 'Data is immediately uploaded to Supabase'
                : 'Data is queued locally, sync manually when ready'}
            </Paragraph>
          </YStack>

          <Switch size="$4" checked={mode === 'auto'} onCheckedChange={handleToggleMode}>
            <Switch.Thumb animation="quick" />
          </Switch>
        </XStack>
      </Card>

      {/* Queue Stats (only visible in manual mode) */}
      {mode === 'manual' && (
        <Card padding="$4" gap="$3" backgroundColor="$orange2" borderColor="$orange7">
          <XStack gap="$3" alignItems="center" justifyContent="space-between">
            <H3 color="$orange11">Queued Items</H3>
            <Button
              size="$2"
              circular
              icon={<RefreshCw size={16} />}
              onPress={refreshStats}
              chromeless
            />
          </XStack>

          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Paragraph color="gray">Total Items</Paragraph>
              <Paragraph fontSize="$6" fontWeight="700" color="$orange10">
                {queueStats.total}
              </Paragraph>
            </XStack>

            <Separator />

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Chat Messages</Paragraph>
              <Paragraph fontWeight="600">{queueStats.byType.chat}</Paragraph>
            </XStack>

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Journal Entries</Paragraph>
              <Paragraph fontWeight="600">{queueStats.byType.journal}</Paragraph>
            </XStack>

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Sovereign Logs</Paragraph>
              <Paragraph fontWeight="600">{queueStats.byType.sovereign}</Paragraph>
            </XStack>

            <XStack justifyContent="space-between">
              <Paragraph color="gray">Feedback</Paragraph>
              <Paragraph fontWeight="600">{queueStats.byType.feedback}</Paragraph>
            </XStack>
          </YStack>

          {/* Flush Actions */}
          <YStack gap="$2" marginTop="$2">
            <Button
              size="$4"
              backgroundColor={semanticColors.primary.background}
              borderColor={semanticColors.primary.border}
              icon={flushing ? <RefreshCw /> : <Upload />}
              onPress={handleFlushQueue}
              disabled={flushing || queueStats.total === 0}
            >
              {flushing ? 'Uploading...' : `Upload ${queueStats.total} Items to Supabase`}
            </Button>

            <Button
              size="$3"
              backgroundColor={semanticColors.error.background}
              borderColor={semanticColors.error.border}
              variant="outlined"
              icon={<Trash2 />}
              onPress={handleClearQueue}
              disabled={queueStats.total === 0}
            >
              Clear Queue
            </Button>
          </YStack>

          {/* Flush Result */}
          {flushResult && (
            <Card
              padding="$3"
              backgroundColor={
                flushResult.startsWith('✓')
                  ? semanticColors.success.background
                  : semanticColors.error.background
              }
              borderColor={
                flushResult.startsWith('✓')
                  ? semanticColors.success.border
                  : semanticColors.error.border
              }
            >
              <Paragraph
                fontSize="$3"
                color={
                  flushResult.startsWith('✓')
                    ? semanticColors.success.text
                    : semanticColors.error.text
                }
              >
                {flushResult}
              </Paragraph>
            </Card>
          )}
        </Card>
      )}

      {/* Queue Items Detail (only if items exist) */}
      {mode === 'manual' && queueStats.total > 0 && (
        <Card padding="$4" gap="$3">
          <H3>Queued Items Detail</H3>
          <Paragraph fontSize="$2" color="gray">
            Preview of items waiting to be uploaded
          </Paragraph>

          <YStack gap="$2" maxHeight={300} overflow="scroll">
            {getQueuedItems()
              .slice(0, 10)
              .map((item, idx) => (
                <Card key={idx} padding="$3" backgroundColor="gray">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack flex={1} gap="$1">
                      <Paragraph fontSize="$3" fontWeight="600" color="gray">
                        {item.type.toUpperCase()}
                      </Paragraph>
                      <Paragraph fontSize="$2" color="gray" numberOfLines={1}>
                        {item.data.content?.substring(0, 60)}...
                      </Paragraph>
                    </YStack>
                    <Paragraph fontSize="$2" color="gray">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Paragraph>
                  </XStack>
                </Card>
              ))}
            {queueStats.total > 10 && (
              <Paragraph fontSize="$2" color="gray" textAlign="center">
                + {queueStats.total - 10} more items
              </Paragraph>
            )}
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
          💡 How Sync Works
        </Paragraph>
        <Paragraph fontSize="$2" color={semanticColors.info.text}>
          <Paragraph fontWeight="600">Auto Mode:</Paragraph> Every chat message, journal entry, and
          sovereign log is immediately uploaded to Supabase for RAG search and analysis.
        </Paragraph>
        <Paragraph fontSize="$2" color={semanticColors.info.text} marginTop="$2">
          <Paragraph fontWeight="600">Manual Mode:</Paragraph> Data is queued locally. Use this to
          intentionally go "offline" and batch upload later. Useful for testing or limited
          connectivity.
        </Paragraph>
      </Card>
    </YStack>
  )
}

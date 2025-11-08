/**
 * Sync Settings - UI to control offline -> online sync
 */

import { useState, useEffect } from 'react'
import { YStack, XStack, Button, Paragraph, H2, Switch, Card, Spinner } from '@my/ui'
import offlineSync from '../../lib/offline-sync'
import { useAuthStore } from '../../lib/auth-store'

export function SyncSettings() {
  const [enabled, setEnabled] = useState(true)
  const [pending, setPending] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    refreshPending()
  }, [])

  const refreshPending = async () => {
    const count = await offlineSync.getPendingCount()
    setPending(count)
  }

  const handleManualSync = async () => {
    setRunning(true)
    setOutput('Starting sync...')
    const report = await offlineSync.syncPending({
      onProgress: (msg) => setOutput((prev) => (prev ? prev + '\n' + msg : msg)),
    })
    setOutput(
      (prev) =>
        (prev ? prev + '\n' : '') +
        `\nDone. ${report.succeeded.length} succeeded, ${report.failed.length} failed`
    )
    setRunning(false)
    refreshPending()
  }

  return (
    <Card padding="$4" gap="$3">
      <YStack>
        <H2>Offline Sync</H2>
        <Paragraph color="gray">Control when queued local actions upload to Supabase.</Paragraph>
      </YStack>

      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <Paragraph>Enable automatic sync</Paragraph>
        <Switch checked={enabled} onCheckedChange={(v) => setEnabled(Boolean(v))} />
      </XStack>

      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <Paragraph>Pending queue</Paragraph>
        <Paragraph>{pending === null ? <Spinner /> : `${pending}`}</Paragraph>
      </XStack>

      <XStack gap="$3">
        <Button size="$4" theme="blue" onPress={handleManualSync} disabled={running}>
          {running ? 'Syncing...' : 'Sync Now'}
        </Button>
        <Button size="$4" variant="outlined" onPress={refreshPending}>
          Refresh
        </Button>
      </XStack>

      {output && (
        <Card padding="$3" backgroundColor="gray" borderWidth={1} borderColor="gray">
          <Paragraph fontFamily="$mono" whiteSpace="pre-wrap">
            {output}
          </Paragraph>
        </Card>
      )}
    </Card>
  )
}

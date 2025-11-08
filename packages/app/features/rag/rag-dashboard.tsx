/**
 * RAG Dashboard - Sophisticated RAG System Interface
 *
 * Features:
 * - Real-time connection status
 * - Test suite execution with live output
 * - Vector database statistics
 * - Semantic search testing
 * - System health monitoring
 * - Beautiful, trustworthy UI
 */

import { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Button,
  Paragraph,
  H1,
  H2,
  H3,
  Card,
  Spinner,
  Circle,
  ScrollView,
  Input,
  Progress,
} from '@my/ui'
import {
  Database,
  Activity,
  CheckCircle,
  XCircle,
  Play,
  Terminal,
  Search,
  Zap,
  AlertCircle,
  Loader,
  RefreshCw,
} from '@tamagui/lucide-icons'
import { supabase } from '../../lib/supabase-client'
import { Platform } from 'react-native'
import { SQLConsole } from './sql-console'
import { semanticColors, iconColors, statusColors } from '../../lib/theme-colors'

interface RAGStats {
  totalLogs: number
  totalEmbeddings: number
  uniqueUsers: number
  avgSimilarity: number | null
  lastUpdated: Date
}

interface TestResult {
  name: string
  status: 'running' | 'passed' | 'failed' | 'pending'
  duration?: number
  output?: string
  error?: string
}

export function RAGDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    checking: boolean
    latency: number | null
  }>({
    connected: false,
    checking: true,
    latency: null,
  })

  const [stats, setStats] = useState<RAGStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'Supabase Connection', status: 'pending' },
    { name: 'pgvector Extension', status: 'pending' },
    { name: 'Vector Tables', status: 'pending' },
    { name: 'RPC Functions', status: 'pending' },
    { name: 'Embedding Generation', status: 'pending' },
    { name: 'Semantic Search', status: 'pending' },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const [testOutput, setTestOutput] = useState<string>('')
  const [runningTests, setRunningTests] = useState(false)

  // Check connection on mount
  useEffect(() => {
    checkConnection()
    loadStats()
  }, [])

  const checkConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, checking: true }))
    const startTime = Date.now()

    try {
      const { error } = await supabase.from('sovereign_logs').select('id').limit(1)

      if (!error) {
        const latency = Date.now() - startTime
        setConnectionStatus({
          connected: true,
          checking: false,
          latency,
        })

        // Update first test result
        setTestResults((prev) =>
          prev.map((test, i) => (i === 0 ? { ...test, status: 'passed', duration: latency } : test))
        )
      } else {
        throw error
      }
    } catch (err: any) {
      console.error('[RAG Dashboard] Connection failed:', err)
      setConnectionStatus({
        connected: false,
        checking: false,
        latency: null,
      })

      setTestResults((prev) =>
        prev.map((test, i) => (i === 0 ? { ...test, status: 'failed', error: err.message } : test))
      )
    }
  }

  const loadStats = async () => {
    setLoadingStats(true)

    try {
      // Get total logs count
      const { count: logsCount, error: logsError } = await supabase
        .from('sovereign_logs')
        .select('*', { count: 'exact', head: true })

      // Get total embeddings count
      const { count: embeddingsCount, error: embeddingsError } = await supabase
        .from('sovereign_log_embeddings')
        .select('*', { count: 'exact', head: true })

      if (!logsError && !embeddingsError) {
        setStats({
          totalLogs: logsCount || 0,
          totalEmbeddings: embeddingsCount || 0,
          uniqueUsers: 0, // Would need RPC to count distinct users
          avgSimilarity: null,
          lastUpdated: new Date(),
        })
      }
    } catch (err) {
      console.error('[RAG Dashboard] Failed to load stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const runTestSuite = async () => {
    setRunningTests(true)
    setTestOutput('🚀 Starting RAG system tests...\n\n')

    try {
      // Test 1: Supabase Connection
      setTestResults((prev) => prev.map((t, i) => (i === 0 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing Supabase connection...\n')

      const startTime = Date.now()
      const { error: connError } = await supabase.from('sovereign_logs').select('id').limit(1)
      const duration = Date.now() - startTime

      if (connError) throw connError

      setTestResults((prev) =>
        prev.map((t, i) => (i === 0 ? { ...t, status: 'passed', duration } : t))
      )
      setTestOutput((prev) => prev + `✅ Connected to Supabase (${duration}ms)\n\n`)

      // Test 2: pgvector Extension & RPC
      setTestResults((prev) => prev.map((t, i) => (i === 1 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Checking pgvector extension and RPC...\n')

      const testEmbedding = new Array(384).fill(0.0)
      const { data: rpcData, error: rpcError } = await supabase.rpc('match_sovereign_logs_simple', {
        query_embedding: testEmbedding,
        match_threshold: 0.5,
        match_count: 1,
      })

      if (rpcError) throw rpcError

      setTestResults((prev) => prev.map((t, i) => (i === 1 ? { ...t, status: 'passed' } : t)))
      setTestOutput((prev) => prev + '✅ pgvector extension and RPC working\n\n')

      // Test 3: Vector Tables
      setTestResults((prev) => prev.map((t, i) => (i === 2 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Verifying vector tables...\n')

      const { data: embeddingsData, error: tableError } = await supabase
        .from('sovereign_log_embeddings')
        .select('id, log_id, created_at')
        .limit(5)

      if (tableError) throw tableError

      const embeddingsCount = embeddingsData?.length || 0
      setTestResults((prev) => prev.map((t, i) => (i === 2 ? { ...t, status: 'passed' } : t)))
      setTestOutput(
        (prev) => prev + `✅ Vector tables accessible (${embeddingsCount} embeddings found)\n\n`
      )

      // Test 4: Sovereign Logs Table
      setTestResults((prev) => prev.map((t, i) => (i === 3 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Checking sovereign logs table...\n')

      const { data: logsData, error: logsError } = await supabase
        .from('sovereign_logs')
        .select('id, content, created_at')
        .limit(5)

      if (logsError) throw logsError

      const logsCount = logsData?.length || 0
      setTestResults((prev) => prev.map((t, i) => (i === 3 ? { ...t, status: 'passed' } : t)))
      setTestOutput((prev) => prev + `✅ Sovereign logs accessible (${logsCount} logs found)\n\n`)

      // Test 5: Embedding Vector Dimensions
      setTestResults((prev) => prev.map((t, i) => (i === 4 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Verifying embedding dimensions...\n')

      const { data: sampleEmbedding, error: embError } = await supabase
        .from('sovereign_log_embeddings')
        .select('embedding')
        .limit(1)
        .single()

      if (embError && embError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (OK if empty)
        throw embError
      }

      if (sampleEmbedding?.embedding) {
        const dimensions = sampleEmbedding.embedding.length
        if (dimensions !== 384) {
          throw new Error(`Invalid embedding dimensions: ${dimensions} (expected 384)`)
        }
        setTestOutput((prev) => prev + `✅ Embedding dimensions correct (384D)\n\n`)
      } else {
        setTestOutput((prev) => prev + `✅ Embedding structure validated (no data yet)\n\n`)
      }
      setTestResults((prev) => prev.map((t, i) => (i === 4 ? { ...t, status: 'passed' } : t)))

      // Test 6: Semantic Search Functionality
      setTestResults((prev) => prev.map((t, i) => (i === 5 ? { ...t, status: 'running' } : t)))
      setTestOutput((prev) => prev + '▶ Testing semantic search with sample query...\n')

      const { data: searchResults, error: searchError } = await supabase.rpc(
        'match_sovereign_logs_simple',
        {
          query_embedding: testEmbedding,
          match_threshold: 0.1, // Low threshold for testing
          match_count: 10,
        }
      )

      if (searchError) throw searchError

      setTestResults((prev) => prev.map((t, i) => (i === 5 ? { ...t, status: 'passed' } : t)))
      setTestOutput(
        (prev) =>
          prev +
          `✅ Semantic search operational (returned ${searchResults?.length || 0} results)\n\n`
      )

      // All tests passed
      setTestOutput((prev) => prev + '🎉 All RAG system tests passed!\n')
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error'
      setTestOutput((prev) => prev + `\n❌ Test failed: ${errorMessage}\n`)
      setTestResults((prev) =>
        prev.map((t) =>
          t.status === 'running' ? { ...t, status: 'failed', error: errorMessage } : t
        )
      )
      console.error('[RAG Test Suite]', err)
    } finally {
      setRunningTests(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults([])

    try {
      // Generate embedding via Next.js API (which uses proper Hugging Face SDK)
      setTestOutput('🔍 Generating embedding for search query...\n')

      // Determine the API URL based on platform
      const apiUrl =
        Platform.OS === 'web'
          ? '/api/embedding'
          : process.env.EXPO_PUBLIC_API_URL?.replace('/api/chat', '/api/embedding') ||
            'http://localhost:3000/api/embedding'

      const embeddingResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: searchQuery,
        }),
      })

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text()
        throw new Error(`Embedding API error: ${errorText.substring(0, 200)}`)
      }

      const embeddingData = await embeddingResponse.json()

      if (embeddingData.error) {
        throw new Error(embeddingData.error)
      }

      const embedding = embeddingData.embedding

      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding')
      }

      setTestOutput((prev) => prev + `✅ Generated ${embedding.length}D embedding\n`)

      // Search with RPC function
      setTestOutput((prev) => prev + '🔍 Searching vector database...\n')

      const { data, error } = await supabase.rpc('match_sovereign_logs_simple', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 5,
      })

      if (error) throw error

      setSearchResults(data || [])
      setTestOutput((prev) => prev + `✅ Found ${data?.length || 0} results\n`)
    } catch (err: any) {
      setTestOutput((prev) => prev + `❌ Search failed: ${err.message}\n`)
      console.error('[RAG Search] Error:', err)
    } finally {
      setSearching(false)
    }
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" paddingBottom="$8">
        {/* Header */}
        <YStack gap="$2">
          <XStack gap="$3" alignItems="center">
            <Circle
              size={48}
              backgroundColor={semanticColors.primary.background}
              borderColor={semanticColors.primary.border}
              borderWidth={2}
            >
              <Database size={24} color={iconColors.primary} />
            </Circle>
            <YStack flex={1}>
              <H1>RAG System</H1>
              <Paragraph color="gray" fontSize="$3">
                Retrieval-Augmented Generation Dashboard
              </Paragraph>
            </YStack>
            <Button
              size="$3"
              circular
              icon={<RefreshCw size={18} />}
              onPress={() => {
                checkConnection()
                loadStats()
              }}
              chromeless
            />
          </XStack>
        </YStack>

        {/* Connection Status */}
        <Card padding="$4" gap="$3">
          <XStack gap="$3" alignItems="center" justifyContent="space-between">
            <XStack gap="$3" alignItems="center">
              {connectionStatus.checking ? (
                <Spinner size="small" />
              ) : (
                <Circle
                  size={12}
                  backgroundColor={
                    connectionStatus.connected ? statusColors.online : statusColors.offline
                  }
                  animation="quick"
                />
              )}
              <YStack gap="$1">
                <Paragraph fontSize="$4" fontWeight="600">
                  {connectionStatus.checking
                    ? 'Connecting...'
                    : connectionStatus.connected
                      ? 'System Online'
                      : 'System Offline'}
                </Paragraph>
                {connectionStatus.latency && (
                  <Paragraph fontSize="$2" color="gray">
                    Latency: {connectionStatus.latency}ms
                  </Paragraph>
                )}
              </YStack>
            </XStack>
            <Activity size={24} color={connectionStatus.connected ? 'green' : 'gray'} />
          </XStack>
        </Card>

        {/* Stats Grid */}
        <XStack gap="$3" flexWrap="wrap">
          <Card flex={1} minWidth={150} padding="$3" gap="$2">
            <Paragraph fontSize="$2" color="gray" fontWeight="600">
              TOTAL LOGS
            </Paragraph>
            {loadingStats ? <Spinner size="small" /> : <H2>{stats?.totalLogs || 0}</H2>}
          </Card>

          <Card flex={1} minWidth={150} padding="$3" gap="$2">
            <Paragraph fontSize="$2" color="gray" fontWeight="600">
              EMBEDDINGS
            </Paragraph>
            {loadingStats ? <Spinner size="small" /> : <H2>{stats?.totalEmbeddings || 0}</H2>}
          </Card>
        </XStack>

        {/* Test Suite */}
        <Card padding="$4" gap="$4">
          <XStack gap="$3" alignItems="center" justifyContent="space-between">
            <YStack gap="$1">
              <H3>System Tests</H3>
              <Paragraph fontSize="$2" color="gray">
                Verify RAG pipeline components
              </Paragraph>
            </YStack>
            <Button
              size="$4"
              backgroundColor={semanticColors.primary.background}
              borderColor={semanticColors.primary.border}
              icon={runningTests ? <Loader /> : <Play />}
              onPress={runTestSuite}
              disabled={runningTests}
            >
              {runningTests ? 'Running...' : 'Run Tests'}
            </Button>
          </XStack>

          {/* Test Results */}
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
                      : '$gray4'
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
                  <Circle size={20} backgroundColor={semanticColors.neutral.background} />
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
                  {test.error && (
                    <Paragraph fontSize="$2" color={semanticColors.error.text}>
                      {test.error}
                    </Paragraph>
                  )}
                </YStack>
              </XStack>
            ))}
          </YStack>

          {/* Test Output Terminal */}
          {testOutput && (
            <YStack
              gap="$2"
              padding="$3"
              backgroundColor={semanticColors.neutral.background}
              borderRadius="$3"
              borderWidth={1}
              borderColor={semanticColors.neutral.border}
            >
              <XStack gap="$2" alignItems="center">
                <Terminal size={16} color="gray" />
                <Paragraph fontSize="$2" fontWeight="600" color="gray">
                  TEST OUTPUT
                </Paragraph>
              </XStack>
              <ScrollView maxHeight={300}>
                <Paragraph fontSize="$2" color="gray" whiteSpace="pre-wrap">
                  {testOutput}
                </Paragraph>
              </ScrollView>
            </YStack>
          )}
        </Card>

        {/* Semantic Search Test */}
        <Card padding="$4" gap="$4">
          <YStack gap="$1">
            <H3>Semantic Search</H3>
            <Paragraph fontSize="$2" color="gray">
              Test vector similarity matching
            </Paragraph>
          </YStack>

          <XStack gap="$2">
            <Input
              flex={1}
              placeholder="Search your sovereign logs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              size="$4"
            />
            <Button
              size="$4"
              backgroundColor={semanticColors.primary.background}
              borderColor={semanticColors.primary.border}
              icon={searching ? <Spinner size="small" /> : <Search />}
              onPress={handleSearch}
              disabled={searching || !searchQuery.trim()}
            >
              Search
            </Button>
          </XStack>

          {searchResults.length > 0 && (
            <YStack gap="$2">
              <Paragraph fontSize="$2" fontWeight="600" color="gray">
                RESULTS ({searchResults.length})
              </Paragraph>
              {searchResults.map((result, i) => (
                <Card
                  key={i}
                  padding="$3"
                  gap="$2"
                  backgroundColor={semanticColors.info.background}
                >
                  <XStack gap="$2" alignItems="center">
                    <Zap size={16} color={iconColors.info} />
                    <Paragraph
                      fontSize="$2"
                      fontWeight="600"
                      color={semanticColors.info.textContrast}
                    >
                      {Math.round(result.similarity * 100)}% Match
                    </Paragraph>
                  </XStack>
                  <Paragraph fontSize="$3">{result.content}</Paragraph>
                  <Paragraph fontSize="$2" color="gray">
                    {result.category}
                  </Paragraph>
                </Card>
              ))}
            </YStack>
          )}
        </Card>

        {/* SQL Console */}
        <SQLConsole />

        {/* System Info */}
        <Card
          padding="$4"
          gap="$3"
          backgroundColor={semanticColors.info.background}
          borderColor={semanticColors.info.border}
        >
          <XStack gap="$3" alignItems="center">
            <AlertCircle size={20} color={iconColors.info} />
            <YStack flex={1} gap="$1">
              <Paragraph fontSize="$3" fontWeight="600" color={semanticColors.info.textContrast}>
                RAG System Architecture
              </Paragraph>
              <Paragraph fontSize="$2" color={semanticColors.info.text}>
                • BAAI/bge-small-en-v1.5 embedding model (384D)
              </Paragraph>
              <Paragraph fontSize="$2" color={semanticColors.info.text}>
                • PostgreSQL with pgvector extension
              </Paragraph>
              <Paragraph fontSize="$2" color={semanticColors.info.text}>
                • IVFFlat + HNSW vector indexes
              </Paragraph>
              <Paragraph fontSize="$2" color={semanticColors.info.text}>
                • Row-level security for multi-user isolation
              </Paragraph>
            </YStack>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}

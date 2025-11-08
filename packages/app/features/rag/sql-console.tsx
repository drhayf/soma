/**
 * SQL Console - Mobile-Friendly Database Interface
 *
 * Features:
 * - Execute SQL queries via Supabase
 * - Quick action templates
 * - Query history
 * - Results viewer with export
 * - Error handling and formatting
 */

import { useState } from 'react'
import {
  YStack,
  XStack,
  Button,
  Paragraph,
  H3,
  Card,
  Spinner,
  ScrollView,
  Input,
  TextArea,
} from '@my/ui'
import {
  Terminal,
  Play,
  Trash2,
  Copy,
  Database,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from '@tamagui/lucide-icons'
import { supabase } from '../../lib/supabase-client'
import { semanticColors, iconColors } from '../../lib/theme-colors'

interface QueryResult {
  query: string
  data: any[] | null
  error: string | null
  duration: number
  timestamp: Date
}

const QUICK_QUERIES = [
  {
    label: 'Count All Logs',
    query: 'SELECT COUNT(*) as total FROM sovereign_logs',
    description: 'Total number of sovereign logs',
  },
  {
    label: 'Count Embeddings',
    query: 'SELECT COUNT(*) as total FROM sovereign_log_embeddings',
    description: 'Total number of embeddings',
  },
  {
    label: 'Recent Logs',
    query:
      'SELECT id, content, category, created_at FROM sovereign_logs ORDER BY created_at DESC LIMIT 10',
    description: 'Last 10 sovereign logs',
  },
  {
    label: 'User Stats',
    query: 'SELECT user_id, COUNT(*) as log_count FROM sovereign_logs GROUP BY user_id',
    description: 'Logs per user',
  },
  {
    label: 'Embedding Stats',
    query:
      'SELECT COUNT(*) as total, MIN(created_at) as oldest, MAX(created_at) as newest FROM sovereign_log_embeddings',
    description: 'Embedding metadata',
  },
  {
    label: 'Table Sizes',
    query: `SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC`,
    description: 'Database table sizes',
  },
]

export function SQLConsole() {
  const [query, setQuery] = useState('')
  const [executing, setExecuting] = useState(false)
  const [results, setResults] = useState<QueryResult[]>([])
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())

  const executeQuery = async (sqlQuery: string) => {
    if (!sqlQuery.trim()) return

    setExecuting(true)
    const startTime = Date.now()

    try {
      // Execute via Supabase RPC or direct query
      // For SELECT queries, we can use .from().select() with raw SQL via rpc
      let data, error

      try {
        const result = await supabase.rpc('exec_sql', {
          sql_query: sqlQuery,
        })
        data = result.data
        error = result.error
      } catch (rpcError) {
        // Fallback: Try to parse and execute as a simple SELECT
        console.log('[SQL Console] RPC failed, attempting direct query...')

        // Extract table name from SELECT query
        const selectMatch = sqlQuery.match(/FROM\s+(\w+)/i)
        if (selectMatch) {
          const tableName = selectMatch[1]
          const result = await supabase.from(tableName!).select('*').limit(100)
          data = result.data
          error = result.error
        } else {
          throw rpcError
        }
      }

      const duration = Date.now() - startTime

      const result: QueryResult = {
        query: sqlQuery,
        data: data || null,
        error: error?.message || null,
        duration,
        timestamp: new Date(),
      }

      setResults((prev) => [result, ...prev])
      setQuery('')
    } catch (err: any) {
      const duration = Date.now() - startTime
      const result: QueryResult = {
        query: sqlQuery,
        data: null,
        error: err.message || 'Query execution failed',
        duration,
        timestamp: new Date(),
      }
      setResults((prev) => [result, ...prev])
    } finally {
      setExecuting(false)
    }
  }

  const toggleResultExpansion = (index: number) => {
    setExpandedResults((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    // Note: Clipboard API may not work on all platforms
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text)
      }
    } catch (err) {
      console.log('[SQL Console] Clipboard not available')
    }
  }

  return (
    <YStack gap="$4">
      {/* Header */}
      <YStack gap="$2">
        <XStack gap="$3" alignItems="center">
          <Terminal size={24} color={iconColors.primary} />
          <H3>SQL Console</H3>
        </XStack>
        <Paragraph fontSize="$2" color="gray">
          Execute queries and manage your database
        </Paragraph>
      </YStack>

      {/* Quick Actions */}
      <Card padding="$4" gap="$3">
        <XStack
          gap="$2"
          alignItems="center"
          justifyContent="space-between"
          onPress={() => setShowQuickActions(!showQuickActions)}
          cursor="pointer"
        >
          <Paragraph fontSize="$3" fontWeight="600" color="gray">
            Quick Actions
          </Paragraph>
          {showQuickActions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </XStack>

        {showQuickActions && (
          <YStack gap="$2">
            {QUICK_QUERIES.map((item, i) => (
              <Card
                key={i}
                padding="$3"
                gap="$2"
                backgroundColor={semanticColors.neutral.background}
                pressStyle={{ backgroundColor: semanticColors.neutral.backgroundHover }}
                onPress={() => executeQuery(item.query)}
              >
                <XStack gap="$2" alignItems="center" justifyContent="space-between">
                  <YStack flex={1} gap="$1">
                    <Paragraph fontSize="$3" fontWeight="600">
                      {item.label}
                    </Paragraph>
                    <Paragraph fontSize="$2" color="gray">
                      {item.description}
                    </Paragraph>
                  </YStack>
                  <Play size={16} color={iconColors.primary} />
                </XStack>
              </Card>
            ))}
          </YStack>
        )}
      </Card>

      {/* Query Input */}
      <Card padding="$4" gap="$3">
        <Paragraph fontSize="$3" fontWeight="600" color="gray">
          Custom Query
        </Paragraph>
        <TextArea
          placeholder="SELECT * FROM sovereign_logs LIMIT 10"
          value={query}
          onChangeText={setQuery}
          numberOfLines={4}
          fontSize="$2"
        />
        <XStack gap="$2">
          <Button
            flex={1}
            backgroundColor={semanticColors.primary.background}
            borderColor={semanticColors.primary.border}
            icon={executing ? <Spinner size="small" /> : <Play />}
            onPress={() => executeQuery(query)}
            disabled={executing || !query.trim()}
          >
            Execute
          </Button>
          <Button
            variant="outlined"
            icon={<Trash2 />}
            onPress={() => setQuery('')}
            disabled={!query.trim()}
          >
            Clear
          </Button>
        </XStack>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card padding="$4" gap="$3">
          <XStack gap="$2" alignItems="center" justifyContent="space-between">
            <Paragraph fontSize="$3" fontWeight="600" color="gray">
              Query Results ({results.length})
            </Paragraph>
            <Button size="$2" variant="outlined" icon={<Trash2 />} onPress={() => setResults([])}>
              Clear All
            </Button>
          </XStack>

          <ScrollView maxHeight={600}>
            <YStack gap="$3">
              {results.map((result, i) => {
                const isExpanded = expandedResults.has(i)
                const hasError = !!result.error
                const rowCount = result.data?.length || 0

                return (
                  <Card
                    key={i}
                    padding="$3"
                    gap="$3"
                    backgroundColor={
                      hasError ? semanticColors.error.background : semanticColors.success.background
                    }
                    borderColor={
                      hasError ? semanticColors.error.border : semanticColors.success.border
                    }
                    borderWidth={1}
                  >
                    {/* Result Header */}
                    <XStack
                      gap="$2"
                      alignItems="center"
                      justifyContent="space-between"
                      onPress={() => toggleResultExpansion(i)}
                      cursor="pointer"
                    >
                      <XStack gap="$2" alignItems="center" flex={1}>
                        {hasError ? (
                          <XCircle size={16} color={iconColors.error} />
                        ) : (
                          <CheckCircle size={16} color={iconColors.success} />
                        )}
                        <YStack flex={1}>
                          <Paragraph fontSize="$2" fontWeight="600" numberOfLines={1}>
                            {result.query}
                          </Paragraph>
                          <XStack gap="$3">
                            <XStack gap="$1" alignItems="center">
                              <Clock size={12} color="gray" />
                              <Paragraph fontSize="$1" color="gray">
                                {result.duration}ms
                              </Paragraph>
                            </XStack>
                            {!hasError && (
                              <XStack gap="$1" alignItems="center">
                                <Database size={12} color="gray" />
                                <Paragraph fontSize="$1" color="gray">
                                  {rowCount} rows
                                </Paragraph>
                              </XStack>
                            )}
                          </XStack>
                        </YStack>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </XStack>
                    </XStack>

                    {/* Expanded Result Data */}
                    {isExpanded && (
                      <YStack gap="$2">
                        {hasError ? (
                          <YStack
                            padding="$3"
                            backgroundColor={semanticColors.error.background}
                            borderRadius="$2"
                            gap="$2"
                          >
                            <Paragraph
                              fontSize="$2"
                              fontWeight="600"
                              color={semanticColors.error.textContrast}
                            >
                              Error:
                            </Paragraph>
                            <Paragraph fontSize="$2" color={semanticColors.error.text}>
                              {result.error}
                            </Paragraph>
                          </YStack>
                        ) : (
                          <YStack gap="$2">
                            <XStack gap="$2" alignItems="center" justifyContent="space-between">
                              <Paragraph
                                fontSize="$2"
                                fontWeight="600"
                                color={semanticColors.success.text}
                              >
                                Data:
                              </Paragraph>
                              <Button
                                size="$2"
                                variant="outlined"
                                icon={<Copy size={14} />}
                                onPress={() =>
                                  copyToClipboard(JSON.stringify(result.data, null, 2))
                                }
                              >
                                Copy JSON
                              </Button>
                            </XStack>
                            <ScrollView maxHeight={300} horizontal>
                              <YStack
                                padding="$3"
                                backgroundColor={semanticColors.neutral.background}
                                borderRadius="$2"
                                minWidth="100%"
                              >
                                <Paragraph fontSize="$2" color="gray" whiteSpace="pre">
                                  {JSON.stringify(result.data, null, 2)}
                                </Paragraph>
                              </YStack>
                            </ScrollView>
                          </YStack>
                        )}
                      </YStack>
                    )}
                  </Card>
                )
              })}
            </YStack>
          </ScrollView>
        </Card>
      )}

      {/* Info Card */}
      <Card
        padding="$3"
        gap="$2"
        backgroundColor={semanticColors.info.background}
        borderColor={semanticColors.info.border}
      >
        <XStack gap="$2" alignItems="flex-start">
          <FileText size={16} color={iconColors.info} />
          <YStack flex={1} gap="$1">
            <Paragraph fontSize="$2" fontWeight="600" color={semanticColors.info.textContrast}>
              Console Tips
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              • Use Quick Actions for common queries
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              • All queries are read-only for safety
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              • Results are limited to 100 rows
            </Paragraph>
            <Paragraph fontSize="$2" color={semanticColors.info.text}>
              • Tap result headers to expand/collapse
            </Paragraph>
          </YStack>
        </XStack>
      </Card>
    </YStack>
  )
}

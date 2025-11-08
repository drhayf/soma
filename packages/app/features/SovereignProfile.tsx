/**
 * Sovereign Profile Dashboard
 *
 * Comprehensive visual interface showing real-time synthesis of ALL systems:
 * - Human Design Blueprint
 * - Astrological Transits & Natal Chart
 * - HealthKit Vessel Metrics
 * - Cosmic Cycles (Solar/Lunar)
 * - RAG Learning System Status
 *
 * PURPOSE: Build trust through transparency. Show the user EXACTLY how the app
 * understands them, processes their data, and synthesizes insights.
 */

import { useState, useEffect } from 'react'
import { YStack, XStack, H2, H3, H4, Text, ScrollView, Separator, Circle, Progress } from '@my/ui'
import { AnimatedCard } from '../components/AnimatedCard'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { useSovereignPathStore } from '../lib/store'
import { useHealthData } from '../hooks/useHealthData'
import { useCosmicData, formatCosmicDataForAI } from '../hooks/useCosmicData'
import { useAstrologyData, extractKeyInsights } from '../hooks/useAstrologyData'
import type { HumanDesignChart } from '../lib/hdkit/types'
import type { CosmicData, AstrologicalInsight } from '../types'
import { semanticColors, statusColors } from '../lib/theme-colors'

interface SystemHealthStatus {
  humanDesign: { active: boolean; lastUpdated: string | null }
  astrology: { active: boolean; lastUpdated: string | null }
  healthKit: { active: boolean; lastSync: string | null }
  cosmic: { active: boolean; lastFetch: string | null }
  rag: { active: boolean; vectorCount: number }
}

export function SovereignProfile() {
  const { humanDesignChart, birthData } = useSovereignPathStore()
  const {
    metrics: healthMetrics,
    isLoading: healthLoading,
    requestPermissions,
    fetchDailySummary,
    isAvailable,
  } = useHealthData()
  const { data: cosmicData, loading: cosmicLoading, refetch: refetchCosmic } = useCosmicData({})

  const [astrologyData, setAstrologyData] = useState<AstrologicalInsight | null>(null)
  const [astrologyLoading, setAstrologyLoading] = useState(false)
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus>({
    humanDesign: { active: false, lastUpdated: null },
    astrology: { active: false, lastUpdated: null },
    healthKit: { active: false, lastSync: null },
    cosmic: { active: false, lastFetch: null },
    rag: { active: false, vectorCount: 0 },
  })

  // Fetch astrology data on mount if birth data available
  useEffect(() => {
    if (birthData) {
      fetchAstrologyData()
    }
  }, [humanDesignChart])

  const fetchAstrologyData = async () => {
    if (!birthData) return

    setAstrologyLoading(true)
    try {
      // Convert BirthData format to astrology API format
      const dateObj = new Date(birthData.date)
      const [hour, minute] = birthData.time.split(':').map(Number)

      const response = await fetch('/api/astrology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthData: {
            year: dateObj.getFullYear(),
            month: dateObj.getMonth() + 1,
            day: dateObj.getDate(),
            hour: hour || 12,
            minute: minute || 0,
            city: 'New York', // TODO: Reverse geocode from lat/long
            country_code: 'US',
          },
          analysisType: 'all',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAstrologyData(data)
      }
    } catch (error) {
      console.error('[SovereignProfile] Astrology fetch error:', error)
    } finally {
      setAstrologyLoading(false)
    }
  }

  // Update system health status
  useEffect(() => {
    setSystemHealth({
      humanDesign: {
        active: !!humanDesignChart,
        lastUpdated: birthData ? new Date(birthData.date).toISOString() : null,
      },
      astrology: {
        active: !!astrologyData,
        lastUpdated: astrologyData?.cached_at || null,
      },
      healthKit: {
        active: !!healthMetrics,
        lastSync: healthMetrics?.lastSync || null,
      },
      cosmic: {
        active: !!cosmicData,
        lastFetch: cosmicData?.cached_at || null,
      },
      rag: {
        active: false, // Will be updated via API call
        vectorCount: 0,
      },
    })
  }, [humanDesignChart, astrologyData, healthMetrics, cosmicData])

  const astrologyInsights = astrologyData ? extractKeyInsights(astrologyData) : null

  return (
    <ScrollView>
      <YStack flex={1} padding="$4" paddingBottom="$20" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <H2>Sovereign Profile</H2>
          <Text color="$color11" fontSize="$3">
            Real-time synthesis of all systems understanding your consciousness
          </Text>
        </YStack>

        <Separator />

        {/* System Health Overview */}
        <AnimatedCard>
          <YStack gap="$3">
            <H3>System Health</H3>
            <Text color="$color11" fontSize="$2">
              Live status of all integrated frameworks
            </Text>

            <YStack gap="$2" marginTop="$2">
              <SystemHealthRow
                label="Human Design Blueprint"
                active={systemHealth.humanDesign.active}
                lastUpdated={systemHealth.humanDesign.lastUpdated}
                icon="🧬"
              />
              <SystemHealthRow
                label="Astrological Transits"
                active={systemHealth.astrology.active}
                lastUpdated={systemHealth.astrology.lastUpdated}
                icon="⭐"
              />
              <SystemHealthRow
                label="HealthKit Vessel Metrics"
                active={systemHealth.healthKit.active}
                lastUpdated={systemHealth.healthKit.lastSync}
                icon="💪"
              />
              <SystemHealthRow
                label="Cosmic Cycles (Solar/Lunar)"
                active={systemHealth.cosmic.active}
                lastUpdated={systemHealth.cosmic.lastFetch}
                icon="🌙"
              />
              <SystemHealthRow
                label="RAG Learning System"
                active={systemHealth.rag.active}
                lastUpdated={null}
                icon="🧠"
                extraInfo={`${systemHealth.rag.vectorCount} logs vectorized`}
              />
            </YStack>
          </YStack>
        </AnimatedCard>

        {/* Current State Synthesis */}
        <AnimatedCard>
          <YStack gap="$3">
            <H3>Current State (Today)</H3>
            <Text color="$color11" fontSize="$2">
              Multi-dimensional snapshot of your present moment
            </Text>

            <Separator marginVertical="$2" />

            {/* Blueprint State */}
            {humanDesignChart && (
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$6">🧬</Text>
                  <H4>Blueprint (Human Design)</H4>
                </XStack>
                <YStack gap="$1" marginLeft="$6">
                  <Text fontSize="$3" color="$color12">
                    Type: <Text fontWeight="bold">{humanDesignChart.type}</Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Strategy: <Text fontWeight="bold">{humanDesignChart.strategy}</Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Authority: <Text fontWeight="bold">{humanDesignChart.authority}</Text>
                  </Text>
                  <Text fontSize="$2" color="$color10" marginTop="$1">
                    {
                      Object.entries(humanDesignChart.centers || {}).filter(
                        ([_, defined]) => defined
                      ).length
                    }{' '}
                    defined centers •{' '}
                    {
                      Object.entries(humanDesignChart.centers || {}).filter(
                        ([_, defined]) => !defined
                      ).length
                    }{' '}
                    open centers
                  </Text>
                </YStack>
              </YStack>
            )}

            <Separator marginVertical="$2" />

            {/* Astrological State */}
            {astrologyInsights && (
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$6">⭐</Text>
                  <H4>Planetary Alignment</H4>
                </XStack>
                <YStack gap="$1" marginLeft="$6">
                  <Text fontSize="$3" color="$color12">
                    Current Energy: <Text fontWeight="bold">{astrologyInsights.currentEnergy}</Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Key Transit: <Text fontWeight="bold">{astrologyInsights.keyTransit}</Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Lunar Phase: <Text fontWeight="bold">{astrologyInsights.lunarPhase}</Text>
                  </Text>
                  <XStack alignItems="center" gap="$2" marginTop="$2">
                    <Text fontSize="$2" color="$color10">
                      Favorability Score:
                    </Text>
                    <XStack alignItems="center" gap="$1">
                      <AnimatedNumber
                        value={astrologyInsights.favorabilityScore}
                        fontSize={16}
                        fontWeight="bold"
                      />
                      <Text fontSize="$3" fontWeight="bold">
                        / 10
                      </Text>
                    </XStack>
                  </XStack>
                  <Progress
                    value={astrologyInsights.favorabilityScore * 10}
                    max={100}
                    marginTop="$1"
                  >
                    <Progress.Indicator
                      animation="bouncy"
                      backgroundColor={semanticColors.success.border}
                    />
                  </Progress>
                </YStack>
              </YStack>
            )}

            <Separator marginVertical="$2" />

            {/* Vessel State (HealthKit) */}
            {healthMetrics && (
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$6">💪</Text>
                  <H4>Vessel Metrics</H4>
                </XStack>
                <YStack gap="$1" marginLeft="$6">
                  <Text fontSize="$3" color="$color12">
                    Steps Today:{' '}
                    <Text fontWeight="bold">{healthMetrics.steps.toLocaleString()}</Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Sleep (last night):{' '}
                    <Text fontWeight="bold">{healthMetrics.sleepHours.toFixed(1)} hours</Text>
                  </Text>
                  {healthMetrics.walkingAsymmetry !== null && (
                    <Text fontSize="$3" color="$color12">
                      Walking Asymmetry:{' '}
                      <Text fontWeight="bold">{healthMetrics.walkingAsymmetry.toFixed(1)}%</Text>
                    </Text>
                  )}
                  <Text fontSize="$2" color="$color10" marginTop="$1">
                    Last sync: {new Date(healthMetrics.lastSync).toLocaleString()}
                  </Text>
                </YStack>
              </YStack>
            )}

            <Separator marginVertical="$2" />

            {/* Cosmic State */}
            {cosmicData && (
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$6">🌙</Text>
                  <H4>Cosmic Cycles</H4>
                </XStack>
                <YStack gap="$1" marginLeft="$6">
                  <Text fontSize="$3" color="$color12">
                    Moon Phase: <Text fontWeight="bold">{cosmicData.astronomy.moon_phase}</Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Moon Illumination:{' '}
                    <Text fontWeight="bold">
                      {cosmicData.astronomy.moon_illumination_percentage}
                    </Text>
                  </Text>
                  <Text fontSize="$3" color="$color12">
                    Day Length: <Text fontWeight="bold">{cosmicData.astronomy.day_length}</Text>
                  </Text>
                  <Text fontSize="$2" color="$color10" marginTop="$1">
                    Sunrise: {cosmicData.astronomy.sunrise} • Sunset: {cosmicData.astronomy.sunset}
                  </Text>
                </YStack>
              </YStack>
            )}
          </YStack>
        </AnimatedCard>

        {/* How The System Sees You */}
        <AnimatedCard>
          <YStack gap="$3">
            <H3>How The System Sees You</H3>
            <Text color="$color11" fontSize="$2">
              AI-generated synthesis of your multi-dimensional profile
            </Text>

            <Separator marginVertical="$2" />

            <YStack gap="$3">
              {/* Blueprint Interpretation */}
              {humanDesignChart && (
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="bold" color="$color12">
                    🧬 Blueprint Understanding
                  </Text>
                  <Text fontSize="$3" color="$color11" lineHeight={22}>
                    {getBlueprintInterpretation(humanDesignChart)}
                  </Text>
                </YStack>
              )}

              {/* Astrological Interpretation */}
              {astrologyData && (
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="bold" color="$color12">
                    ⭐ Current Planetary Influence
                  </Text>
                  <Text fontSize="$3" color="$color11" lineHeight={22}>
                    {getAstrologyInterpretation(astrologyData, astrologyInsights)}
                  </Text>
                </YStack>
              )}

              {/* Synthesis */}
              {humanDesignChart && astrologyData && (
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="bold" color="$color12">
                    🔮 Blueprint × Transit Synthesis
                  </Text>
                  <Text fontSize="$3" color="$color11" lineHeight={22}>
                    {getSynthesisInterpretation(humanDesignChart, astrologyData, astrologyInsights)}
                  </Text>
                </YStack>
              )}
            </YStack>
          </YStack>
        </AnimatedCard>

        {/* Data Processing Transparency */}
        <AnimatedCard>
          <YStack gap="$3">
            <H3>Data Processing & Privacy</H3>
            <Text color="$color11" fontSize="$2">
              How your information is used
            </Text>

            <Separator marginVertical="$2" />

            <YStack gap="$2">
              <DataProcessingRow
                icon="🧠"
                label="RAG Learning System"
                description="Your logs are converted to 384-dimensional vectors and stored in Supabase. Used for semantic search to find relevant patterns."
              />
              <DataProcessingRow
                icon="💬"
                label="AI Chat Enhancement"
                description="Top 5 most relevant logs are retrieved and prepended to chat context for personalized, context-aware responses."
              />
              <DataProcessingRow
                icon="🎯"
                label="Daily Attunement"
                description="Synthesizes last 7 days of logs + HealthKit + Blueprint + Transits to generate one provocative Q&A per day."
              />
              <DataProcessingRow
                icon="🔒"
                label="Privacy"
                description="All data stays in your Supabase instance. API keys are server-side only. No third-party tracking."
              />
            </YStack>
          </YStack>
        </AnimatedCard>
      </YStack>
    </ScrollView>
  )
}

// Helper Components

function SystemHealthRow({
  label,
  active,
  lastUpdated,
  icon,
  extraInfo,
}: {
  label: string
  active: boolean
  lastUpdated: string | null
  icon: string
  extraInfo?: string
}) {
  return (
    <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2">
      <XStack alignItems="center" gap="$2" flex={1}>
        <Text fontSize="$5">{icon}</Text>
        <YStack flex={1}>
          <Text fontSize="$3" color="$color12">
            {label}
          </Text>
          {extraInfo && (
            <Text fontSize="$2" color="$color10">
              {extraInfo}
            </Text>
          )}
        </YStack>
      </XStack>
      <XStack alignItems="center" gap="$2">
        <Circle
          size={8}
          backgroundColor={active ? statusColors.online : '$gray6'}
          animation="quick"
          opacity={active ? 1 : 0.5}
        />
        <Text fontSize="$2" color="$color10" width={100} textAlign="right">
          {lastUpdated ? formatRelativeTime(lastUpdated) : 'Not synced'}
        </Text>
      </XStack>
    </XStack>
  )
}

function DataProcessingRow({
  icon,
  label,
  description,
}: {
  icon: string
  label: string
  description: string
}) {
  return (
    <XStack gap="$2" paddingVertical="$2">
      <Text fontSize="$5">{icon}</Text>
      <YStack flex={1} gap="$1">
        <Text fontSize="$3" fontWeight="bold" color="$color12">
          {label}
        </Text>
        <Text fontSize="$2" color="$color11" lineHeight={20}>
          {description}
        </Text>
      </YStack>
    </XStack>
  )
}

// Helper Functions

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return past.toLocaleDateString()
}

function getBlueprintInterpretation(chart: HumanDesignChart): string {
  const { type, strategy, authority } = chart

  const interpretations: Record<string, string> = {
    Generator:
      'You are designed to be a sustainable energy powerhouse. Your Sacral Center responds with gut-level "yes/no" to opportunities. When aligned with your strategy (Wait to Respond), you experience deep satisfaction. When forcing or initiating, you hit frustration and energy depletion.',
    'Manifesting Generator':
      'You are a multi-passionate, fast-moving Generator with Manifestor qualities. Your strategy is to Wait to Respond, then Inform before acting. You can skip steps and move quickly once lit up. Frustration signals misalignment; satisfaction signals flow.',
    Projector:
      'You are designed to guide and manage energy, not generate it. Your strategy is to Wait for Invitation (especially for major life decisions). When recognized and invited, you experience success. When uninvited or pushing, you burn out and feel bitter.',
    Manifestor:
      'You are designed to initiate and impact. Your strategy is to Inform before acting (not ask permission—just inform). This reduces resistance. When aligned, you experience peace. When not informing, you hit anger and resistance.',
    Reflector:
      'You are the rarest type, designed to reflect the health of your community. Your strategy is to Wait a Full Lunar Cycle (28 days) before major decisions. You are deeply sensitive to your environment and need the right people around you.',
  }

  return interpretations[type] || `You are a ${type}. Your strategy is ${strategy}.`
}

function getAstrologyInterpretation(
  astrology: AstrologicalInsight,
  insights: ReturnType<typeof extractKeyInsights> | null
): string {
  if (!insights) return 'Astrological data is being processed.'

  const score = insights.favorabilityScore

  if (score >= 8) {
    return `Current planetary configuration is highly favorable (${score}/10). The cosmos has opened a window of opportunity. Your vital energy is amplified. This is a time to respond to what lights you up, take aligned action, and plant seeds for future growth.`
  } else if (score >= 6) {
    return `Planetary configuration is moderately favorable (${score}/10). Energy is available but requires conscious direction. Stay aligned with your strategy and authority. Avoid forcing outcomes; respond to genuine invitations and opportunities.`
  } else if (score >= 4) {
    return `Planetary configuration is neutral (${score}/10). Energy is available but not amplified. Focus on consistency, rest, and preparation. This is not a time to push or force—observe, reflect, and stay ready for the next window.`
  } else {
    return `Planetary configuration indicates caution (${score}/10). Cosmic headwinds are present. This is a time for introspection, rest, and releasing what no longer serves. Avoid major decisions or initiations. Trust the ebb as much as the flow.`
  }
}

function getSynthesisInterpretation(
  chart: HumanDesignChart,
  astrology: AstrologicalInsight,
  insights: ReturnType<typeof extractKeyInsights> | null
): string {
  if (!insights) return 'Synthesis is being calculated.'

  const { type } = chart
  const score = insights.favorabilityScore

  if (type === 'Generator' || type === 'Manifesting Generator') {
    if (score >= 7) {
      return `Your Sacral energy is cosmically amplified right now. As a ${type}, this is your time to RESPOND to everything that lights you up. The universe is saying YES—but you must still honor your strategy (Wait to Respond), not force or initiate.`
    } else if (score <= 4) {
      return `Your Sacral energy is encountering cosmic resistance. As a ${type}, this is NOT a time to push. Rest, recharge, and wait for the right opportunities to respond to. Forcing now will lead to frustration and depletion.`
    }
  }

  if (type === 'Projector') {
    if (score >= 7) {
      return `Planetary alignment favors recognition and invitation. As a ${type}, this is a window where the right people are more likely to SEE you. Stay visible, share your wisdom, but still wait for genuine invitations—don't push.`
    } else if (score <= 4) {
      return `Cosmic energy is not favorable for outward action. As a ${type}, this is a time to rest deeply, study, and prepare. You cannot force recognition. Trust that the next invitation is coming when the cosmos shifts.`
    }
  }

  return `Your ${type} blueprint is navigating a ${score}/10 cosmic favorability window. Stay aligned with your strategy (${chart.strategy}) and honor the current planetary rhythm.`
}

/**
 * Expo Dashboard Screen (Home)
 * Displays Daily Rhythm cards, Compliance Tracker, and Daily Focus (Sovereign Guide)
 */

import { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, H1, H2, H3, Paragraph, Button, Card, XStack, Progress } from '@my/ui'
import { Flame, Sun, Moon, Trophy, Sparkles } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import {
  useProgressStore,
  useAchievementStore,
  AnimatedCard,
  AnimatedNumber,
  FLOATING_NAV_HEIGHT,
  DailyAttunement,
} from 'app'
import { getDailyFocus } from 'app/lib/daily-focus'

export default function DashboardScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const complianceStreak = useProgressStore((state) => state.complianceStreak)
  const lastCompletedDate = useProgressStore((state) => state.lastCompletedDate)
  const achievements = useAchievementStore((state) => state.achievements)
  const [dailyFocus, setDailyFocus] = useState(getDailyFocus())

  // Calculate top padding: safe area + widget height + spacing
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8

  // Calculate achievement stats
  const totalAchievements = achievements.length
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const progressPercent =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0
  const recentUnlock = achievements
    .filter((a) => a.unlocked && a.unlockedDate)
    .sort((a, b) => new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime())[0]

  // Update Daily Focus every minute to reflect time changes
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyFocus(getDailyFocus())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const handleMorningRoutine = () => {
    router.push('/routines?routine=morning')
  }

  const handleEveningRoutine = () => {
    router.push('/routines?routine=evening')
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: FLOATING_NAV_HEIGHT }}>
      <YStack flex={1} padding="$4" paddingTop={topPadding} gap="$4" backgroundColor="$background">
        {/* Header */}
        <YStack gap="$2">
          <H1>Somatic Alignment</H1>
          <Paragraph opacity={0.7} size="$5">
            Your Daily Practice for Peak Integration
          </Paragraph>
        </YStack>

        {/* Compliance Tracker */}
        <AnimatedCard elevate size="$4" bordered staggerIndex={0}>
          <Card.Header>
            <XStack alignItems="center" gap="$3">
              <Flame size={40} color="#f97316" />
              <YStack flex={1}>
                <AnimatedNumber value={complianceStreak} color="#52a868" />
                <Paragraph opacity={0.8} size="$4">
                  Day{complianceStreak !== 1 ? 's' : ''} of Alignment
                </Paragraph>
              </YStack>
            </XStack>
          </Card.Header>
          {lastCompletedDate && (
            <Card.Footer padded>
              <Paragraph size="$3" opacity={0.6}>
                Last completed: {new Date(lastCompletedDate).toLocaleDateString()}
              </Paragraph>
            </Card.Footer>
          )}
        </AnimatedCard>

        {/* Achievement Progress */}
        <AnimatedCard
          elevate
          size="$4"
          bordered
          backgroundColor="$backgroundHover"
          pressScale={0.98}
          onPress={() => router.push('/progress')}
          staggerIndex={1}
        >
          <Card.Header>
            <XStack alignItems="center" gap="$3">
              <Trophy size={32} color="#52a868" />
              <YStack flex={1}>
                <H3 size="$6">Achievements</H3>
                <Paragraph opacity={0.8} size="$3">
                  {unlockedCount} of {totalAchievements} unlocked
                </Paragraph>
              </YStack>
            </XStack>
          </Card.Header>
          <Card.Footer padded>
            <YStack gap="$2">
              <Progress value={progressPercent} max={100} size="$3">
                <Progress.Indicator animation="bouncy" backgroundColor="green" />
              </Progress>
              {recentUnlock && (
                <XStack gap="$2" alignItems="center" marginTop="$2">
                  <Paragraph size="$3" opacity={0.7}>
                    Latest:
                  </Paragraph>
                  <Paragraph size="$3" fontWeight="600">
                    {recentUnlock.icon} {recentUnlock.name}
                  </Paragraph>
                </XStack>
              )}
              {!recentUnlock && (
                <Paragraph size="$3" opacity={0.7} textAlign="center">
                  Complete your first routine to unlock achievements!
                </Paragraph>
              )}
            </YStack>
          </Card.Footer>
        </AnimatedCard>

        {/* Daily Focus - The Sovereign Guide */}
        <AnimatedCard
          elevate
          size="$4"
          bordered
          backgroundColor="$backgroundHover"
          staggerIndex={2}
        >
          <Card.Header>
            <XStack alignItems="center" gap="$2">
              <Sparkles size={24} color={dailyFocus.color as any} />
              <YStack flex={1}>
                <H3 size="$6" color={dailyFocus.color as any}>
                  {dailyFocus.phase}
                </H3>
                <Paragraph opacity={0.6} size="$2" textTransform="uppercase">
                  {dailyFocus.timeOfDay} • Daily Focus
                </Paragraph>
              </YStack>
            </XStack>
          </Card.Header>
          <Card.Footer padded>
            <Paragraph size="$4" lineHeight="$6" fontWeight="500">
              {dailyFocus.prompt}
            </Paragraph>
          </Card.Footer>
        </AnimatedCard>

        {/* Daily Attunement - AI-Synthesized Insight */}
        <DailyAttunement />

        {/* Daily Rhythm Cards */}
        <YStack gap="$3">
          <H2 size="$7">Daily Rhythm</H2>

          {/* Morning Activation */}
          <AnimatedCard elevate size="$4" bordered padding="$4" pressScale={0.98} staggerIndex={3}>
            <XStack alignItems="center" gap="$3" marginBottom="$3">
              <Sun size={32} color="#f97316" />
              <YStack flex={1}>
                <H3 size="$6">Morning Activation</H3>
                <Paragraph opacity={0.8} size="$3">
                  10-15 minutes • 4 exercises
                </Paragraph>
              </YStack>
            </XStack>
            <Button
              size="$4"
              width="100%"
              onPress={handleMorningRoutine}
              backgroundColor="green"
              color="white"
              pressStyle={{ backgroundColor: 'green' }}
            >
              Begin Morning Protocol →
            </Button>
          </AnimatedCard>

          {/* Evening Release */}
          <AnimatedCard elevate size="$4" bordered padding="$4" pressScale={0.98} staggerIndex={4}>
            <XStack alignItems="center" gap="$3" marginBottom="$3">
              <Moon size={32} color="#3b82f6" />
              <YStack flex={1}>
                <H3 size="$6">Evening Release</H3>
                <Paragraph opacity={0.8} size="$3">
                  10-15 minutes • 3 exercises
                </Paragraph>
              </YStack>
            </XStack>
            <Button
              size="$4"
              width="100%"
              onPress={handleEveningRoutine}
              backgroundColor="blue"
              color="white"
              pressStyle={{ backgroundColor: 'blue' }}
            >
              Begin Evening Protocol →
            </Button>
          </AnimatedCard>
        </YStack>
      </YStack>
    </ScrollView>
  )
}

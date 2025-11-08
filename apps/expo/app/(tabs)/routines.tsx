/**
 * Expo Routines Screen
 * Displays routine selection and integrates the shared RoutinePlayer
 */

import { useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, H2, Button, Card, XStack, Paragraph } from '@my/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { RoutinePlayer, morningRoutineSteps, eveningRoutineSteps } from 'app'
import { Sun, Moon } from '@tamagui/lucide-icons'
import { Alert } from 'react-native'

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets()
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8
  const params = useLocalSearchParams()
  const router = useRouter()
  const [activeRoutine, setActiveRoutine] = useState<'morning' | 'evening' | null>(null)

  useEffect(() => {
    if (params.routine === 'morning') {
      setActiveRoutine('morning')
    } else if (params.routine === 'evening') {
      setActiveRoutine('evening')
    }
  }, [params.routine])

  const handleComplete = () => {
    Alert.alert('Routine Complete! 🎉', 'Your progress has been saved. Keep up the great work!', [
      {
        text: 'Back to Home',
        onPress: () => {
          setActiveRoutine(null)
          router.push('/')
        },
      },
    ])
  }

  // If a routine is active, show the player
  if (activeRoutine === 'morning') {
    return (
      <RoutinePlayer
        steps={morningRoutineSteps}
        routineName="Morning Activation Protocol"
        routineType="morning"
        onComplete={handleComplete}
        onExit={() => setActiveRoutine(null)}
      />
    )
  }

  if (activeRoutine === 'evening') {
    return (
      <RoutinePlayer
        steps={eveningRoutineSteps}
        routineName="Evening Release Protocol"
        routineType="evening"
        onComplete={handleComplete}
        onExit={() => setActiveRoutine(null)}
      />
    )
  }

  // Otherwise, show routine selection
  return (
    <YStack flex={1} padding="$4" paddingTop={topPadding} gap="$4" backgroundColor="$background">
      <YStack gap="$2">
        <H2>Your Routines</H2>
        <Paragraph opacity={0.7} size="$4">
          Choose a routine to begin your practice
        </Paragraph>
      </YStack>

      {/* Morning Activation Card */}
      <Card elevate size="$4" bordered padding="$4">
        <XStack alignItems="center" gap="$3" marginBottom="$3">
          <Sun size={40} color="#f97316" />
          <YStack flex={1}>
            <H2 size="$7">Morning Activation</H2>
            <Paragraph opacity={0.8} size="$4">
              10-15 minutes
            </Paragraph>
          </YStack>
        </XStack>

        <YStack gap="$2" marginBottom="$3">
          <Paragraph size="$3" opacity={0.7}>
            Wake up your system and activate inhibited muscles:
          </Paragraph>
          <Paragraph size="$3">• Diaphragmatic Breathing (5 min)</Paragraph>
          <Paragraph size="$3">• Somatic Pelvic Tilts (10 reps)</Paragraph>
          <Paragraph size="$3">• Glute Bridges (2×15)</Paragraph>
          <Paragraph size="$3">• Dead Bugs (2×10)</Paragraph>
        </YStack>

        <Button
          size="$4"
          width="100%"
          onPress={() => setActiveRoutine('morning')}
          backgroundColor="green"
          color="white"
          pressStyle={{ backgroundColor: 'green' }}
        >
          Start Morning Routine →
        </Button>
      </Card>

      {/* Evening Release Card */}
      <Card elevate size="$4" bordered padding="$4">
        <XStack alignItems="center" gap="$3" marginBottom="$3">
          <Moon size={40} color="#3b82f6" />
          <YStack flex={1}>
            <H2 size="$7">Evening Release</H2>
            <Paragraph opacity={0.8} size="$4">
              10-15 minutes
            </Paragraph>
          </YStack>
        </XStack>

        <YStack gap="$2" marginBottom="$3">
          <Paragraph size="$3" opacity={0.7}>
            Undo the day's stress and decompress:
          </Paragraph>
          <Paragraph size="$3">• Foam Roll Quads & Hips (3-5 min)</Paragraph>
          <Paragraph size="$3">• Hip Flexor Stretch (30-60s each)</Paragraph>
          <Paragraph size="$3">• 90/90 Rest with Breathing (5 min)</Paragraph>
        </YStack>

        <Button
          size="$4"
          width="100%"
          onPress={() => setActiveRoutine('evening')}
          backgroundColor="blue"
          color="white"
          pressStyle={{ backgroundColor: 'blue' }}
        >
          Start Evening Routine →
        </Button>
      </Card>
    </YStack>
  )
}

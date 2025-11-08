/**
 * Next.js Routines Page
 * Displays routine selection and integrates the shared RoutinePlayer
 */

'use client'

import { useState, useEffect } from 'react'
import { YStack, H2, Button, Card, XStack, Paragraph, ScrollView } from '@my/ui'
import { useSearchParams, useRouter } from 'next/navigation'
import { RoutinePlayer, morningRoutineSteps, eveningRoutineSteps } from 'app'
import { Sun, Moon } from '@tamagui/lucide-icons'

export default function RoutinesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeRoutine, setActiveRoutine] = useState<'morning' | 'evening' | null>(null)

  useEffect(() => {
    const routine = searchParams?.get('routine')
    if (routine === 'morning') {
      setActiveRoutine('morning')
    } else if (routine === 'evening') {
      setActiveRoutine('evening')
    }
  }, [searchParams])

  const handleComplete = () => {
    alert('Routine Complete! 🎉\n\nYour progress has been saved. Keep up the great work!')
    setActiveRoutine(null)
    router.push('/')
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
    <ScrollView>
      <YStack flex={1} p="$4" pt={80} gap="$4" bg="$background" minHeight="100vh">
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
            backgroundColor="green"
            width="100%"
            onPress={() => setActiveRoutine('morning')}
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
            backgroundColor="blue"
            width="100%"
            onPress={() => setActiveRoutine('evening')}
          >
            Start Evening Routine →
          </Button>
        </Card>
      </YStack>
    </ScrollView>
  )
}

/**
 * Shared RoutinePlayer Component
 * Works on both Expo (React Native) and Next.js (Web)
 */

import { useState, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { YStack, XStack, H2, H3, Paragraph, Progress, Card, ScrollView, Circle } from '@my/ui'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import type { RoutineStep, Achievement } from '../types'
import { useProgressStore, useSovereignLogStore, useAchievementStore } from '../lib/store'
import { JournalModal } from './JournalModal'
import { AchievementUnlock } from './AchievementUnlock'
import { SuccessCelebration } from '../components/SuccessCelebration'
import { AnimatedButton } from '../components/AnimatedButton'
import { AnimatedProgress } from '../components/AnimatedProgress'
import { semanticColors } from '../lib/theme-colors'

// Conditional imports for native-only features
let Haptics: any
let Audio: any
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics')
  Audio = require('expo-av').Audio
}

// Exercise Timer Component
interface ExerciseTimerProps {
  duration: string // e.g., "30 seconds", "1 minute"
  onComplete: () => void
}

function ExerciseTimer({ duration, onComplete }: ExerciseTimerProps) {
  const [seconds, setSeconds] = useState(() => {
    // Parse duration string to seconds
    if (!duration) return 30
    const match = duration.match(/(\d+)\s*(second|minute|min|sec|s)/i)
    if (!match || !match[1]) return 30
    const value = parseInt(match[1], 10)
    const unit = match[2]?.toLowerCase() || ''
    return unit.startsWith('min') ? value * 60 : value
  })

  const [isRunning, setIsRunning] = useState(false)
  const [initialSeconds] = useState(seconds)
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!isRunning || seconds <= 0) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          onComplete()
          if (Platform.OS !== 'web' && Haptics) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, seconds])

  useEffect(() => {
    progress.value = withTiming(((initialSeconds - seconds) / initialSeconds) * 100, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    })
  }, [seconds])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }))

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  return (
    <YStack
      gap="$3"
      backgroundColor="$background"
      padding="$4"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <H3 size="$6">⏱️ Timer</H3>
        <H2 size="$9" fontFamily="$body" color={seconds < 6 ? 'red' : 'green'} fontWeight="700">
          {formatTime(seconds)}
        </H2>
      </XStack>

      <YStack height={8} backgroundColor="$color10" borderRadius="$2" overflow="hidden">
        <Animated.View style={[{ height: '100%', backgroundColor: '#4ade80' }, animatedStyle]} />
      </YStack>

      <AnimatedButton
        size="$4"
        backgroundColor={isRunning ? 'yellow' : 'green'}
        onPress={() => setIsRunning(!isRunning)}
        pressScale={0.96}
        hapticStyle="medium"
      >
        {isRunning ? '⏸ Pause' : '▶ Start Timer'}
      </AnimatedButton>
    </YStack>
  )
}

// Breath Guide Component
function BreathGuide() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  useEffect(() => {
    // Breathing pattern: 4s inhale, 4s hold, 6s exhale
    const cycle = async () => {
      // Inhale
      setPhase('inhale')
      if (Platform.OS !== 'web' && Haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      scale.value = withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      await new Promise((resolve) => setTimeout(resolve, 4000))

      // Hold
      setPhase('hold')
      await new Promise((resolve) => setTimeout(resolve, 4000))

      // Exhale
      setPhase('exhale')
      if (Platform.OS !== 'web' && Haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      scale.value = withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      await new Promise((resolve) => setTimeout(resolve, 6000))
    }

    const interval = setInterval(cycle, 14000) // Full cycle: 4 + 4 + 6 = 14s
    cycle() // Start immediately

    return () => clearInterval(interval)
  }, [])

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const phaseText = {
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out',
  }

  const phaseColor: Record<string, string> = {
    inhale: '#3b82f6',
    hold: '#a855f7',
    exhale: '#22c55e',
  }

  return (
    <YStack alignItems="center" gap="$4" padding="$4">
      <Animated.View style={[{ width: 120, height: 120 }, animatedCircleStyle]}>
        <Circle size={120} backgroundColor={phaseColor[phase] as any} opacity={0.3} />
      </Animated.View>
      <H3 size="$7" color={phaseColor[phase] as any}>
        {phaseText[phase]}
      </H3>
    </YStack>
  )
}

interface RoutinePlayerProps {
  steps: RoutineStep[]
  routineName: string
  routineType: 'morning' | 'evening'
  onComplete?: () => void
  onExit?: () => void
}

export function RoutinePlayer({
  steps,
  routineName,
  routineType,
  onComplete,
  onExit,
}: RoutinePlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showBreathGuide, setShowBreathGuide] = useState(false)
  const [formChecks, setFormChecks] = useState<Record<number, boolean[]>>({})
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const completeRoutine = useProgressStore((state) => state.completeRoutine)
  const finalizeRoutineCompletion = useProgressStore((state) => state.finalizeRoutineCompletion)
  const addSovereignEntry = useSovereignLogStore((state) => state.addSovereignEntry)
  const sovereignEntries = useSovereignLogStore((state) => state.sovereignEntries)
  const checkAchievements = useAchievementStore((state) => state.checkAchievements)
  const unlockSpecialAchievement = useAchievementStore((state) => state.unlockSpecialAchievement)
  const achievements = useAchievementStore((state) => state.achievements)

  // Count routine completion entries (Win/Kata type) for achievement tracking
  const routineCompletionCount = sovereignEntries.filter(
    (e) => e.entryType === 'Win/Kata' && e.routineType
  ).length

  const currentStep = steps[currentStepIndex]
  const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100)
  const isLastStep = currentStepIndex === steps.length - 1
  const isFirstStep = currentStepIndex === 0

  // Initialize form checks for current step
  useEffect(() => {
    if (currentStep && !formChecks[currentStepIndex]) {
      setFormChecks((prev) => ({
        ...prev,
        [currentStepIndex]: new Array(currentStep.instructions.length).fill(false),
      }))
    }
  }, [currentStepIndex])

  const handleNext = () => {
    // Haptic feedback on step completion
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }

    if (isLastStep) {
      // Show success celebration
      setShowSuccess(true)

      // Celebration haptic pattern
      if (Platform.OS !== 'web' && Haptics) {
        const celebrate = async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          await new Promise((r) => setTimeout(r, 100))
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          await new Promise((r) => setTimeout(r, 100))
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }
        celebrate()
      }

      // Use atomic completion action to prevent cascading re-renders
      const currentRoutineCompletionCount = useSovereignLogStore
        .getState()
        .sovereignEntries.filter((e) => e.entryType === 'Win/Kata' && e.routineType).length
      const { newlyUnlockedAchievement } = finalizeRoutineCompletion(
        routineType,
        currentRoutineCompletionCount
      )

      // Set newly unlocked achievement if found
      if (newlyUnlockedAchievement) {
        setUnlockedAchievement(newlyUnlockedAchievement)
      }

      // Show journal modal
      setShowJournalModal(true)
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handleJournalSave = (journalData: any) => {
    const routineEntriesBefore = useSovereignLogStore
      .getState()
      .sovereignEntries.filter((e) => e.entryType === 'Win/Kata' && e.routineType).length

    // Create Sovereign's Log entry with type "Win/Kata" for routine completion
    addSovereignEntry({
      entryType: 'Win/Kata',
      routineType,
      routineName,
      actionTaken: 'Acted (Kata)', // Completing a routine is acting on your Kata
      energyLevel:
        journalData.mood === 'great'
          ? 9
          : journalData.mood === 'good'
            ? 7
            : journalData.mood === 'neutral'
              ? 5
              : journalData.mood === 'tired'
                ? 4
                : journalData.mood === 'stressed'
                  ? 3
                  : 2,
      ...journalData,
    })

    // Check if journal achievement was unlocked
    setTimeout(() => {
      const routineEntriesAfter = useSovereignLogStore
        .getState()
        .sovereignEntries.filter((e) => e.entryType === 'Win/Kata' && e.routineType).length
      if (routineEntriesAfter > routineEntriesBefore) {
        // Re-check achievements with new journal count
        const updatedProgress = useProgressStore.getState()
        useAchievementStore.getState().checkAchievements(
          {
            complianceStreak: updatedProgress.complianceStreak,
            lastCompletedDate: updatedProgress.lastCompletedDate,
            totalCompletions: updatedProgress.totalCompletions,
          },
          routineEntriesAfter
        )

        // Check for newly unlocked journal achievements
        const achievements = useAchievementStore.getState().achievements
        const journalAchievement = achievements.find(
          (a) =>
            a.category === 'journey' &&
            a.unlocked &&
            a.unlockedDate &&
            new Date(a.unlockedDate).getTime() > Date.now() - 5000 // Unlocked in last 5 seconds
        )

        if (journalAchievement && !unlockedAchievement) {
          setUnlockedAchievement(journalAchievement)
        }
      }
    }, 100)

    setShowJournalModal(false)

    // Call parent onComplete after journaling
    if (onComplete) {
      onComplete()
    }
  }

  const handleJournalSkip = () => {
    setShowJournalModal(false)

    // Call parent onComplete even if skipped
    if (onComplete) {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      if (Platform.OS !== 'web' && Haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const toggleFormCheck = (instructionIndex: number) => {
    const currentChecks = formChecks[currentStepIndex]
    if (!currentChecks) return

    setFormChecks((prev) => ({
      ...prev,
      [currentStepIndex]: currentChecks.map((checked, i) =>
        i === instructionIndex ? !checked : checked
      ),
    }))

    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const handleTimerComplete = () => {
    // Auto-advance or notify user
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  return (
    <YStack flex={1} gap="$4" padding="$4">
      <XStack gap="$2" alignItems="center" justifyContent="space-between">
        <YStack flex={1}>
          <H2>{routineName}</H2>
          <Paragraph opacity={0.7} size="$3">
            Step {currentStepIndex + 1} of {steps.length}
          </Paragraph>
        </YStack>
        {onExit && (
          <AnimatedButton
            size="$3"
            chromeless
            onPress={onExit}
            circular
            pressScale={0.9}
            hapticStyle="light"
          >
            ✕
          </AnimatedButton>
        )}
      </XStack>

      <AnimatedProgress value={progress} max={100} backgroundColor="$color10" />

      {currentStep && (
        <Card elevate size="$4" flex={1}>
          <Card.Header>
            <H2 size="$8">{currentStep.name}</H2>
            <XStack gap="$3" marginTop="$2">
              {currentStep.duration && (
                <Paragraph opacity={0.8} size="$4">
                  ⏱️ {currentStep.duration}
                </Paragraph>
              )}
              {currentStep.reps && (
                <Paragraph opacity={0.8} size="$4">
                  🔄 {currentStep.reps}
                </Paragraph>
              )}
              {currentStep.sets && (
                <Paragraph opacity={0.8} size="$4">
                  📊 {currentStep.sets}
                </Paragraph>
              )}
            </XStack>
          </Card.Header>

          {/* Exercise Timer - shown if step has duration */}
          {currentStep.duration && (
            <YStack padding="$4">
              <ExerciseTimer duration={currentStep.duration} onComplete={handleTimerComplete} />
            </YStack>
          )}

          {/* Breath Guide - toggle button */}
          <XStack padding="$4" paddingTop="$2">
            <AnimatedButton
              size="$3"
              variant="outlined"
              onPress={() => setShowBreathGuide(!showBreathGuide)}
              flex={1}
              pressScale={0.97}
              hapticStyle="light"
            >
              {showBreathGuide ? '🫁 Hide Breath Guide' : '🫁 Show Breath Guide'}
            </AnimatedButton>
          </XStack>

          {showBreathGuide && <BreathGuide />}

          <ScrollView>
            <Card.Footer padded>
              <YStack gap="$3" flex={1}>
                <H3 size="$5" marginBottom="$2">
                  Form Checklist:
                </H3>
                {currentStep.instructions.map((instruction, index) => (
                  <XStack
                    key={index}
                    gap="$3"
                    alignItems="flex-start"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => toggleFormCheck(index)}
                  >
                    <AnimatedButton
                      size="$3"
                      circular
                      chromeless
                      onPress={() => toggleFormCheck(index)}
                      backgroundColor={formChecks[currentStepIndex]?.[index] ? 'green' : '$color10'}
                      color={formChecks[currentStepIndex]?.[index] ? 'white' : '$color12'}
                      pressScale={0.9}
                      hapticStyle="light"
                    >
                      {formChecks[currentStepIndex]?.[index] ? '✓' : ' '}
                    </AnimatedButton>
                    <Paragraph
                      key={index}
                      size="$4"
                      lineHeight="$5"
                      flex={1}
                      textDecorationLine={
                        formChecks[currentStepIndex]?.[index] ? 'line-through' : 'none'
                      }
                      opacity={formChecks[currentStepIndex]?.[index] ? 0.6 : 1}
                    >
                      {instruction}
                    </Paragraph>
                  </XStack>
                ))}
              </YStack>
            </Card.Footer>
          </ScrollView>
        </Card>
      )}

      <XStack gap="$3" justifyContent="space-between">
        <AnimatedButton
          size="$5"
          disabled={isFirstStep}
          onPress={handlePrevious}
          opacity={isFirstStep ? 0.5 : 1}
          flex={1}
          pressScale={0.97}
          hapticStyle="medium"
          enableHaptics={!isFirstStep}
        >
          ← Previous
        </AnimatedButton>
        <AnimatedButton
          size="$5"
          backgroundColor={semanticColors.success.background}
          onPress={handleNext}
          flex={1}
          pressScale={0.97}
          hapticStyle="heavy"
        >
          {isLastStep ? '✓ Complete Routine' : 'Next →'}
        </AnimatedButton>
      </XStack>

      {/* Journal Modal */}
      <JournalModal
        open={showJournalModal}
        onClose={handleJournalSkip}
        onSave={handleJournalSave}
        routineName={routineName}
        routineType={routineType}
      />

      {/* Achievement Unlock Notification */}
      <AchievementUnlock
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />

      {/* Success Celebration */}
      <SuccessCelebration isVisible={showSuccess} onComplete={() => setShowSuccess(false)} />
    </YStack>
  )
}

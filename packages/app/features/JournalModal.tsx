/**
 * Post-Routine Journal Modal
 * Allows users to log their mood, physical sensations, emotional state, and notes after completing a routine
 * Now integrated with Sovereign's Log system
 */

import { useState, useRef } from 'react'
import { Platform, ScrollView as RNScrollView, KeyboardAvoidingView } from 'react-native'
import { YStack, XStack, Text, Button, TextArea, Sheet, ScrollView, H3, Separator } from '@my/ui'
import { X } from '@tamagui/lucide-icons'
import type { MoodType, PhysicalSensation } from '../types'
import { KeyboardDismissButton } from '../components/KeyboardDismissButton'

interface JournalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    mood: MoodType
    physicalSensations: PhysicalSensation[]
    emotionalState?: string
    notes?: string
    difficulty?: 'easy' | 'moderate' | 'challenging'
  }) => void
  routineName: string
  routineType: 'morning' | 'evening'
}

const moodOptions: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
  { value: 'pain', emoji: '😣', label: 'Pain' },
]

const sensationOptions: { value: PhysicalSensation; label: string }[] = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'energized', label: 'Energized' },
  { value: 'tension', label: 'Tension' },
  { value: 'soreness', label: 'Soreness' },
  { value: 'flexibility', label: 'Flexible' },
  { value: 'stiffness', label: 'Stiff' },
  { value: 'pain', label: 'Pain' },
  { value: 'lightness', label: 'Light' },
  { value: 'heaviness', label: 'Heavy' },
]

const difficultyOptions: { value: 'easy' | 'moderate' | 'challenging'; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'challenging', label: 'Challenging' },
]

export function JournalModal({
  open,
  onClose,
  onSave,
  routineName,
  routineType,
}: JournalModalProps) {
  const [mood, setMood] = useState<MoodType>('good')
  const [sensations, setSensations] = useState<PhysicalSensation[]>([])
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'challenging'>('moderate')
  const [emotionalState, setEmotionalState] = useState('')
  const [notes, setNotes] = useState('')
  const scrollViewRef = useRef<RNScrollView>(null)
  const emotionalStateRef = useRef<any>(null)
  const notesRef = useRef<any>(null)

  const toggleSensation = (sensation: PhysicalSensation) => {
    setSensations((prev) =>
      prev.includes(sensation) ? prev.filter((s) => s !== sensation) : [...prev, sensation]
    )
  }

  const handleSave = () => {
    onSave({
      mood,
      physicalSensations: sensations,
      emotionalState: emotionalState.trim() || undefined,
      notes: notes.trim() || undefined,
      difficulty,
    })

    // Reset form
    setMood('good')
    setSensations([])
    setDifficulty('moderate')
    setEmotionalState('')
    setNotes('')
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  // Don't render at all when closed to avoid Portal infinite loop
  if (!open) return null

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={handleOpenChange}
      snapPoints={[95]}
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={true}
      animationConfig={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
    >
      <Sheet.Overlay backgroundColor="$background" opacity={0.8} />
      <Sheet.Frame padding="$4" gap="$4">
        <XStack justifyContent="flex-end" marginTop="$2" marginBottom="$-2">
          <Button
            size="$2"
            circular
            icon={X}
            onPress={onClose}
            chromeless
            opacity={0.6}
            pressStyle={{ opacity: 1, scale: 0.95 }}
          />
        </XStack>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
        >
          <ScrollView
            ref={scrollViewRef as any}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={{ flexGrow: 1 }}
            nestedScrollEnabled={true}
          >
            <YStack gap="$4" paddingBottom="$4">
              <H3 textAlign="center">How are you feeling?</H3>
              <Text fontSize="$3" color="$color11" textAlign="center">
                {routineName} completed
              </Text>

              <Separator />

              {/* Mood Selector */}
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4">
                  Overall Mood
                </Text>
                <XStack gap="$2" flexWrap="wrap" justifyContent="space-between">
                  {moodOptions.map((option) => (
                    <Button
                      key={option.value}
                      flex={1}
                      minWidth={100}
                      onPress={() => setMood(option.value)}
                      backgroundColor={mood === option.value ? 'blue' : '$color3'}
                      borderColor={mood === option.value ? 'blue' : '$color6'}
                      borderWidth={2}
                    >
                      <YStack alignItems="center" gap="$1">
                        <Text fontSize="$6">{option.emoji}</Text>
                        <Text
                          fontSize="$2"
                          color={mood === option.value ? 'white' : '$color12'}
                          fontWeight={mood === option.value ? '600' : '400'}
                        >
                          {option.label}
                        </Text>
                      </YStack>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <Separator />

              {/* Physical Sensations */}
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4">
                  Physical Sensations
                </Text>
                <Text fontSize="$2" color="$color11">
                  Select all that apply
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {sensationOptions.map((option) => (
                    <Button
                      key={option.value}
                      size="$3"
                      onPress={() => toggleSensation(option.value)}
                      backgroundColor={sensations.includes(option.value) ? 'green' : '$color3'}
                      borderColor={sensations.includes(option.value) ? 'green' : '$color6'}
                      borderWidth={1}
                    >
                      <Text
                        fontSize="$3"
                        color={sensations.includes(option.value) ? 'white' : '$color12'}
                        fontWeight={sensations.includes(option.value) ? '600' : '400'}
                      >
                        {option.label}
                      </Text>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <Separator />

              {/* Difficulty Rating */}
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4">
                  Difficulty
                </Text>
                <XStack gap="$2" justifyContent="space-between">
                  {difficultyOptions.map((option) => (
                    <Button
                      key={option.value}
                      flex={1}
                      onPress={() => setDifficulty(option.value)}
                      backgroundColor={difficulty === option.value ? 'yellow' : '$color3'}
                      borderColor={difficulty === option.value ? 'yellow' : '$color6'}
                      borderWidth={2}
                    >
                      <Text
                        fontSize="$3"
                        color={difficulty === option.value ? 'white' : '$color12'}
                        fontWeight={difficulty === option.value ? '600' : '400'}
                      >
                        {option.label}
                      </Text>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <Separator />

              {/* Emotional State (Optional) */}
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4">
                  Emotional State (Optional)
                </Text>
                <TextArea
                  ref={emotionalStateRef}
                  placeholder="e.g., calm, peaceful, anxious, motivated..."
                  value={emotionalState}
                  onChangeText={setEmotionalState}
                  onFocus={() => {
                    setTimeout(() => {
                      emotionalStateRef.current?.measureLayout(
                        scrollViewRef.current as any,
                        (_x: number, y: number) => {
                          scrollViewRef.current?.scrollTo({
                            y: y - 50,
                            animated: true,
                          })
                        },
                        () => {}
                      )
                    }, 300)
                  }}
                  height={60}
                  backgroundColor="$color2"
                  borderColor="$color6"
                  blurOnSubmit={false}
                  returnKeyType="next"
                  multiline
                />
              </YStack>

              {/* Notes (Optional) */}
              <YStack gap="$2">
                <Text fontWeight="600" fontSize="$4">
                  Notes (Optional)
                </Text>
                <TextArea
                  ref={notesRef}
                  placeholder="Any insights, observations, or reflections..."
                  value={notes}
                  onChangeText={setNotes}
                  onFocus={() => {
                    setTimeout(() => {
                      notesRef.current?.measureLayout(
                        scrollViewRef.current as any,
                        (_x: number, y: number) => {
                          scrollViewRef.current?.scrollTo({
                            y: y - 50,
                            animated: true,
                          })
                        },
                        () => {}
                      )
                    }, 300)
                  }}
                  height={100}
                  backgroundColor="$color2"
                  borderColor="$color6"
                  blurOnSubmit={false}
                  returnKeyType="done"
                  multiline
                />
              </YStack>

              {/* Action Buttons */}
              <XStack gap="$3" paddingTop="$2">
                <Button flex={1} onPress={onClose} backgroundColor="$color5">
                  <Text color="$color12">Skip</Text>
                </Button>
                <Button
                  flex={2}
                  onPress={handleSave}
                  backgroundColor="blue"
                  pressStyle={{ backgroundColor: 'blue' }}
                >
                  <Text color="white" fontWeight="600">
                    Save Journal Entry
                  </Text>
                </Button>
              </XStack>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
        <KeyboardDismissButton />
      </Sheet.Frame>
    </Sheet>
  )
}

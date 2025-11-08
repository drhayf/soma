/**
 * Daily Attunement Component
 *
 * Displays the AI-generated daily Q&A synthesis and collects feedback
 * for closed-loop learning
 */

import { useState, useEffect } from 'react'
import { YStack, XStack, H3, H4, Text, Button, TextArea, RadioGroup, Label, Spinner } from '@my/ui'
import { AnimatedCard } from '../components/AnimatedCard'
import { useSovereignPathStore, useSovereignLogStore } from '../lib/store'
import { useHealthData } from '../hooks/useHealthData'
import { useCosmicData } from '../hooks/useCosmicData'
import { getApiUrl } from '../lib/api-config'
import type { DailyAttunement, AttunementFeedback } from '../types'
import { CheckCircle, Send } from '@tamagui/lucide-icons'

export function DailyAttunement() {
  const { humanDesignChart, birthData } = useSovereignPathStore()
  const { addAttunementFeedback } = useSovereignLogStore()
  const { metrics: healthMetrics } = useHealthData()
  const { data: cosmicData } = useCosmicData({})

  const [attunement, setAttunement] = useState<DailyAttunement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [feedbackRating, setFeedbackRating] = useState<string>('3')
  const [customAnswer, setCustomAnswer] = useState('')
  const [showCustomAnswer, setShowCustomAnswer] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Fetch daily attunement on mount
  useEffect(() => {
    fetchAttunement()
  }, [])

  const fetchAttunement = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl('/api/attunement'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humanDesignChart,
          healthMetrics,
          cosmicData,
          birthData,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[DailyAttunement] API Error:', response.status, errorText)
        throw new Error(`Failed to generate attunement: ${response.status}`)
      }

      const data = await response.json()
      setAttunement(data)
    } catch (err) {
      console.error('[DailyAttunement] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!attunement) return

    const rating = parseInt(feedbackRating) as 1 | 2 | 3 | 4 | 5

    const feedback: Omit<AttunementFeedback, 'id' | 'timestamp' | 'vectorized'> = {
      attunementId: attunement.id,
      date: attunement.date,
      originalQuestion: attunement.insightfulQuestion,
      originalAnswer: attunement.synthesizedAnswer,
      userRating: rating,
      userCustomAnswer: customAnswer.trim() || undefined,
    }

    // Add to store
    const storedFeedback = addAttunementFeedback(feedback)

    // Vectorize and add to RAG
    try {
      const feedbackContent = `
ATTUNEMENT FEEDBACK (${attunement.date}):
Question: ${attunement.insightfulQuestion}
AI Answer: ${attunement.synthesizedAnswer}
User Rating: ${rating}/5
${customAnswer.trim() ? `User's Answer: ${customAnswer.trim()}` : ''}

This feedback helps refine future attunements.
      `.trim()

      await fetch(getApiUrl('/api/vector/upsert'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: feedbackContent,
          metadata: {
            type: 'attunement_feedback',
            timestamp: new Date().toISOString(),
            entryId: storedFeedback.id,
            rating,
            date: attunement.date,
          },
        }),
      })

      setFeedbackSubmitted(true)
    } catch (err) {
      console.error('[DailyAttunement] Feedback vectorization error:', err)
      // Still mark as submitted since it's in store
      setFeedbackSubmitted(true)
    }
  }

  if (loading) {
    return (
      <AnimatedCard>
        <YStack alignItems="center" padding="$6" gap="$4">
          <Spinner size="large" color="green" />
          <Text color="$color11">Generating your daily attunement...</Text>
          <Text fontSize="$2" color="$color10" textAlign="center" maxWidth={300}>
            Synthesizing your Blueprint, Logs, Vessel Data, and Cosmic State
          </Text>
        </YStack>
      </AnimatedCard>
    )
  }

  if (error) {
    return (
      <AnimatedCard>
        <YStack gap="$3" padding="$4">
          <H3 color="red">Error Generating Attunement</H3>
          <Text color="$color11">{error}</Text>
          <Button onPress={fetchAttunement} theme="green">
            Retry
          </Button>
        </YStack>
      </AnimatedCard>
    )
  }

  if (!attunement) {
    return (
      <AnimatedCard>
        <YStack gap="$3" padding="$4" alignItems="center">
          <Text color="$color11">No attunement available</Text>
          <Button onPress={fetchAttunement} theme="green">
            Generate Attunement
          </Button>
        </YStack>
      </AnimatedCard>
    )
  }

  return (
    <YStack gap="$4">
      {/* Question Card */}
      <AnimatedCard>
        <YStack gap="$3">
          <H4 color="green">Today's Question</H4>
          <Text fontSize="$5" fontWeight="600" lineHeight={28} color="$color12">
            {attunement.insightfulQuestion}
          </Text>
        </YStack>
      </AnimatedCard>

      {/* Answer Card */}
      <AnimatedCard>
        <YStack gap="$3">
          <H4 color="blue">Synthesized Answer</H4>
          <Text fontSize="$4" lineHeight={24} color="$color11">
            {attunement.synthesizedAnswer}
          </Text>

          {/* Data Sources */}
          <YStack
            gap="$2"
            marginTop="$3"
            paddingTop="$3"
            borderTopWidth={1}
            borderColor="$borderColor"
          >
            <Text fontSize="$2" color="$color10" fontWeight="600">
              Based on:
            </Text>
            <XStack gap="$3" flexWrap="wrap">
              {attunement.basedOn.logCount > 0 && (
                <Text fontSize="$2" color="$color10">
                  📝 {attunement.basedOn.logCount} logs
                </Text>
              )}
              {attunement.basedOn.humanDesignAvailable && (
                <Text fontSize="$2" color="$color10">
                  🧬 Blueprint
                </Text>
              )}
              {attunement.basedOn.healthMetricsAvailable && (
                <Text fontSize="$2" color="$color10">
                  💪 Vessel
                </Text>
              )}
              {attunement.basedOn.cosmicDataAvailable && (
                <Text fontSize="$2" color="$color10">
                  🌙 Cosmic
                </Text>
              )}
              {attunement.basedOn.astrologyDataAvailable && (
                <Text fontSize="$2" color="$color10">
                  ⭐ Transits
                </Text>
              )}
            </XStack>
          </YStack>
        </YStack>
      </AnimatedCard>

      {/* Feedback Card */}
      {!feedbackSubmitted ? (
        <AnimatedCard>
          <YStack gap="$4">
            <H4>Your Feedback</H4>
            <Text fontSize="$3" color="$color11">
              How well does this attunement resonate with your current state?
            </Text>

            {/* Rating Scale */}
            <RadioGroup value={feedbackRating} onValueChange={setFeedbackRating}>
              <YStack gap="$2">
                <Label htmlFor="rating-1" fontSize="$3">
                  <XStack gap="$2" alignItems="center">
                    <RadioGroup.Item value="1" id="rating-1" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text>1 - Strongly Disagree</Text>
                  </XStack>
                </Label>
                <Label htmlFor="rating-2" fontSize="$3">
                  <XStack gap="$2" alignItems="center">
                    <RadioGroup.Item value="2" id="rating-2" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text>2 - Disagree</Text>
                  </XStack>
                </Label>
                <Label htmlFor="rating-3" fontSize="$3">
                  <XStack gap="$2" alignItems="center">
                    <RadioGroup.Item value="3" id="rating-3" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text>3 - Neutral</Text>
                  </XStack>
                </Label>
                <Label htmlFor="rating-4" fontSize="$3">
                  <XStack gap="$2" alignItems="center">
                    <RadioGroup.Item value="4" id="rating-4" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text>4 - Agree</Text>
                  </XStack>
                </Label>
                <Label htmlFor="rating-5" fontSize="$3">
                  <XStack gap="$2" alignItems="center">
                    <RadioGroup.Item value="5" id="rating-5" size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text>5 - Strongly Agree</Text>
                  </XStack>
                </Label>
              </YStack>
            </RadioGroup>

            {/* Custom Answer Toggle */}
            <Button size="$3" chromeless onPress={() => setShowCustomAnswer(!showCustomAnswer)}>
              {showCustomAnswer ? 'Hide' : 'Add'} Your Own Answer
            </Button>

            {/* Custom Answer Input */}
            {showCustomAnswer && (
              <YStack gap="$2">
                <Text fontSize="$3" color="$color11">
                  What's your answer to this question?
                </Text>
                <TextArea
                  value={customAnswer}
                  onChangeText={setCustomAnswer}
                  placeholder="Share your perspective..."
                  height={120}
                  fontSize="$3"
                />
              </YStack>
            )}

            {/* Submit Button */}
            <Button
              onPress={handleFeedbackSubmit}
              theme="green"
              icon={Send}
              disabled={feedbackSubmitted}
            >
              Submit Feedback
            </Button>
          </YStack>
        </AnimatedCard>
      ) : (
        <AnimatedCard>
          <YStack gap="$3" alignItems="center" padding="$4">
            <CheckCircle size={48} color="green" />
            <H4 color="green">Feedback Received</H4>
            <Text fontSize="$3" color="$color11" textAlign="center">
              Your feedback has been added to the learning system. Future attunements will be
              refined based on your input.
            </Text>
          </YStack>
        </AnimatedCard>
      )}
    </YStack>
  )
}

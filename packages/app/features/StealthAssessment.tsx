/**
 * Stealth MBTI Assessment
 * Clean, modular, numeric-first layout to avoid fractional token issues on native fabric
 */

import React, { useEffect, useState } from 'react'
import { YStack, XStack, H4, Paragraph, Button, Card, Text, Slider, Progress } from '@my/ui'
import { Brain, ChevronRight } from '@tamagui/lucide-icons'
import { getNextQuestion, OEJTS_QUESTIONS } from '../lib/oejts'
import type { OEJTSAnswer } from '../lib/oejts'
import { useSovereignPathStore } from '../lib/store'
import { semanticColors } from '../lib/theme-colors'

export function StealthAssessment(): JSX.Element {
  const { oejtsAnswers, oejtsResults, addOEJTSAnswer } = useSovereignPathStore()
  const [currentQuestion, setCurrentQuestion] = useState<ReturnType<typeof getNextQuestion> | null>(
    null
  )
  const [sliderValue, setSliderValue] = useState<number[]>([3])

  const handleResetAssessment = () => {
    // Clear all answers and results
    useSovereignPathStore.getState().oejtsAnswers = []
    useSovereignPathStore.getState().oejtsResults = null
    useSovereignPathStore.getState().mbtiProfile = null

    // Reset to first question
    const next = getNextQuestion([])
    setCurrentQuestion(next)
    setSliderValue([3])
  }

  useEffect(() => {
    const next = getNextQuestion(oejtsAnswers)
    setCurrentQuestion(next)
    setSliderValue([3])
  }, [oejtsAnswers])

  const handleAnswer = () => {
    if (!currentQuestion) return
    const answer: OEJTSAnswer = {
      questionId: currentQuestion.id,
      value: sliderValue[0],
      answeredAt: new Date().toISOString(),
    }
    addOEJTSAnswer(answer)
  }

  const completionPercentage = Math.round((oejtsAnswers.length / OEJTS_QUESTIONS.length) * 100)

  if (!currentQuestion && oejtsResults) {
    return <AssessmentResults results={oejtsResults} />
  }

  if (!currentQuestion) {
    return (
      <Card paddingHorizontal={16} paddingVertical={16} backgroundColor="$background">
        <Text>Assessment complete! Results are being calculated...</Text>
      </Card>
    )
  }

  const getSliderLabel = (value: number) => {
    switch (value) {
      case 1:
        return 'Strongly Disagree'
      case 2:
        return 'Disagree'
      case 3:
        return 'Neutral'
      case 4:
        return 'Agree'
      default:
        return 'Strongly Agree'
    }
  }

  return (
    <YStack paddingHorizontal={16} paddingVertical={12}>
      {/* Header */}
      <YStack marginBottom={12}>
        <XStack alignItems="center" gap={8} marginBottom={8}>
          <Brain size={20} color={semanticColors.primary.text} />
          <H4>Personality Insight</H4>
        </XStack>
        <Progress value={completionPercentage} max={100} height={8}>
          <Progress.Indicator backgroundColor={semanticColors.primary.background} />
        </Progress>
        <Text fontSize={12} marginTop={8} color="$color10">
          {oejtsAnswers.length + 1} of {OEJTS_QUESTIONS.length} questions
        </Text>
      </YStack>

      {/* Question card */}
      <Card
        elevate
        paddingHorizontal={20}
        paddingVertical={20}
        borderWidth={1}
        borderColor={semanticColors.primary.border}
        marginBottom={16}
      >
        <YStack>
          <Paragraph
            fontSize={18}
            fontWeight="600"
            lineHeight={24}
            textAlign="center"
            marginBottom={20}
          >
            {currentQuestion.text}
          </Paragraph>

          <XStack justifyContent="space-between" marginBottom={12}>
            <Text fontSize={14} color="$color11" flex={1} flexWrap="wrap">
              {currentQuestion.leftLabel}
            </Text>
            <Text fontSize={14} color="$color11" flex={1} textAlign="right" flexWrap="wrap">
              {currentQuestion.rightLabel}
            </Text>
          </XStack>

          <YStack marginBottom={12}>
            <Slider value={sliderValue} onValueChange={setSliderValue} min={1} max={5} step={1}>
              <Slider.Track backgroundColor="$color5" height={8}>
                <Slider.TrackActive backgroundColor={semanticColors.primary.background} />
              </Slider.Track>
              <Slider.Thumb
                circular
                index={0}
                size={28}
                backgroundColor={semanticColors.primary.background}
                borderWidth={2}
                borderColor="$background"
              />
            </Slider>
          </YStack>

          <Text
            fontSize={16}
            fontWeight="600"
            textAlign="center"
            color={semanticColors.primary.text}
            marginBottom={16}
          >
            {getSliderLabel(sliderValue[0])}
          </Text>

          <Button
            onPress={handleAnswer}
            backgroundColor={semanticColors.primary.background}
            borderColor={semanticColors.primary.border}
            icon={ChevronRight}
            iconAfter={ChevronRight}
          >
            Continue
          </Button>
        </YStack>
      </Card>

      <Card
        backgroundColor={semanticColors.info.background}
        borderColor={semanticColors.info.border}
        borderWidth={1}
        paddingHorizontal={16}
        paddingVertical={12}
      >
        <XStack alignItems="flex-start">
          <Text fontSize={16} marginRight={8}>
            💡
          </Text>
          <Text
            fontSize={14}
            color={semanticColors.info.text}
            flex={1}
            flexWrap="wrap"
            lineHeight={20}
          >
            Answer intuitively. There are no right or wrong answers — only insights into your
            natural preferences.
          </Text>
        </XStack>
      </Card>
    </YStack>
  )
}

/* --- Results & helpers --- */
function AssessmentResults({ results }: { results: any }) {
  return (
    <YStack gap={12} paddingHorizontal={16}>
      <Card
        elevate
        borderWidth={2}
        borderColor={semanticColors.success.border}
        paddingHorizontal={16}
        paddingVertical={16}
        backgroundColor={semanticColors.success.background}
      >
        <YStack gap={8} alignItems="center">
          <Text fontSize={32} fontWeight="900" color={semanticColors.success.text} flexWrap="wrap">
            {results.type}
          </Text>
          <Text fontSize={14} color={semanticColors.success.text}>
            {results.completionPercentage}% Complete
          </Text>
        </YStack>
      </Card>

      <Card
        elevate
        borderWidth={1}
        borderColor="$borderColor"
        paddingHorizontal={16}
        paddingVertical={16}
      >
        <YStack>
          <Text fontSize={16} fontWeight="700" marginBottom={12}>
            Cognitive Function Stack
          </Text>
          {results.dominantFunctions?.map((fn: string, i: number) => (
            <Card
              key={fn}
              paddingHorizontal={12}
              paddingVertical={10}
              marginBottom={8}
              backgroundColor={
                i === 0 ? semanticColors.success.background : semanticColors.neutral.background
              }
            >
              <Text fontSize={14} fontWeight={i === 0 ? '700' : '400'} flexWrap="wrap">
                {i + 1}. {fn}
                {i === 0 ? ' (Dominant)' : ''}
              </Text>
            </Card>
          ))}
        </YStack>
      </Card>

      <Card
        elevate
        borderWidth={1}
        borderColor="$borderColor"
        paddingHorizontal={16}
        paddingVertical={16}
      >
        <YStack>
          <Text fontSize={16} fontWeight="700" marginBottom={12}>
            Type Description
          </Text>
          <Text fontSize={14} lineHeight={20} flexWrap="wrap">
            {results.type} personality type with scores: E={results.scores.E}, I={results.scores.I},
            S={results.scores.S}, N={results.scores.N}, T={results.scores.T}, F={results.scores.F},
            J={results.scores.J}, P={results.scores.P}
          </Text>
        </YStack>
      </Card>

      <Button
        size={12}
        chromeless
        onPress={() => useSovereignPathStore.setState({ oejtsResults: null })}
      >
        Review Questions
      </Button>
    </YStack>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <YStack gap={6}>
      <XStack justifyContent="space-between">
        <Text fontSize={12}>{label}</Text>
        <Text fontSize={12} fontWeight="600">
          {value}%
        </Text>
      </XStack>
      <Progress value={value} max={100}>
        <Progress.Indicator backgroundColor={semanticColors.primary.background} />
      </Progress>
    </YStack>
  )
}

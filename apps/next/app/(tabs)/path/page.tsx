'use client'

import {
  YStack,
  XStack,
  Text,
  Button,
  H3,
  H4,
  Card,
  Separator,
  ScrollView,
  Sheet,
  Input,
  TextArea,
} from '@my/ui'
import { Target, Plus, Check, Trash2, TrendingUp, AlertCircle } from '@tamagui/lucide-icons'
import { useSovereignPathStore, useSovereignLogStore } from 'app/lib/store'
import { useState } from 'react'
import type { Kata, PatternInsight } from 'app/types'

export default function SovereignPath() {
  const {
    katas,
    archetypeAnalysis,
    addKata,
    completeKata,
    deleteKata,
    setArchetypeAnalysis,
    needsArchetypeUpdate,
    getPatternInsights,
  } = useSovereignPathStore()

  const { sovereignEntries } = useSovereignLogStore()

  // Compute pattern insights from sovereign log entries
  const patternInsights = getPatternInsights(sovereignEntries)

  const [kataSheetOpen, setKataSheetOpen] = useState(false)
  const [newKata, setNewKata] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'as-needed',
    category: 'physical' as 'physical' | 'energetic' | 'mental' | 'custom',
  })

  const [analyzingArchetype, setAnalyzingArchetype] = useState(false)
  const [archetypeText, setArchetypeText] = useState('')

  const handleAddKata = () => {
    if (newKata.name.trim()) {
      addKata({
        name: newKata.name,
        description: newKata.description,
        frequency: newKata.frequency,
        category: newKata.category,
      })
      setKataSheetOpen(false)
      setNewKata({
        name: '',
        description: '',
        frequency: 'daily',
        category: 'physical',
      })
    }
  }

  const handleAnalyzeArchetype = async () => {
    setAnalyzingArchetype(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Based on all my journal entries, routine completions, and patterns, analyze my primary archetype using Jungian psychology. Provide:

ARCHETYPE: [Name of primary archetype]
DESCRIPTION: [2-3 sentences describing the archetype]
STRENGTHS: [Bullet list of 3-4 key strengths]
CHALLENGES: [Bullet list of 3-4 key challenges]
GUIDANCE: [3-4 sentences of actionable guidance for this archetype]

Be ruthlessly honest and precise. This is for a 26-year-old African reincarnated king on the path of sovereignty.`,
            },
          ],
        }),
      })

      const data = await response.json()
      const aiResponse = data.content

      // Parse the structured response
      const archetypeMatch = aiResponse.match(/ARCHETYPE:\s*(.+?)(?=\n|$)/i)
      const descriptionMatch = aiResponse.match(/DESCRIPTION:\s*([\s\S]+?)(?=STRENGTHS:|$)/)
      const strengthsMatch = aiResponse.match(/STRENGTHS:\s*([\s\S]+?)(?=CHALLENGES:|$)/)
      const challengesMatch = aiResponse.match(/CHALLENGES:\s*([\s\S]+?)(?=GUIDANCE:|$)/)
      const guidanceMatch = aiResponse.match(/GUIDANCE:\s*([\s\S]+?)$/)

      const archetype = archetypeMatch ? archetypeMatch[1].trim() : 'Unknown'
      const description = descriptionMatch ? descriptionMatch[1].trim() : ''
      const strengths = strengthsMatch ? strengthsMatch[1].trim() : ''
      const challenges = challengesMatch ? challengesMatch[1].trim() : ''
      const guidance = guidanceMatch ? guidanceMatch[1].trim() : ''

      setArchetypeAnalysis({
        archetype,
        description,
        strengths,
        challenges,
        guidance,
        analyzedAt: new Date().toISOString(),
        basedOnEntryCount: sovereignEntries.length,
      })

      setArchetypeText(aiResponse)
    } catch (error) {
      console.error('Archetype analysis failed:', error)
    } finally {
      setAnalyzingArchetype(false)
    }
  }

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'leak':
        return 'red'
      case 'potency':
        return 'green'
      case 'consistency':
        return 'blue'
      case 'breakthrough':
        return 'yellow'
      default:
        return '$color9'
    }
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'leak':
        return AlertCircle
      case 'potency':
      case 'consistency':
      case 'breakthrough':
        return TrendingUp
      default:
        return Target
    }
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack
        flex={1}
        padding="$4"
        space="$4"
        maxWidth={800}
        width="100%"
        marginHorizontal="auto"
        paddingBottom="$8"
      >
        {/* Header */}
        <YStack space="$2">
          <XStack alignItems="center" space="$3">
            <Target size={32} color="$color" />
            <H3>Sovereign's Path</H3>
          </XStack>
          <Text color="$color10" fontSize="$3">
            Your archetype, non-negotiable practices, and energetic patterns
          </Text>
        </YStack>

        <Separator />

        {/* My Archetype Section */}
        <YStack space="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <H4>My Archetype</H4>
            <Button
              size="$3"
              backgroundColor={
                needsArchetypeUpdate(sovereignEntries.length) ? 'yellow' : 'blue'
              }
              onPress={handleAnalyzeArchetype}
              disabled={analyzingArchetype}
            >
              {analyzingArchetype
                ? 'Analyzing...'
                : needsArchetypeUpdate(sovereignEntries.length)
                  ? 'Update Analysis'
                  : 'Analyze'}
            </Button>
          </XStack>

          {archetypeAnalysis ? (
            <Card padding="$4" backgroundColor="$backgroundHover">
              <YStack space="$3">
                <Text fontSize="$6" fontWeight="bold" color="$color">
                  {archetypeAnalysis.archetype}
                </Text>
                <Text fontSize="$3" color="$color11">
                  {archetypeAnalysis.description}
                </Text>

                {archetypeAnalysis.strengths && (
                  <YStack space="$2">
                    <Text fontSize="$4" fontWeight="600" color="green">
                      Strengths
                    </Text>
                    <Text fontSize="$3" color="$color10">
                      {archetypeAnalysis.strengths}
                    </Text>
                  </YStack>
                )}

                {archetypeAnalysis.challenges && (
                  <YStack space="$2">
                    <Text fontSize="$4" fontWeight="600" color="red">
                      Challenges
                    </Text>
                    <Text fontSize="$3" color="$color10">
                      {archetypeAnalysis.challenges}
                    </Text>
                  </YStack>
                )}

                {archetypeAnalysis.guidance && (
                  <YStack space="$2">
                    <Text fontSize="$4" fontWeight="600" color="blue">
                      Guidance
                    </Text>
                    <Text fontSize="$3" color="$color10">
                      {archetypeAnalysis.guidance}
                    </Text>
                  </YStack>
                )}

                {archetypeAnalysis.basedOnEntryCount !== undefined && (
                  <Text fontSize="$2" color="$color9" marginTop="$2">
                    Based on {archetypeAnalysis.basedOnEntryCount} journal entries
                  </Text>
                )}
              </YStack>
            </Card>
          ) : (
            <Card padding="$4" backgroundColor="$backgroundHover">
              <Text color="$color10" textAlign="center">
                Tap "Analyze" to discover your primary archetype based on your journal patterns
              </Text>
            </Card>
          )}
        </YStack>

        <Separator />

        {/* My Kata Section */}
        <YStack space="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <H4>My Kata</H4>
            <Button
              size="$3"
              backgroundColor="green"
              icon={Plus}
              onPress={() => setKataSheetOpen(true)}
            >
              Add Kata
            </Button>
          </XStack>

          {katas.length > 0 ? (
            <YStack space="$3">
              {katas.map((kata) => (
                <Card key={kata.id} padding="$4" backgroundColor="$backgroundHover">
                  <YStack space="$3">
                    <XStack justifyContent="space-between" alignItems="flex-start">
                      <YStack flex={1} space="$2">
                        <Text fontSize="$5" fontWeight="600" color="$color">
                          {kata.name}
                        </Text>
                        {kata.description && (
                          <Text fontSize="$3" color="$color10">
                            {kata.description}
                          </Text>
                        )}
                        <XStack space="$2" flexWrap="wrap">
                          <Text fontSize="$2" color="$color9">
                            {kata.frequency.charAt(0).toUpperCase() + kata.frequency.slice(1)}
                          </Text>
                          <Text fontSize="$2" color="$color9">
                            •
                          </Text>
                          <Text fontSize="$2" color="$color9">
                            {kata.category.charAt(0).toUpperCase() + kata.category.slice(1)}
                          </Text>
                          <Text fontSize="$2" color="$color9">
                            •
                          </Text>
                          <Text fontSize="$2" color="$color9">
                            Completed {kata.completionCount} times
                          </Text>
                        </XStack>
                      </YStack>
                      <XStack space="$2">
                        <Button
                          size="$3"
                          backgroundColor="blue"
                          icon={Check}
                          onPress={() => completeKata(kata.id)}
                        />
                        <Button
                          size="$3"
                          backgroundColor="red"
                          icon={Trash2}
                          onPress={() => deleteKata(kata.id)}
                        />
                      </XStack>
                    </XStack>
                  </YStack>
                </Card>
              ))}
            </YStack>
          ) : (
            <Card padding="$4" backgroundColor="$backgroundHover">
              <Text color="$color10" textAlign="center">
                No kata defined yet. Add your first non-negotiable practice.
              </Text>
            </Card>
          )}
        </YStack>

        <Separator />

        {/* My Patterns Section */}
        <YStack space="$3" marginBottom="$8">
          <H4>My Patterns</H4>

          {patternInsights.length > 0 ? (
            <YStack space="$3">
              {patternInsights.map((insight, index) => {
                const PatternIcon = getPatternIcon(insight.type)
                return (
                  <Card key={index} padding="$4" backgroundColor="$backgroundHover">
                    <YStack space="$3">
                      <XStack alignItems="center" space="$2">
                        <PatternIcon size={20} color={getPatternColor(insight.type)} />
                        <Text fontSize="$5" fontWeight="600" color={getPatternColor(insight.type)}>
                          {insight.title}
                        </Text>
                      </XStack>

                      <Text fontSize="$3" color="$color11">
                        {insight.description}
                      </Text>

                      {insight.timePattern && (
                        <Text fontSize="$2" color="$color9" fontStyle="italic">
                          Time Pattern: {insight.timePattern}
                        </Text>
                      )}

                      {insight.recommendation && (
                        <Card padding="$3" backgroundColor="$background">
                          <Text fontSize="$3" color="$color10">
                            💡 {insight.recommendation}
                          </Text>
                        </Card>
                      )}
                    </YStack>
                  </Card>
                )
              })}
            </YStack>
          ) : (
            <Card padding="$4" backgroundColor="$backgroundHover">
              <Text color="$color10" textAlign="center">
                Keep logging your wins, kata, and reflections. Patterns will emerge over time.
              </Text>
            </Card>
          )}
        </YStack>
      </YStack>

      {/* Add Kata Sheet */}
      <Sheet
        modal
        open={kataSheetOpen}
        onOpenChange={setKataSheetOpen}
        snapPoints={[85]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4" backgroundColor="$background">
          <Sheet.Handle />
          <YStack space="$4" marginTop="$4">
            <H4>Add New Kata</H4>

            <YStack space="$2">
              <Text fontSize="$3" color="$color11">
                Name *
              </Text>
              <Input
                placeholder="e.g., Morning Breathwork"
                value={newKata.name}
                onChangeText={(text) => setNewKata({ ...newKata, name: text })}
              />
            </YStack>

            <YStack space="$2">
              <Text fontSize="$3" color="$color11">
                Description
              </Text>
              <TextArea
                placeholder="What does this practice involve?"
                value={newKata.description}
                onChangeText={(text) => setNewKata({ ...newKata, description: text })}
                numberOfLines={3}
              />
            </YStack>

            <YStack space="$2">
              <Text fontSize="$3" color="$color11">
                Frequency
              </Text>
              <XStack space="$2" flexWrap="wrap">
                {(['daily', 'weekly', 'as-needed'] as const).map((freq) => (
                  <Button
                    key={freq}
                    size="$3"
                    backgroundColor={newKata.frequency === freq ? 'blue' : '$color5'}
                    onPress={() => setNewKata({ ...newKata, frequency: freq })}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack space="$2">
              <Text fontSize="$3" color="$color11">
                Category
              </Text>
              <XStack space="$2" flexWrap="wrap">
                {(['physical', 'energetic', 'mental', 'custom'] as const).map((cat) => (
                  <Button
                    key={cat}
                    size="$3"
                    backgroundColor={newKata.category === cat ? 'green' : '$color5'}
                    onPress={() => setNewKata({ ...newKata, category: cat })}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <XStack space="$3" marginTop="$4">
              <Button flex={1} backgroundColor="$color5" onPress={() => setKataSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                flex={1}
                backgroundColor="green"
                onPress={handleAddKata}
                disabled={!newKata.name.trim()}
              >
                Add Kata
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </ScrollView>
  )
}

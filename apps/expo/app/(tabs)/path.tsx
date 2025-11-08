/**
 * The Sovereign's Path (Expo/Native)
 * My Blueprint, My Archetype, My Kata, My Patterns
 * Integrated view of psychometric profile, practices, and pattern analysis
 */

import { useState } from 'react'
import {
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  YStack,
  XStack,
  H1,
  H2,
  H3,
  Paragraph,
  Button,
  Card,
  Select,
  Input,
  TextArea,
  Separator,
  Sheet,
  Label,
  Spinner,
  Tabs,
} from '@my/ui'
import {
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  CheckCircle,
  Trash2,
  X,
  Activity,
  Fingerprint,
} from '@tamagui/lucide-icons'
import { useSovereignPathStore, useSovereignLogStore } from 'app/lib/store'
import { KeyboardDismissButton, FLOATING_NAV_HEIGHT } from 'app'
import { BlueprintCalculator } from 'app/features/BlueprintCalculator'
import { StealthAssessment } from 'app/features/StealthAssessment'
import type { Kata } from 'app/types'
import { semanticColors, iconColors } from 'app/lib/theme-colors'

export default function SovereignPathScreen() {
  const insets = useSafeAreaInsets()
  const [currentTab, setCurrentTab] = useState('blueprint')

  const katas = useSovereignPathStore((state) => state.katas)
  const archetypeAnalysis = useSovereignPathStore((state) => state.archetypeAnalysis)
  const needsArchetypeUpdate = useSovereignPathStore((state) => state.needsArchetypeUpdate)
  const addKata = useSovereignPathStore((state) => state.addKata)
  const deleteKata = useSovereignPathStore((state) => state.deleteKata)
  const completeKata = useSovereignPathStore((state) => state.completeKata)
  const setArchetypeAnalysis = useSovereignPathStore((state) => state.setArchetypeAnalysis)
  const getPatternInsights = useSovereignPathStore((state) => state.getPatternInsights)

  const sovereignEntries = useSovereignLogStore((state) => state.sovereignEntries)

  const [showAddKataSheet, setShowAddKataSheet] = useState(false)
  const [kataName, setKataName] = useState('')
  const [kataDescription, setKataDescription] = useState('')
  const [kataFrequency, setKataFrequency] = useState<'daily' | 'weekly' | 'as-needed'>('daily')
  const [kataCategory, setKataCategory] = useState<Kata['category']>('physical')
  const [analyzingArchetype, setAnalyzingArchetype] = useState(false)

  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8
  const patternInsights = getPatternInsights(sovereignEntries)
  const shouldUpdateArchetype = needsArchetypeUpdate(sovereignEntries.length)

  const handleAddKata = () => {
    if (!kataName) return

    addKata({
      name: kataName,
      description: kataDescription,
      frequency: kataFrequency,
      category: kataCategory,
    })

    setShowAddKataSheet(false)
    setKataName('')
    setKataDescription('')
    setKataFrequency('daily')
    setKataCategory('physical')
  }

  const handleAnalyzeArchetype = async () => {
    setAnalyzingArchetype(true)

    try {
      const apiUrl = __DEV__
        ? 'http://localhost:3000/api/chat'
        : 'https://your-production-url.vercel.app/api/chat'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Based on my Sovereign's Log entries, provide a comprehensive Jungian archetype analysis.

Analyze the following data and determine my primary archetype, shadow patterns, and integration path:

Recent Log Summary (${sovereignEntries.length} total entries):
${sovereignEntries
  .slice(0, 20)
  .map(
    (e) => `
- ${e.entryType}: ${e.routineName || e.urgeState || e.customUrgeState} → ${e.actionTaken || e.customActionTaken}
  Energy: ${e.energyLevel}/10 | Time: ${new Date(e.timestamp).toLocaleString()}
  ${e.notes ? `Notes: ${e.notes}` : ''}
`
  )
  .join('\n')}

Provide your analysis in this exact format:
ARCHETYPE: [Primary archetype name]
DESCRIPTION: [2-3 sentences describing this archetype]
STRENGTHS: [3-5 bullet points of strengths]
CHALLENGES: [3-5 bullet points of challenges/shadow aspects]
GUIDANCE: [Specific actionable guidance for integration and sovereignty]`,
          history: [],
        }),
      })

      const data = await response.json()

      if (data.response) {
        // Parse the AI response
        const text = data.response
        const archetypeMatch = text.match(/ARCHETYPE:\s*(.+?)(?=\n|$)/i)
        const descriptionMatch = text.match(/DESCRIPTION:\s*(.+?)(?=\nSTRENGTHS:|\n\n|$)/is)
        const strengthsMatch = text.match(/STRENGTHS:\s*(.+?)(?=\nCHALLENGES:|\n\n|$)/is)
        const challengesMatch = text.match(/CHALLENGES:\s*(.+?)(?=\nGUIDANCE:|\n\n|$)/is)
        const guidanceMatch = text.match(/GUIDANCE:\s*(.+?)$/is)

        const parseList = (text: string) => {
          return text
            .split('\n')
            .map((line) => line.replace(/^[-*•]\s*/, '').trim())
            .filter((line) => line.length > 0)
        }

        setArchetypeAnalysis({
          archetype: archetypeMatch?.[1]?.trim() || 'The Sovereign Initiate',
          description: descriptionMatch?.[1]?.trim() || text.substring(0, 200),
          strengths: strengthsMatch ? parseList(strengthsMatch[1]) : [],
          challenges: challengesMatch ? parseList(challengesMatch[1]) : [],
          guidance: guidanceMatch?.[1]?.trim() || text,
          analyzedAt: new Date().toISOString(),
          basedOnEntryCount: sovereignEntries.length,
        })
      }
    } catch (error) {
      console.error('Error analyzing archetype:', error)
    } finally {
      setAnalyzingArchetype(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          flex={1}
          backgroundColor="$background"
          paddingTop={topPadding}
          paddingBottom={FLOATING_NAV_HEIGHT}
        >
          <YStack paddingHorizontal="$4" gap="$4" paddingBottom="$4">
            <H1>The Sovereign's Path</H1>
            <Paragraph size="$3" color="$color11">
              Your blueprint, practices, patterns, and AI-guided archetype
            </Paragraph>
          </YStack>

          <Tabs value={currentTab} onValueChange={setCurrentTab} flexDirection="column" flex={1}>
            <Tabs.List separator={<Separator vertical />} paddingHorizontal="$4">
              <Tabs.Tab value="blueprint" flex={1}>
                <XStack gap="$2" alignItems="center">
                  <Fingerprint size={16} />
                  <Paragraph size="$3">Blueprint</Paragraph>
                </XStack>
              </Tabs.Tab>
              <Tabs.Tab value="archetype" flex={1}>
                <XStack gap="$2" alignItems="center">
                  <Sparkles size={16} />
                  <Paragraph size="$3">Archetype</Paragraph>
                </XStack>
              </Tabs.Tab>
              <Tabs.Tab value="katas" flex={1}>
                <XStack gap="$2" alignItems="center">
                  <Target size={16} />
                  <Paragraph size="$3">Katas</Paragraph>
                </XStack>
              </Tabs.Tab>
              <Tabs.Tab value="patterns" flex={1}>
                <XStack gap="$2" alignItems="center">
                  <Activity size={16} />
                  <Paragraph size="$3">Patterns</Paragraph>
                </XStack>
              </Tabs.Tab>
            </Tabs.List>

            {/* Blueprint Tab - Human Design + MBTI */}
            <Tabs.Content value="blueprint" padding="$0">
              <YStack gap="$4" paddingTop="$4">
                <YStack gap="$4" paddingHorizontal="$4">
                  <H2>My Blueprint</H2>
                  <Paragraph size="$3" color="$color11">
                    Your psychometric foundation: Human Design chart and personality profile
                  </Paragraph>
                </YStack>

                <Separator />

                <YStack gap="$6">
                  {/* Human Design Calculator */}
                  <BlueprintCalculator />

                  <Separator marginHorizontal="$4" />

                  {/* OEJTS/MBTI Stealth Assessment */}
                  <StealthAssessment />
                </YStack>
              </YStack>
            </Tabs.Content>

            {/* Archetype Tab */}
            <Tabs.Content value="archetype" padding="$0">
              <YStack gap="$4" paddingTop="$4" paddingHorizontal="$4">
                {/* My Archetype Section */}
                <YStack gap="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <H2>My Archetype</H2>
                    <Button
                      size="$3"
                      icon={analyzingArchetype ? Spinner : Sparkles}
                      backgroundColor={shouldUpdateArchetype ? 'yellow' : 'blue'}
                      disabled={analyzingArchetype}
                      onPress={handleAnalyzeArchetype}
                    >
                      {analyzingArchetype
                        ? 'Analyzing...'
                        : shouldUpdateArchetype
                          ? 'Update'
                          : 'Analyze'}
                    </Button>
                  </XStack>

                  {archetypeAnalysis ? (
                    <Card backgroundColor="$color2" padding="$4" gap="$3">
                      <H3>{archetypeAnalysis.archetype}</H3>
                      <Paragraph>{archetypeAnalysis.description}</Paragraph>

                      <YStack gap="$2">
                        <Paragraph fontWeight="600" color={semanticColors.success.text}>
                          Strengths:
                        </Paragraph>
                        {archetypeAnalysis.strengths.map((strength, idx) => (
                          <Paragraph key={idx} size="$3">
                            • {strength}
                          </Paragraph>
                        ))}
                      </YStack>

                      <YStack gap="$2">
                        <Paragraph fontWeight="600" color={semanticColors.warning.text}>
                          Challenges:
                        </Paragraph>
                        {archetypeAnalysis.challenges.map((challenge, idx) => (
                          <Paragraph key={idx} size="$3">
                            • {challenge}
                          </Paragraph>
                        ))}
                      </YStack>

                      <YStack gap="$2">
                        <Paragraph fontWeight="600" color={semanticColors.primary.text}>
                          Guidance:
                        </Paragraph>
                        <Paragraph size="$3">{archetypeAnalysis.guidance}</Paragraph>
                      </YStack>

                      <Paragraph size="$2" color="$color11">
                        Based on {archetypeAnalysis.basedOnEntryCount} journal entries
                      </Paragraph>
                    </Card>
                  ) : (
                    <Card backgroundColor="$color2" padding="$4">
                      <Paragraph color="$color11">
                        {sovereignEntries.length < 5
                          ? `Complete ${5 - sovereignEntries.length} more journal entries to unlock archetype analysis.`
                          : 'Tap "Analyze" to discover your archetype based on your journal patterns.'}
                      </Paragraph>
                    </Card>
                  )}
                </YStack>

                <Separator />

                {/* My Kata Section */}
                <YStack gap="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <H2>My Kata</H2>
                    <Button
                      size="$3"
                      icon={Plus}
                      backgroundColor={semanticColors.success.background}
                      borderColor={semanticColors.success.border}
                      onPress={() => setShowAddKataSheet(true)}
                    >
                      Add Kata
                    </Button>
                  </XStack>

                  {katas.length === 0 ? (
                    <Card backgroundColor="$color2" padding="$4">
                      <Paragraph color="$color11">
                        No Katas defined. Your Kata is your non-negotiable daily practice. Add your
                        first.
                      </Paragraph>
                    </Card>
                  ) : (
                    <YStack gap="$3">
                      {katas.map((kata) => (
                        <Card key={kata.id} backgroundColor="$color2" padding="$3" gap="$2">
                          <XStack justifyContent="space-between" alignItems="flex-start">
                            <YStack flex={1} gap="$1">
                              <H3>{kata.name}</H3>
                              <Paragraph size="$3" color="$color11">
                                {kata.description}
                              </Paragraph>
                              <XStack gap="$2" alignItems="center" marginTop="$1">
                                <Paragraph size="$2" color="$color10">
                                  {kata.frequency}
                                </Paragraph>
                                <Paragraph size="$2" color="$color10">
                                  •
                                </Paragraph>
                                <Paragraph size="$2" color="$color10">
                                  {kata.category}
                                </Paragraph>
                                {kata.completionCount !== undefined && kata.completionCount > 0 && (
                                  <>
                                    <Paragraph size="$2" color="$color10">
                                      •
                                    </Paragraph>
                                    <Paragraph size="$2" color={semanticColors.success.text}>
                                      {kata.completionCount} completions
                                    </Paragraph>
                                  </>
                                )}
                              </XStack>
                            </YStack>
                            <XStack gap="$2">
                              <Button
                                size="$2"
                                icon={CheckCircle}
                                backgroundColor={semanticColors.success.background}
                                borderColor={semanticColors.success.border}
                                onPress={() => completeKata(kata.id)}
                              >
                                Complete
                              </Button>
                              <Button
                                size="$2"
                                icon={Trash2}
                                backgroundColor={semanticColors.error.background}
                                borderColor={semanticColors.error.border}
                                onPress={() => deleteKata(kata.id)}
                              />
                            </XStack>
                          </XStack>
                        </Card>
                      ))}
                    </YStack>
                  )}
                </YStack>

                <Separator />

                {/* My Patterns Section */}
                <YStack gap="$3">
                  <H2>My Patterns</H2>

                  {patternInsights.length === 0 ? (
                    <Card backgroundColor="$color2" padding="$4">
                      <Paragraph color="$color11">
                        {sovereignEntries.length < 3
                          ? `Complete ${3 - sovereignEntries.length} more journal entries to see pattern analysis.`
                          : 'Pattern analysis will appear here as data accumulates.'}
                      </Paragraph>
                    </Card>
                  ) : (
                    <YStack gap="$3">
                      {patternInsights.map((insight, idx) => (
                        <Card
                          key={idx}
                          backgroundColor={
                            insight.type === 'leak'
                              ? 'red'
                              : insight.type === 'potency'
                                ? 'green'
                                : insight.type === 'consistency'
                                  ? 'blue'
                                  : 'yellow'
                          }
                          borderColor={
                            insight.type === 'leak'
                              ? 'red'
                              : insight.type === 'potency'
                                ? 'green'
                                : insight.type === 'consistency'
                                  ? 'blue'
                                  : 'yellow'
                          }
                          borderWidth={1}
                          padding="$4"
                          gap="$2"
                        >
                          <XStack gap="$2" alignItems="center">
                            {insight.type === 'leak' && <Zap size={20} color={iconColors.error} />}
                            {insight.type === 'potency' && (
                              <TrendingUp size={20} color={iconColors.success} />
                            )}
                            {insight.type === 'consistency' && (
                              <Target size={20} color={iconColors.primary} />
                            )}
                            {insight.type === 'breakthrough' && (
                              <Sparkles size={20} color={iconColors.warning} />
                            )}
                            <H3>{insight.title}</H3>
                          </XStack>
                          <Paragraph>{insight.description}</Paragraph>
                          {insight.timePattern && (
                            <Paragraph size="$3" fontWeight="600" color="$color12">
                              Pattern: {insight.timePattern}
                            </Paragraph>
                          )}
                          {insight.recommendation && (
                            <Card backgroundColor="$background" padding="$3" marginTop="$2">
                              <Paragraph size="$3" fontWeight="600" marginBottom="$1">
                                Battle Plan:
                              </Paragraph>
                              <Paragraph size="$3">{insight.recommendation}</Paragraph>
                            </Card>
                          )}
                        </Card>
                      ))}
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </Tabs.Content>

            {/* Katas Tab (needs similar wrapper) */}
            <Tabs.Content value="katas" padding="$0">
              <YStack paddingTop="$4" gap="$4" paddingHorizontal="$4">
                {/* Katas content moved here */}
                <Paragraph>Katas tab content - to be implemented</Paragraph>
              </YStack>
            </Tabs.Content>

            {/* Patterns Tab (needs similar wrapper) */}
            <Tabs.Content value="patterns" padding="$0">
              <YStack paddingTop="$4" gap="$4" paddingHorizontal="$4">
                {/* Patterns content moved here */}
                <Paragraph>Patterns tab content - to be implemented</Paragraph>
              </YStack>
            </Tabs.Content>
          </Tabs>
        </YStack>
      </ScrollView>

      {/* Add Kata Sheet */}
      <Sheet
        modal
        open={showAddKataSheet}
        onOpenChange={setShowAddKataSheet}
        snapPoints={[85]}
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
              onPress={() => setShowAddKataSheet(false)}
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
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: FLOATING_NAV_HEIGHT }}
              nestedScrollEnabled={true}
            >
              <YStack gap="$4" paddingBottom="$4">
                <H2>Add New Kata</H2>

                <YStack gap="$2">
                  <Label>Kata Name</Label>
                  <Input
                    value={kataName}
                    onChangeText={setKataName}
                    placeholder="e.g., Morning Cold Shower"
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </YStack>

                <YStack gap="$2">
                  <Label>Description</Label>
                  <TextArea
                    value={kataDescription}
                    onChangeText={setKataDescription}
                    placeholder="Why is this non-negotiable for you?"
                    height={80}
                    blurOnSubmit={false}
                    returnKeyType="default"
                  />
                </YStack>

                <YStack gap="$2">
                  <Label>Frequency</Label>
                  <Select
                    value={kataFrequency}
                    onValueChange={(val) => setKataFrequency(val as any)}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select frequency" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        <Select.Item index={0} value="daily">
                          <Select.ItemText>Daily</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={1} value="weekly">
                          <Select.ItemText>Weekly</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={2} value="as-needed">
                          <Select.ItemText>As Needed</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack gap="$2">
                  <Label>Category</Label>
                  <Select value={kataCategory} onValueChange={(val) => setKataCategory(val as any)}>
                    <Select.Trigger>
                      <Select.Value placeholder="Select category" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Viewport>
                        <Select.Item index={0} value="physical">
                          <Select.ItemText>Physical</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={1} value="energetic">
                          <Select.ItemText>Energetic</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={2} value="mental">
                          <Select.ItemText>Mental</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={3} value="custom">
                          <Select.ItemText>Custom</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </YStack>

                <XStack gap="$3">
                  <Button
                    flex={1}
                    size="$4"
                    backgroundColor="$color5"
                    onPress={() => {
                      setShowAddKataSheet(false)
                      setKataName('')
                      setKataDescription('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    flex={2}
                    size="$4"
                    backgroundColor={semanticColors.success.background}
                    borderColor={semanticColors.success.border}
                    onPress={handleAddKata}
                    disabled={!kataName}
                  >
                    Add Kata
                  </Button>
                </XStack>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
          <KeyboardDismissButton />
        </Sheet.Frame>
      </Sheet>
    </KeyboardAvoidingView>
  )
}

/**
 * The Sovereign's Log (Next.js/Web)
 * Dynamic journal for tracking urges, interactions, dreams, thoughts, wins/kata
 * Per the King's Dialogue: "Document almost anything... structured and well organized"
 */

'use client'

import { useState } from 'react'
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
  Slider,
  Separator,
  Sheet,
  Label,
  ScrollView,
  Spinner,
} from '@my/ui'
import { Plus, Sparkles, Calendar, Trash2 } from '@tamagui/lucide-icons'
import { useSovereignLogStore } from 'app/lib/store'
import type {
  SovereignLogEntry,
  SovereignLogEntryType,
  UrgeStateType,
  ActionTakenType,
  CustomField,
} from 'app/types'

export default function SovereignLogPage() {
  const sovereignEntries = useSovereignLogStore((state) => state.sovereignEntries)
  const addSovereignEntry = useSovereignLogStore((state) => state.addSovereignEntry)
  const deleteSovereignEntry = useSovereignLogStore((state) => state.deleteSovereignEntry)
  const updateEntryAnalysis = useSovereignLogStore((state) => state.updateEntryAnalysis)

  const [showNewEntrySheet, setShowNewEntrySheet] = useState(false)
  const [entryType, setEntryType] = useState<SovereignLogEntryType>('Urge/Symptom')
  const [urgeState, setUrgeState] = useState<UrgeStateType>('Arousal')
  const [customUrgeState, setCustomUrgeState] = useState('')
  const [actionTaken, setActionTaken] = useState<ActionTakenType>('Observed (Mushin)')
  const [customActionTaken, setCustomActionTaken] = useState('')
  const [energyLevel, setEnergyLevel] = useState<number[]>([5])
  const [notes, setNotes] = useState('')

  // AI Analysis state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null)

  // Interaction-specific fields
  const [personsInvolved, setPersonsInvolved] = useState('')
  const [myAction, setMyAction] = useState('')
  const [theirReaction, setTheirReaction] = useState('')

  // Dream-specific fields
  const [dreamDescription, setDreamDescription] = useState('')

  // Custom fields
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showAddFieldSheet, setShowAddFieldSheet] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const resetForm = () => {
    setEntryType('Urge/Symptom')
    setUrgeState('Arousal')
    setCustomUrgeState('')
    setActionTaken('Observed (Mushin)')
    setCustomActionTaken('')
    setEnergyLevel([5])
    setNotes('')
    setPersonsInvolved('')
    setMyAction('')
    setTheirReaction('')
    setDreamDescription('')
    setCustomFields([])
  }

  const handleAddEntry = () => {
    const entry: Omit<SovereignLogEntry, 'id' | 'timestamp'> = {
      entryType,
      urgeState: urgeState !== 'Custom' ? urgeState : undefined,
      customUrgeState: urgeState === 'Custom' ? customUrgeState : undefined,
      actionTaken: actionTaken !== 'Custom' ? actionTaken : undefined,
      customActionTaken: actionTaken === 'Custom' ? customActionTaken : undefined,
      energyLevel: energyLevel[0],
      notes: notes || undefined,
      personsInvolved: entryType === 'Interaction' ? personsInvolved : undefined,
      myAction: entryType === 'Interaction' ? myAction : undefined,
      theirReaction: entryType === 'Interaction' ? theirReaction : undefined,
      dreamDescription: entryType === 'Dream' ? dreamDescription : undefined,
      customFields: customFields.length > 0 ? customFields : undefined,
    }

    addSovereignEntry(entry)
    setShowNewEntrySheet(false)
    resetForm()
  }

  const handleAddCustomField = () => {
    if (newFieldLabel && newFieldValue) {
      setCustomFields([
        ...customFields,
        {
          id: `field-${Date.now()}`,
          label: newFieldLabel,
          value: newFieldValue,
        },
      ])
      setNewFieldLabel('')
      setNewFieldValue('')
      setShowAddFieldSheet(false)
    }
  }

  const handleDeleteCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id))
  }

  const handleAnalyzeEntry = async (entry: SovereignLogEntry) => {
    setAnalyzingId(entry.id)

    try {
      // Call the API route (local for web)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Analyze this journal entry with ruthless precision. Provide a Machiavellian battle-plan based on the data.

Entry Details:
- Type: ${entry.entryType}
${entry.routineName ? `- Routine Completed: ${entry.routineName} (${entry.routineType})` : ''}
${entry.mood ? `- Mood: ${entry.mood}` : ''}
${entry.difficulty ? `- Difficulty: ${entry.difficulty}` : ''}
${entry.physicalSensations && entry.physicalSensations.length > 0 ? `- Physical Sensations: ${entry.physicalSensations.join(', ')}` : ''}
${entry.emotionalState ? `- Emotional State: ${entry.emotionalState}` : ''}
- Urge State: ${entry.urgeState || entry.customUrgeState || 'N/A'}
- Action Taken: ${entry.actionTaken || entry.customActionTaken || 'N/A'}
- Energy Level: ${entry.energyLevel}/10
- Time: ${new Date(entry.timestamp).toLocaleString()}
${entry.notes ? `- Notes: ${entry.notes}` : ''}
${entry.personsInvolved ? `- Persons Involved: ${entry.personsInvolved}` : ''}
${entry.myAction ? `- My Action: ${entry.myAction}` : ''}
${entry.theirReaction ? `- Their Reaction: ${entry.theirReaction}` : ''}
${entry.dreamDescription ? `- Dream: ${entry.dreamDescription}` : ''}
${entry.customFields ? entry.customFields.map((f) => `- ${f.label}: ${f.value}`).join('\n') : ''}

Full Log History (for pattern analysis):
${sovereignEntries
  .slice(0, 10)
  .map(
    (e) =>
      `[${new Date(e.timestamp).toLocaleString()}] ${e.entryType}: ${e.routineName || e.urgeState || e.customUrgeState} → ${e.actionTaken || e.customActionTaken} (Energy: ${e.energyLevel}/10)`
  )
  .join('\n')}`,
          history: [],
          sovereignLog: sovereignEntries, // Send full log for pattern analysis
        }),
      })

      const data = await response.json()

      if (data.response) {
        updateEntryAnalysis(entry.id, data.response)
        setExpandedAnalysisId(entry.id) // Automatically expand to show analysis
      } else {
        updateEntryAnalysis(entry.id, 'Analysis failed. Please try again.')
      }
    } catch (error) {
      console.error('Error analyzing entry:', error)
      updateEntryAnalysis(entry.id, 'Failed to connect to AI.')
    } finally {
      setAnalyzingId(null)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getEntryTypeFields = () => {
    switch (entryType) {
      case 'Interaction':
        return (
          <>
            <YStack gap="$2">
              <Label>Person(s) Involved</Label>
              <Input
                value={personsInvolved}
                onChangeText={setPersonsInvolved}
                placeholder="Who was involved?"
              />
            </YStack>
            <YStack gap="$2">
              <Label>My Action</Label>
              <TextArea
                value={myAction}
                onChangeText={setMyAction}
                placeholder="What did I do/say?"
                minHeight={60}
              />
            </YStack>
            <YStack gap="$2">
              <Label>Their Reaction</Label>
              <TextArea
                value={theirReaction}
                onChangeText={setTheirReaction}
                placeholder="How did they respond?"
                minHeight={60}
              />
            </YStack>
          </>
        )
      case 'Dream':
        return (
          <YStack gap="$2">
            <Label>Dream Description</Label>
            <TextArea
              value={dreamDescription}
              onChangeText={setDreamDescription}
              placeholder="Describe the dream, symbols, feelings..."
              minHeight={100}
            />
          </YStack>
        )
      default:
        return null
    }
  }

  return (
    <>
      <ScrollView>
        <YStack flex={1} p="$4" pt={80} gap="$4" bg="$background" minHeight="100vh">
          {/* Header */}
          <YStack gap="$2">
            <H1>The Sovereign's Log</H1>
            <Paragraph opacity={0.7} size="$5">
              Your ruthless logbook of energy, patterns, and transmutation
            </Paragraph>
          </YStack>

          {/* Add Entry Button */}
          <Button size="$5" bg="green" icon={Plus} onPress={() => setShowNewEntrySheet(true)}>
            Log New Entry
          </Button>

          {/* Entry List */}
          <YStack gap="$3">
            {sovereignEntries.length === 0 ? (
              <Card padded>
                <Paragraph textAlign="center" opacity={0.6}>
                  No entries yet. Begin documenting your path.
                </Paragraph>
              </Card>
            ) : (
              sovereignEntries
                .slice()
                .reverse()
                .map((entry) => (
                  <Card key={entry.id} elevate bordered padded>
                    <YStack gap="$2">
                      {/* Header */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack flex={1}>
                          <H3 size="$5">{entry.entryType}</H3>
                          <XStack gap="$2" alignItems="center">
                            <Calendar size={14} opacity={0.6} />
                            <Paragraph size="$2" opacity={0.6}>
                              {formatTimestamp(entry.timestamp)}
                            </Paragraph>
                          </XStack>
                        </YStack>
                        <Button
                          size="$2"
                          chromeless
                          icon={Trash2}
                          onPress={() => deleteSovereignEntry(entry.id)}
                        />
                      </XStack>

                      <Separator />

                      {/* Content */}
                      <YStack gap="$2">
                        {entry.urgeState && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              State:
                            </Paragraph>
                            <Paragraph size="$3">{entry.urgeState}</Paragraph>
                          </XStack>
                        )}
                        {entry.customUrgeState && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              State:
                            </Paragraph>
                            <Paragraph size="$3">{entry.customUrgeState}</Paragraph>
                          </XStack>
                        )}
                        {entry.actionTaken && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              Action:
                            </Paragraph>
                            <Paragraph size="$3">{entry.actionTaken}</Paragraph>
                          </XStack>
                        )}
                        {entry.customActionTaken && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              Action:
                            </Paragraph>
                            <Paragraph size="$3">{entry.customActionTaken}</Paragraph>
                          </XStack>
                        )}
                        {entry.energyLevel !== undefined && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              Energy:
                            </Paragraph>
                            <Paragraph size="$3">{entry.energyLevel}/10</Paragraph>
                          </XStack>
                        )}
                        {entry.personsInvolved && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              With:
                            </Paragraph>
                            <Paragraph size="$3">{entry.personsInvolved}</Paragraph>
                          </XStack>
                        )}
                        {entry.myAction && (
                          <YStack gap="$1">
                            <Paragraph fontWeight="600" size="$3">
                              My Action:
                            </Paragraph>
                            <Paragraph size="$3">{entry.myAction}</Paragraph>
                          </YStack>
                        )}
                        {entry.theirReaction && (
                          <YStack gap="$1">
                            <Paragraph fontWeight="600" size="$3">
                              Their Reaction:
                            </Paragraph>
                            <Paragraph size="$3">{entry.theirReaction}</Paragraph>
                          </YStack>
                        )}
                        {entry.dreamDescription && (
                          <YStack gap="$1">
                            <Paragraph fontWeight="600" size="$3">
                              Dream:
                            </Paragraph>
                            <Paragraph size="$3">{entry.dreamDescription}</Paragraph>
                          </YStack>
                        )}

                        {/* Routine Completion Fields (Win/Kata type) */}
                        {entry.routineName && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              Routine:
                            </Paragraph>
                            <Paragraph size="$3">{entry.routineName}</Paragraph>
                          </XStack>
                        )}
                        {entry.mood && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              Mood:
                            </Paragraph>
                            <Paragraph size="$3">{entry.mood}</Paragraph>
                          </XStack>
                        )}
                        {entry.physicalSensations && entry.physicalSensations.length > 0 && (
                          <YStack gap="$1">
                            <Paragraph fontWeight="600" size="$3">
                              Physical Sensations:
                            </Paragraph>
                            <XStack gap="$2" flexWrap="wrap">
                              {entry.physicalSensations.map((sensation, idx) => (
                                <Paragraph
                                  key={idx}
                                  size="$2"
                                  backgroundColor="$color3"
                                  paddingHorizontal="$2"
                                  paddingVertical="$1"
                                  borderRadius="$2"
                                >
                                  {sensation}
                                </Paragraph>
                              ))}
                            </XStack>
                          </YStack>
                        )}
                        {entry.difficulty && (
                          <XStack gap="$2">
                            <Paragraph fontWeight="600" size="$3">
                              Difficulty:
                            </Paragraph>
                            <Paragraph size="$3">{entry.difficulty}</Paragraph>
                          </XStack>
                        )}
                        {entry.emotionalState && (
                          <YStack gap="$1">
                            <Paragraph fontWeight="600" size="$3">
                              Emotional State:
                            </Paragraph>
                            <Paragraph size="$3">{entry.emotionalState}</Paragraph>
                          </YStack>
                        )}

                        {entry.notes && (
                          <YStack gap="$1">
                            <Paragraph fontWeight="600" size="$3">
                              Notes:
                            </Paragraph>
                            <Paragraph size="$3">{entry.notes}</Paragraph>
                          </YStack>
                        )}
                        {entry.customFields && entry.customFields.length > 0 && (
                          <YStack gap="$1">
                            {entry.customFields.map((field) => (
                              <XStack key={field.id} gap="$2">
                                <Paragraph fontWeight="600" size="$3">
                                  {field.label}:
                                </Paragraph>
                                <Paragraph size="$3">{field.value}</Paragraph>
                              </XStack>
                            ))}
                          </YStack>
                        )}
                      </YStack>

                      {/* AI Analysis Button */}
                      <Button
                        size="$3"
                        mt="$2"
                        icon={analyzingId === entry.id ? Spinner : Sparkles}
                        backgroundColor="blue"
                        disabled={analyzingId === entry.id}
                        onPress={() => handleAnalyzeEntry(entry)}
                      >
                        {analyzingId === entry.id ? 'Analyzing...' : 'Analyze Entry'}
                      </Button>

                      {/* Show AI Analysis if available */}
                      {entry.aiAnalysis && (
                        <>
                          <Button
                            size="$2"
                            mt="$2"
                            chromeless
                            onPress={() =>
                              setExpandedAnalysisId(
                                expandedAnalysisId === entry.id ? null : entry.id
                              )
                            }
                          >
                            {expandedAnalysisId === entry.id ? 'Hide' : 'Show'} Sovereign Analysis
                          </Button>

                          {expandedAnalysisId === entry.id && (
                            <Card
                              backgroundColor="$background"
                              borderColor="$borderColor"
                              padding="$3"
                              mt="$2"
                            >
                              <Paragraph fontSize="$3" lineHeight="$3">
                                {entry.aiAnalysis}
                              </Paragraph>
                            </Card>
                          )}
                        </>
                      )}
                    </YStack>
                  </Card>
                ))
            )}
          </YStack>
        </YStack>
      </ScrollView>

      {/* New Entry Sheet */}
      <Sheet
        modal
        open={showNewEntrySheet}
        onOpenChange={setShowNewEntrySheet}
        snapPoints={[90]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame p="$4" gap="$4">
          <Sheet.Handle />
          <ScrollView>
            <YStack gap="$4" pb="$8">
              <H2>Log New Entry</H2>

              {/* Entry Type */}
              <YStack gap="$2">
                <Label>What are you logging?</Label>
                <Select
                  value={entryType}
                  onValueChange={(v) => setEntryType(v as SovereignLogEntryType)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select entry type" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Viewport>
                      <Select.Item index={0} value="Urge/Symptom">
                        <Select.ItemText>Urge/Symptom</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="Interaction">
                        <Select.ItemText>Interaction</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="Dream">
                        <Select.ItemText>Dream</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={3} value="Thought">
                        <Select.ItemText>Thought</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={4} value="Win/Kata">
                        <Select.ItemText>Win/Kata</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={5} value="Custom">
                        <Select.ItemText>Custom</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </YStack>

              {/* Urge/State */}
              <YStack gap="$2">
                <Label>State</Label>
                <Select value={urgeState} onValueChange={(v) => setUrgeState(v as UrgeStateType)}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select state" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Viewport>
                      <Select.Item index={0} value="Arousal">
                        <Select.ItemText>Arousal</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="Fog">
                        <Select.ItemText>Fog</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="Boredom">
                        <Select.ItemText>Boredom</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={3} value="Anger">
                        <Select.ItemText>Anger</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={4} value="Clarity">
                        <Select.ItemText>Clarity</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={5} value="Power">
                        <Select.ItemText>Power</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={6} value="Custom">
                        <Select.ItemText>Custom</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
                {urgeState === 'Custom' && (
                  <Input
                    value={customUrgeState}
                    onChangeText={setCustomUrgeState}
                    placeholder="Describe your state"
                  />
                )}
              </YStack>

              {/* Action Taken */}
              <YStack gap="$2">
                <Label>Action Taken</Label>
                <Select
                  value={actionTaken}
                  onValueChange={(v) => setActionTaken(v as ActionTakenType)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select action" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Viewport>
                      <Select.Item index={0} value="Leaked (Released)">
                        <Select.ItemText>Leaked (Released)</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="Transmuted (Alchemized)">
                        <Select.ItemText>Transmuted (Alchemized)</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="Observed (Mushin)">
                        <Select.ItemText>Observed (Mushin)</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={3} value="Acted (Kata)">
                        <Select.ItemText>Acted (Kata)</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={4} value="Custom">
                        <Select.ItemText>Custom</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
                {actionTaken === 'Custom' && (
                  <Input
                    value={customActionTaken}
                    onChangeText={setCustomActionTaken}
                    placeholder="Describe your action"
                  />
                )}
              </YStack>

              {/* Energy Level */}
              <YStack gap="$2">
                <XStack justifyContent="space-between">
                  <Label>Energy Level</Label>
                  <Paragraph size="$5" fontWeight="600">
                    {energyLevel[0]}/10
                  </Paragraph>
                </XStack>
                <Slider
                  value={energyLevel}
                  onValueChange={setEnergyLevel}
                  min={1}
                  max={10}
                  step={1}
                >
                  <Slider.Track>
                    <Slider.TrackActive />
                  </Slider.Track>
                  <Slider.Thumb circular index={0} />
                </Slider>
              </YStack>

              {/* Dynamic Entry Type Fields */}
              {getEntryTypeFields()}

              {/* Notes */}
              <YStack gap="$2">
                <Label>Notes (Optional)</Label>
                <TextArea
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional observations..."
                  minHeight={80}
                />
              </YStack>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <YStack gap="$2">
                  <Label>Custom Fields</Label>
                  {customFields.map((field) => (
                    <XStack key={field.id} gap="$2" alignItems="center">
                      <YStack flex={1}>
                        <Paragraph fontWeight="600" size="$3">
                          {field.label}
                        </Paragraph>
                        <Paragraph size="$3">{field.value}</Paragraph>
                      </YStack>
                      <Button
                        size="$2"
                        chromeless
                        icon={Trash2}
                        onPress={() => handleDeleteCustomField(field.id)}
                      />
                    </XStack>
                  ))}
                </YStack>
              )}

              {/* Add Custom Field Button */}
              <Button
                size="$3"
                backgroundColor="green"
                icon={Plus}
                onPress={() => setShowAddFieldSheet(true)}
              >
                Add Custom Field
              </Button>

              {/* Submit */}
              <XStack gap="$3">
                <Button
                  flex={1}
                  size="$4"
                  backgroundColor="$color5"
                  onPress={() => {
                    setShowNewEntrySheet(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button flex={1} size="$4" bg="green" onPress={handleAddEntry}>
                  Save Entry
                </Button>
              </XStack>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>

      {/* Add Custom Field Sheet */}
      <Sheet
        modal
        open={showAddFieldSheet}
        onOpenChange={setShowAddFieldSheet}
        snapPoints={[50]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame p="$4" gap="$4">
          <Sheet.Handle />
          <YStack gap="$4">
            <H3>Add Custom Field</H3>
            <YStack gap="$2">
              <Label>Field Label</Label>
              <Input
                value={newFieldLabel}
                onChangeText={setNewFieldLabel}
                placeholder="e.g., Lunar Phase, Location"
              />
            </YStack>
            <YStack gap="$2">
              <Label>Field Value</Label>
              <Input
                value={newFieldValue}
                onChangeText={setNewFieldValue}
                placeholder="e.g., Waning Gibbous, Home"
              />
            </YStack>
            <XStack gap="$3">
              <Button
                flex={1}
                size="$4"
                backgroundColor="$color5"
                onPress={() => {
                  setShowAddFieldSheet(false)
                  setNewFieldLabel('')
                  setNewFieldValue('')
                }}
              >
                Cancel
              </Button>
              <Button flex={1} size="$4" bg="green" onPress={handleAddCustomField}>
                Add Field
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}

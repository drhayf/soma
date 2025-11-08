/**
 * The Sovereign's Log (Expo/Native)
 * Dynamic journal for tracking urges, interactions, dreams, thoughts, wins/kata
 * Per the King's Dialogue: "Document almost anything... structured and well organized"
 */

import { useState, useRef } from 'react'
import {
  ScrollView,
  ScrollView as RNScrollView,
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
  Slider,
  Separator,
  Sheet,
  Label,
  Spinner,
} from '@my/ui'
import { Plus, Sparkles, Calendar, Trash2, X, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { useSovereignLogStore } from 'app/lib/store'
import { KeyboardDismissButton, FLOATING_NAV_HEIGHT } from 'app'
import type {
  SovereignLogEntry,
  SovereignLogEntryType,
  UrgeStateType,
  ActionTakenType,
  CustomField,
} from 'app/types'

export default function SovereignLogScreen() {
  const insets = useSafeAreaInsets()
  const sovereignEntries = useSovereignLogStore((state) => state.sovereignEntries)
  const addSovereignEntry = useSovereignLogStore((state) => state.addSovereignEntry)
  const deleteSovereignEntry = useSovereignLogStore((state) => state.deleteSovereignEntry)
  const updateEntryAnalysis = useSovereignLogStore((state) => state.updateEntryAnalysis)
  const saveDraft = useSovereignLogStore((state) => state.saveDraft)
  const loadDraft = useSovereignLogStore((state) => state.loadDraft)
  const deleteDraft = useSovereignLogStore((state) => state.deleteDraft)
  const drafts = useSovereignLogStore((state) => state.drafts)
  const collapsedEntries = useSovereignLogStore((state) => state.collapsedEntries)
  const toggleCollapsed = useSovereignLogStore((state) => state.toggleCollapsed)

  const [showNewEntrySheet, setShowNewEntrySheet] = useState(false)
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
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

  // Refs for auto-scroll
  const scrollViewRef = useRef<RNScrollView>(null)
  const notesRef = useRef<any>(null)

  // Top padding accounting for safe area
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8

  const hasFormChanges = () => {
    return (
      entryType !== 'Urge/Symptom' ||
      urgeState !== 'Arousal' ||
      customUrgeState !== '' ||
      actionTaken !== 'Observed (Mushin)' ||
      customActionTaken !== '' ||
      energyLevel[0] !== 5 ||
      notes !== '' ||
      personsInvolved !== '' ||
      myAction !== '' ||
      theirReaction !== '' ||
      dreamDescription !== '' ||
      customFields.length > 0
    )
  }

  const handleSaveDraft = () => {
    const draft = {
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

    const savedDraft = saveDraft(draft)

    // If we were editing a draft, delete the old one
    if (currentDraftId) {
      deleteDraft(currentDraftId)
    }

    setCurrentDraftId(savedDraft.id)
    setShowNewEntrySheet(false)
    setShowDraftDialog(false)
    resetForm()
  }

  const handleCloseSheet = () => {
    if (hasFormChanges()) {
      // Close the entry sheet first, then show dialog
      setShowNewEntrySheet(false)
      // Small delay to ensure proper state transition
      setTimeout(() => {
        setShowDraftDialog(true)
      }, 100)
    } else {
      setShowNewEntrySheet(false)
      resetForm()
    }
  }

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
    setCurrentDraftId(null)
  }

  const handleLoadDraft = (draftId: string) => {
    const draft = loadDraft(draftId)
    if (!draft) return

    // Populate form with draft data
    setEntryType(draft.entryType)
    if (draft.urgeState) setUrgeState(draft.urgeState)
    if (draft.customUrgeState) setCustomUrgeState(draft.customUrgeState)
    if (draft.actionTaken) setActionTaken(draft.actionTaken)
    if (draft.customActionTaken) setCustomActionTaken(draft.customActionTaken)
    if (draft.energyLevel !== undefined) setEnergyLevel([draft.energyLevel])
    if (draft.notes) setNotes(draft.notes)
    if (draft.personsInvolved) setPersonsInvolved(draft.personsInvolved)
    if (draft.myAction) setMyAction(draft.myAction)
    if (draft.theirReaction) setTheirReaction(draft.theirReaction)
    if (draft.dreamDescription) setDreamDescription(draft.dreamDescription)
    if (draft.customFields) setCustomFields(draft.customFields)

    // Track that we're editing this draft
    setCurrentDraftId(draftId)

    // Open the sheet
    setShowNewEntrySheet(true)
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
      // Call the Next.js API route (works for both native and web)
      const apiUrl = __DEV__
        ? 'http://localhost:3000/api/chat' // Dev: local Next.js server
        : 'https://your-production-url.vercel.app/api/chat' // Production: Vercel URL

      const response = await fetch(apiUrl, {
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
        // Handle error
        updateEntryAnalysis(entry.id, 'Analysis failed. Please try again.')
      }
    } catch (error) {
      console.error('Error analyzing entry:', error)
      updateEntryAnalysis(entry.id, 'Failed to connect to AI. Ensure the dev server is running.')
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
                blurOnSubmit={false}
                returnKeyType="next"
              />
            </YStack>
            <YStack gap="$2">
              <Label>Their Reaction</Label>
              <TextArea
                value={theirReaction}
                onChangeText={setTheirReaction}
                placeholder="How did they respond?"
                minHeight={60}
                blurOnSubmit={false}
                returnKeyType="done"
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
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </YStack>
        )
      default:
        return null
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <YStack
            flex={1}
            padding="$4"
            paddingTop={topPadding}
            gap="$4"
            backgroundColor="$background"
          >
            {/* Header */}
            <YStack gap="$2">
              <H1>The Sovereign's Log</H1>
              <Paragraph opacity={0.7} size="$5">
                Your ruthless logbook of energy, patterns, and transmutation
              </Paragraph>
            </YStack>

            {/* Add Entry Button */}
            <Button
              size="$5"
              backgroundColor="green"
              icon={Plus}
              onPress={() => setShowNewEntrySheet(true)}
            >
              Log New Entry
            </Button>

            {/* Drafts Section */}
            {Array.isArray(drafts) && drafts.length > 0 && (
              <YStack gap="$2">
                <H2 size="$6">Drafts</H2>
                {drafts
                  .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                  .map((draft) => (
                    <Card key={draft.id} bordered padded backgroundColor="$color2">
                      <XStack justifyContent="space-between" alignItems="center" gap="$3">
                        <YStack flex={1} gap="$1">
                          <H3 size="$4">{draft.entryType}</H3>
                          <Paragraph size="$2" opacity={0.6}>
                            Saved {new Date(draft.savedAt).toLocaleString()}
                          </Paragraph>
                          {draft.notes && (
                            <Paragraph size="$3" numberOfLines={1} opacity={0.7}>
                              {draft.notes}
                            </Paragraph>
                          )}
                        </YStack>
                        <XStack gap="$2">
                          <Button
                            size="$3"
                            backgroundColor="blue"
                            onPress={() => handleLoadDraft(draft.id)}
                          >
                            Resume
                          </Button>
                          <Button
                            size="$3"
                            chromeless
                            icon={Trash2}
                            onPress={() => deleteDraft(draft.id)}
                          />
                        </XStack>
                      </XStack>
                    </Card>
                  ))}
              </YStack>
            )}

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
                  .map((entry) => {
                    const collapsed =
                      Array.isArray(collapsedEntries) && collapsedEntries.includes(entry.id)
                    return (
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
                            <XStack gap="$2">
                              <Button
                                size="$2"
                                chromeless
                                icon={collapsed ? ChevronDown : ChevronUp}
                                onPress={() => toggleCollapsed(entry.id)}
                              />
                              <Button
                                size="$2"
                                chromeless
                                icon={Trash2}
                                onPress={() => deleteSovereignEntry(entry.id)}
                              />
                            </XStack>
                          </XStack>

                          {!collapsed && (
                            <>
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
                                {entry.physicalSensations &&
                                  entry.physicalSensations.length > 0 && (
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
                                marginTop="$2"
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
                                    marginTop="$2"
                                    chromeless
                                    onPress={() =>
                                      setExpandedAnalysisId(
                                        expandedAnalysisId === entry.id ? null : entry.id
                                      )
                                    }
                                  >
                                    {expandedAnalysisId === entry.id ? 'Hide' : 'Show'} Sovereign
                                    Analysis
                                  </Button>

                                  {expandedAnalysisId === entry.id && (
                                    <Card
                                      backgroundColor="$background"
                                      borderColor="$borderColor"
                                      padding="$3"
                                      marginTop="$2"
                                    >
                                      <Paragraph fontSize="$3" lineHeight="$3">
                                        {entry.aiAnalysis}
                                      </Paragraph>
                                    </Card>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </YStack>
                      </Card>
                    )
                  })
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Draft Save Confirmation Dialog */}
      <Sheet
        modal
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        snapPoints={[40]}
        dismissOnSnapToBottom={false}
        animationConfig={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
        }}
      >
        <Sheet.Overlay backgroundColor="$background" opacity={0.9} />
        <Sheet.Frame padding="$4" gap="$4">
          <YStack gap="$3" alignItems="center">
            <H3 size="$6" textAlign="center">
              Save Your Progress?
            </H3>
            <Paragraph size="$4" textAlign="center" opacity={0.7}>
              You have unsaved changes. Would you like to save this as a draft?
            </Paragraph>

            <YStack width="100%" gap="$3" marginTop="$2">
              <Button
                size="$5"
                backgroundColor="green"
                onPress={() => {
                  handleSaveDraft()
                  setShowDraftDialog(false)
                }}
              >
                Save as Draft
              </Button>

              <Button
                size="$5"
                backgroundColor="red"
                onPress={() => {
                  setShowDraftDialog(false)
                  setShowNewEntrySheet(false)
                  resetForm()
                }}
              >
                Discard Changes
              </Button>

              <Button size="$5" chromeless onPress={() => setShowDraftDialog(false)}>
                Continue Editing
              </Button>
            </YStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* New Entry Sheet */}
      <Sheet
        modal
        open={showNewEntrySheet}
        onOpenChange={setShowNewEntrySheet}
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
              onPress={handleCloseSheet}
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
              contentContainerStyle={{ flexGrow: 1, paddingBottom: FLOATING_NAV_HEIGHT }}
              nestedScrollEnabled={true}
            >
              <YStack gap="$4" paddingBottom="$4">
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
                    ref={notesRef}
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
                    placeholder="Additional observations..."
                    minHeight={80}
                    blurOnSubmit={false}
                    returnKeyType="done"
                    multiline
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
                  <Button flex={1} size="$4" backgroundColor="green" onPress={handleAddEntry}>
                    Save Entry
                  </Button>
                </XStack>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
          <KeyboardDismissButton />
        </Sheet.Frame>
      </Sheet>

      {/* Add Custom Field Sheet */}
      <Sheet
        modal
        open={showAddFieldSheet}
        onOpenChange={setShowAddFieldSheet}
        snapPoints={[50]}
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
              onPress={() => setShowAddFieldSheet(false)}
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
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: FLOATING_NAV_HEIGHT }}
              nestedScrollEnabled={true}
            >
              <YStack gap="$4" paddingBottom="$4">
                <H3>Add Custom Field</H3>
                <YStack gap="$2">
                  <Label>Field Label</Label>
                  <Input
                    value={newFieldLabel}
                    onChangeText={setNewFieldLabel}
                    placeholder="e.g., Lunar Phase, Location"
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </YStack>
                <YStack gap="$2">
                  <Label>Field Value</Label>
                  <Input
                    value={newFieldValue}
                    onChangeText={setNewFieldValue}
                    placeholder="e.g., Waning Gibbous, Home"
                    blurOnSubmit={false}
                    returnKeyType="done"
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
                  <Button
                    flex={1}
                    size="$4"
                    backgroundColor="green"
                    onPress={handleAddCustomField}
                  >
                    Add Field
                  </Button>
                </XStack>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
          <KeyboardDismissButton />
        </Sheet.Frame>
      </Sheet>
    </>
  )
}

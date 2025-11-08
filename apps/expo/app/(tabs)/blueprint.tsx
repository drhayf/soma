/**
 * Blueprint Screen (Native)
 * Human Design + MBTI/OEJTS psychometric profile
 * The "Vessel Data" - know thyself through ancient wisdom and modern psychology
 */

import {
  YStack,
  XStack,
  H2,
  H3,
  Paragraph,
  ScrollView,
  Button,
  Spinner,
  Text,
  Card,
  Separator,
} from '@my/ui'
import { BlueprintCalculator } from 'app/features/BlueprintCalculator'
import { StealthAssessment } from 'app/features/StealthAssessment'
import { SovereignProfile } from 'app/features/SovereignProfile'
import { useSovereignPathStore, FLOATING_NAV_HEIGHT } from 'app'
import { useHealthData } from 'app/hooks/useHealthData'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { Fingerprint, Brain, Activity, Shield, Heart } from '@tamagui/lucide-icons'
import { semanticColors, iconColors } from 'app/lib/theme-colors'

// Cognitive function full names mapping
const cognitiveFunctionNames: Record<string, string> = {
  Ni: 'Introverted Intuition',
  Ne: 'Extraverted Intuition',
  Si: 'Introverted Sensing',
  Se: 'Extraverted Sensing',
  Ti: 'Introverted Thinking',
  Te: 'Extraverted Thinking',
  Fi: 'Introverted Feeling',
  Fe: 'Extraverted Feeling',
}

export default function BlueprintScreen() {
  const insets = useSafeAreaInsets()
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8
  const { humanDesignChart, mbtiProfile } = useSovereignPathStore()
  const {
    metrics: healthMetrics,
    isLoading: healthLoading,
    error: healthError,
    requestPermissions,
    fetchDailySummary,
    isAvailable,
  } = useHealthData()
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'hd' | 'mbti' | 'health'>(
    'profile'
  )

  const handleConnectHealthKit = async () => {
    setIsConnecting(true)
    try {
      const granted = await requestPermissions()
      if (granted) {
        await fetchDailySummary()
      }
    } catch (err) {
      console.error('HealthKit connection failed:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView flex={1} bg="$background">
        <YStack padding="$4" gap="$4" paddingTop={topPadding} paddingBottom={FLOATING_NAV_HEIGHT}>
          {/* Header */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <Fingerprint size={32} color={iconColors.success} />
              <H2>My Blueprint</H2>
            </XStack>
            <Paragraph color="gray" size="$3">
              Know thyself. Your unique design, cognitive patterns, and vessel metrics.
            </Paragraph>
          </YStack>

          {/* Section Tabs */}
          <XStack gap="$2" flexWrap="wrap">
            <Button
              size="$3"
              chromeless={activeSection !== 'profile'}
              theme={activeSection === 'profile' ? 'green' : undefined}
              onPress={() => setActiveSection('profile')}
              icon={Shield}
            >
              Sovereign Profile
            </Button>
            <Button
              size="$3"
              chromeless={activeSection !== 'hd'}
              theme={activeSection === 'hd' ? 'green' : undefined}
              onPress={() => setActiveSection('hd')}
              icon={Fingerprint}
            >
              Human Design
            </Button>
            <Button
              size="$3"
              chromeless={activeSection !== 'mbti'}
              theme={activeSection === 'mbti' ? 'green' : undefined}
              onPress={() => setActiveSection('mbti')}
              icon={Brain}
            >
              MBTI/OEJTS
            </Button>
            <Button
              size="$3"
              chromeless={activeSection !== 'health'}
              theme={activeSection === 'health' ? 'green' : undefined}
              onPress={() => setActiveSection('health')}
              icon={Activity}
            >
              Health Metrics
            </Button>
          </XStack>

          {/* Sovereign Profile Section */}
          {activeSection === 'profile' && <SovereignProfile />}

          {/* Human Design Section */}
          {activeSection === 'hd' && (
            <YStack gap="$4">
              <H3>Human Design Chart</H3>
              {!humanDesignChart ? (
                <>
                  <Paragraph color="gray">
                    Calculate your unique Human Design bodygraph based on your birth data. This
                    reveals your Type, Strategy, Authority, and energetic blueprint.
                  </Paragraph>
                  <BlueprintCalculator />
                </>
              ) : (
                <YStack
                  gap="$3"
                  backgroundColor={semanticColors.neutral.background}
                  padding="$4"
                  borderRadius="$4"
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <H3 size="$6">Your Chart</H3>
                    <Button size="$2" chromeless onPress={() => {}}>
                      Recalculate
                    </Button>
                  </XStack>

                  <YStack gap="$2">
                    <XStack justifyContent="space-between">
                      <Paragraph color="gray">Type:</Paragraph>
                      <Paragraph fontWeight="600">{humanDesignChart.type}</Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Paragraph color="gray">Strategy:</Paragraph>
                      <Paragraph fontWeight="600">{humanDesignChart.strategy}</Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Paragraph color="gray">Authority:</Paragraph>
                      <Paragraph fontWeight="600">{humanDesignChart.authority}</Paragraph>
                    </XStack>
                    <XStack justifyContent="space-between">
                      <Paragraph color="gray">Profile:</Paragraph>
                      <Paragraph fontWeight="600">{humanDesignChart.profile}</Paragraph>
                    </XStack>
                  </YStack>

                  {humanDesignChart.centers && (
                    <YStack gap="$2" marginTop="$2">
                      <Paragraph fontWeight="600" size="$4">
                        Centers:
                      </Paragraph>
                      {Object.entries(humanDesignChart.centers).map(([center, defined]) => (
                        <XStack key={center} justifyContent="space-between">
                          <Paragraph color="gray" textTransform="capitalize">
                            {center}:
                          </Paragraph>
                          <Paragraph color={defined ? 'green' : 'gray'}>
                            {defined ? 'Defined' : 'Open'}
                          </Paragraph>
                        </XStack>
                      ))}
                    </YStack>
                  )}
                </YStack>
              )}
            </YStack>
          )}

          {/* MBTI/OEJTS Section */}
          {activeSection === 'mbti' && (
            <YStack gap="$4">
              <H3>Cognitive Type Assessment</H3>
              {!mbtiProfile ? (
                <>
                  <Paragraph color="gray">
                    Complete the Open Extended Jungian Type Scales (OEJTS) assessment. This
                    conversational, one-question-at-a-time approach reveals your cognitive functions
                    and decision-making patterns.
                  </Paragraph>
                  <StealthAssessment />
                </>
              ) : (
                <YStack
                  gap="$3"
                  backgroundColor={semanticColors.neutral.background}
                  padding="$4"
                  borderRadius="$4"
                >
                  <H3 size="$6">Your Type: {mbtiProfile.type}</H3>

                  <YStack gap="$2" marginTop="$2">
                    <Paragraph fontWeight="600" size="$4">
                      Cognitive Functions:
                    </Paragraph>
                    {Object.entries(mbtiProfile.scores).map(([dimension, score]) => (
                      <XStack key={dimension} justifyContent="space-between" alignItems="center">
                        <Paragraph color="gray">
                          {dimension === 'E'
                            ? 'Extraversion'
                            : dimension === 'I'
                              ? 'Introversion'
                              : dimension === 'S'
                                ? 'Sensing'
                                : dimension === 'N'
                                  ? 'Intuition'
                                  : dimension === 'T'
                                    ? 'Thinking'
                                    : dimension === 'F'
                                      ? 'Feeling'
                                      : dimension === 'J'
                                        ? 'Judging'
                                        : dimension === 'P'
                                          ? 'Perceiving'
                                          : dimension}
                          :
                        </Paragraph>
                        <Paragraph fontWeight="600">{score}</Paragraph>
                      </XStack>
                    ))}
                  </YStack>

                  <Button
                    size="$3"
                    chromeless
                    marginTop="$2"
                    onPress={() => {
                      // Try to access the store function directly
                      try {
                        const store = useSovereignPathStore.getState()
                        console.log('Store state:', store)
                        console.log('Reset function exists:', typeof store.resetAssessment)

                        if (typeof store.resetAssessment === 'function') {
                          store.resetAssessment()
                          // Force navigation back to assessment by switching tabs and back
                          setActiveSection('profile')
                          setTimeout(() => setActiveSection('mbti'), 100)
                        } else {
                          console.error('resetAssessment function not found')
                        }
                      } catch (error) {
                        console.error('Error accessing store:', error)
                      }
                    }}
                  >
                    Retake Assessment
                  </Button>
                </YStack>
              )}
            </YStack>
          )}

          {/* Health Metrics Section */}
          {activeSection === 'health' && (
            <YStack gap="$4">
              <H3>Vessel Metrics</H3>
              <Paragraph color="gray">
                Connect Apple HealthKit to track steps, sleep, heart rate, and walking asymmetry for
                personalized somatic guidance.
              </Paragraph>

              {!isAvailable ? (
                <Card
                  backgroundColor={semanticColors.warning.background}
                  borderColor={semanticColors.warning.border}
                  padding="$4"
                >
                  <XStack gap="$2" alignItems="center">
                    <Text fontSize="$4">⚠️</Text>
                    <YStack flex={1}>
                      <Text fontWeight="bold" color={semanticColors.warning.text}>
                        HealthKit Not Available
                      </Text>
                      <Text fontSize="$2" color={semanticColors.warning.text} marginTop="$1">
                        HealthKit requires iOS with a development or production build. It's not
                        available in Expo Go.
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              ) : !healthMetrics ? (
                <YStack backgroundColor="$gray4" padding="$4" borderRadius="$4" gap="$3">
                  <XStack alignItems="center" gap="$2" justifyContent="center">
                    <Heart size={20} color={iconColors.success} />
                    <Paragraph color="gray" textAlign="center">
                      Connect Apple HealthKit to view your daily metrics
                    </Paragraph>
                  </XStack>
                  {healthError && (
                    <Card
                      backgroundColor={semanticColors.error.background}
                      borderColor={semanticColors.error.border}
                      padding="$3"
                    >
                      <Text color={semanticColors.error.text} fontSize="$2">
                        {healthError}
                      </Text>
                    </Card>
                  )}
                  <Button
                    backgroundColor={semanticColors.success.background}
                    borderColor={semanticColors.success.border}
                    onPress={handleConnectHealthKit}
                    disabled={isConnecting || healthLoading}
                    icon={isConnecting || healthLoading ? <Spinner /> : Heart}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect HealthKit'}
                  </Button>
                  <Text fontSize="$2" color="gray" textAlign="center">
                    Your health data stays on your device and is never sent to external servers.
                  </Text>
                </YStack>
              ) : (
                <YStack gap="$3">
                  {/* Connected Status */}
                  <Card
                    backgroundColor={semanticColors.success.background}
                    borderColor={semanticColors.success.border}
                    padding="$3"
                  >
                    <XStack gap="$2" alignItems="center">
                      <Text fontSize="$4">✅</Text>
                      <YStack flex={1}>
                        <Text fontWeight="bold" color={semanticColors.success.text} flexWrap="wrap">
                          HealthKit Connected
                        </Text>
                        <Text
                          fontSize="$2"
                          color={semanticColors.success.text}
                          marginTop="$1"
                          flexWrap="wrap"
                        >
                          Last synced: {new Date(healthMetrics.lastSync).toLocaleString()}
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>

                  {/* Metrics Display */}
                  <Card backgroundColor="$background" borderColor="$borderColor" padding="$4">
                    <YStack gap="$3">
                      <H3 size="$5">Today's Metrics</H3>

                      <Separator />

                      {/* Steps */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap="$2" alignItems="center">
                          <Text fontSize="$5">🚶</Text>
                          <Text fontSize="$4">Steps</Text>
                        </XStack>
                        <Text fontSize="$6" fontWeight="bold">
                          {healthMetrics.steps.toLocaleString()}
                        </Text>
                      </XStack>

                      <Separator />

                      {/* Sleep */}
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack gap="$2" alignItems="center">
                          <Text fontSize="$5">😴</Text>
                          <Text fontSize="$4">Sleep (last night)</Text>
                        </XStack>
                        <Text fontSize="$6" fontWeight="bold">
                          {healthMetrics.sleepHours.toFixed(1)} hrs
                        </Text>
                      </XStack>

                      {healthMetrics.walkingAsymmetry !== null && (
                        <>
                          <Separator />

                          {/* Walking Asymmetry */}
                          <XStack justifyContent="space-between" alignItems="center">
                            <XStack gap="$2" alignItems="center" flex={1}>
                              <Text fontSize="$5">⚖️</Text>
                              <YStack flex={1}>
                                <Text fontSize="$4">Walking Asymmetry</Text>
                                <Text fontSize="$2" color="gray">
                                  Gait balance (0% = perfect)
                                </Text>
                              </YStack>
                            </XStack>
                            <Text fontSize="$6" fontWeight="bold">
                              {healthMetrics.walkingAsymmetry.toFixed(1)}%
                            </Text>
                          </XStack>
                        </>
                      )}
                    </YStack>
                  </Card>

                  {/* Actions */}
                  <XStack gap="$2">
                    <Button
                      flex={1}
                      size="$3"
                      chromeless
                      onPress={fetchDailySummary}
                      disabled={healthLoading}
                      icon={healthLoading ? <Spinner size="small" /> : Activity}
                    >
                      {healthLoading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                    <Button flex={1} size="$3" chromeless onPress={handleConnectHealthKit}>
                      Re-authorize
                    </Button>
                  </XStack>

                  <Card
                    backgroundColor={semanticColors.info.background}
                    borderColor={semanticColors.info.border}
                    padding="$3"
                  >
                    <Text fontSize="$2" color={semanticColors.info.text} flexWrap="wrap">
                      💡 Tip: HealthKit data is used to personalize your Daily Attunement and AI
                      chat responses. The AI correlates your vessel state with your Human Design
                      blueprint and cosmic transits.
                    </Text>
                  </Card>
                </YStack>
              )}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

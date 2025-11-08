/**
 * Blueprint Page (Web)
 * Human Design + MBTI/OEJTS psychometric profile
 * The "Vessel Data" - know thyself through ancient wisdom and modern psychology
 */

'use client'

import {
  YStack,
  XStack,
  H2,
  H3,
  Paragraph,
  ScrollView,
  Button,
  Text,
  Card,
  Separator,
} from '@my/ui'
import { BlueprintCalculator } from 'app/features/BlueprintCalculator'
import { StealthAssessment } from 'app/features/StealthAssessment'
import { SovereignProfile } from 'app/features/SovereignProfile'
import { useSovereignPathStore } from 'app/lib/store'
import { useHealthData } from 'app/hooks/useHealthData'
import { useState } from 'react'
import { Fingerprint, Brain, Activity, Shield, Heart } from '@tamagui/lucide-icons'

export default function BlueprintPage() {
  const { humanDesignChart, mbtiProfile } = useSovereignPathStore()
  const { metrics: healthMetrics } = useHealthData()
  const [activeSection, setActiveSection] = useState<'profile' | 'hd' | 'mbti' | 'health'>(
    'profile'
  )

  return (
    <ScrollView flex={1} bg="$background">
      <YStack
        padding="$4"
        gap="$4"
        paddingBottom="$8"
        maxWidth={800}
        marginHorizontal="auto"
        width="100%"
      >
        {/* Header */}
        <YStack gap="$2">
          <XStack alignItems="center" gap="$2">
            <Fingerprint size={32} color="green" />
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
              <YStack gap="$3" bg="gray" padding="$4" borderRadius="$4">
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
              <YStack gap="$3" bg="gray" padding="$4" borderRadius="$4">
                <H3 size="$6">Your Type: {mbtiProfile.type}</H3>

                <YStack gap="$2" marginTop="$2">
                  <Paragraph fontWeight="600" size="$4">
                    Cognitive Functions:
                  </Paragraph>
                  {Object.entries(mbtiProfile.scores).map(([dimension, score]) => (
                    <XStack key={dimension} justifyContent="space-between" alignItems="center">
                      <Paragraph color="gray" textTransform="capitalize">
                        {dimension}:
                      </Paragraph>
                      <Paragraph fontWeight="600">{score}</Paragraph>
                    </XStack>
                  ))}
                </YStack>

                <Button size="$3" chromeless marginTop="$2" onPress={() => {}}>
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
              HealthKit integration is available on the native iOS app. Web displays mock data for
              development.
            </Paragraph>

            {healthMetrics ? (
              <YStack gap="$3">
                {/* Mock Data Notice for Web */}
                <Card backgroundColor="blue" borderColor="blue" padding="$3">
                  <XStack gap="$2" alignItems="center">
                    <Text fontSize="$4">ℹ️</Text>
                    <YStack flex={1}>
                      <Text fontWeight="bold" color="blue">
                        Displaying Mock Data
                      </Text>
                      <Text fontSize="$2" color="blue" marginTop="$1">
                        Real HealthKit metrics are available on the native iOS app. Install the app
                        to sync your actual health data.
                      </Text>
                    </YStack>
                  </XStack>
                </Card>

                {/* Metrics Display */}
                <Card backgroundColor="$background" borderColor="$borderColor" padding="$4">
                  <YStack gap="$3">
                    <H3 size="$5">Today's Metrics (Mock)</H3>

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

                    <Separator />

                    <Text fontSize="$2" color="gray">
                      Last synced: {new Date(healthMetrics.lastSync).toLocaleString()}
                    </Text>
                  </YStack>
                </Card>

                <Card backgroundColor="green" borderColor="green" padding="$3">
                  <Text fontSize="$2" color="green">
                    💡 Tip: For real-time health tracking, download the native iOS app. Your
                    HealthKit data is used to personalize Daily Attunements and AI chat responses.
                  </Text>
                </Card>
              </YStack>
            ) : (
              <Card backgroundColor="gray" borderColor="gray" padding="$4">
                <YStack gap="$2" alignItems="center">
                  <Heart size={32} color="gray" />
                  <Text fontSize="$4" fontWeight="bold" color="gray">
                    Health Metrics Unavailable
                  </Text>
                  <Text fontSize="$2" color="gray" textAlign="center">
                    HealthKit integration requires the native iOS app with proper permissions.
                  </Text>
                </YStack>
              </Card>
            )}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}

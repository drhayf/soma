/**
 * Blueprint Calculator - Human Design Chart Generator
 * Shared component for calculating and displaying Human Design charts
 */

import { useState } from 'react'
import { YStack, XStack, H3, H4, Paragraph, Input, Button, Card, Text, Separator } from '@my/ui'
import { Calendar, Clock, MapPin, Sparkles } from '@tamagui/lucide-icons'
import { calculateHumanDesignChart, validateBirthData } from '../lib/hdkit'
import type { BirthData, HumanDesignChart } from '../lib/hdkit/types'
import { useSovereignPathStore } from '../lib/store'
import { semanticColors } from '../lib/theme-colors'

export function BlueprintCalculator() {
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [error, setError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const { humanDesignChart, setHumanDesignChart, setBirthData } = useSovereignPathStore()

  const handleCalculate = () => {
    setError(null)
    setIsCalculating(true)

    const birthData: BirthData = {
      date: birthDate,
      time: birthTime,
      location: {
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        timezone,
      },
    }

    const validation = validateBirthData(birthData)
    if (!validation.valid) {
      setError(validation.error || 'Invalid birth data')
      setIsCalculating(false)
      return
    }

    try {
      const chart = calculateHumanDesignChart({
        birthData,
        useMockData: true, // Using deterministic mock for Phase 1
      })

      setHumanDesignChart(chart)
      setBirthData(birthData) // Store for astrology API
    } catch (err) {
      setError(`Calculation failed: ${err}`)
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <YStack gap="$4" paddingHorizontal="$4">
      <YStack gap="$2">
        <H3>Calculate Your Human Design</H3>
        <Paragraph size="$3">
          Enter your birth details to generate your unique bodygraph. This data never leaves your
          device.
        </Paragraph>
      </YStack>

      {!humanDesignChart ? (
        <YStack gap="$3">
          {/* Birth Date Input */}
          <YStack gap="$2">
            <XStack gap="$2" alignItems="center">
              <Calendar size={16} />
              <Text fontSize="$3" fontWeight="600">
                Birth Date
              </Text>
            </XStack>
            <Input
              placeholder="YYYY-MM-DD"
              value={birthDate}
              onChangeText={setBirthDate}
              autoCapitalize="none"
            />
          </YStack>

          {/* Birth Time Input */}
          <YStack gap="$2">
            <XStack gap="$2" alignItems="center">
              <Clock size={16} />
              <Text fontSize="$3" fontWeight="600">
                Birth Time (24-hour)
              </Text>
            </XStack>
            <Input
              placeholder="HH:MM (e.g., 14:30)"
              value={birthTime}
              onChangeText={setBirthTime}
              autoCapitalize="none"
            />
          </YStack>

          {/* Location Inputs */}
          <YStack gap="$2">
            <XStack gap="$2" alignItems="center">
              <MapPin size={16} />
              <Text fontSize="$3" fontWeight="600">
                Birth Location
              </Text>
            </XStack>
            <XStack gap="$2">
              <Input
                flex={1}
                placeholder="Latitude (e.g., 40.7128)"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
              />
              <Input
                flex={1}
                placeholder="Longitude (e.g., -74.0060)"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
              />
            </XStack>
            <Input
              placeholder="Timezone (e.g., America/New_York)"
              value={timezone}
              onChangeText={setTimezone}
              autoCapitalize="none"
            />
          </YStack>

          {error && (
            <Card
              backgroundColor={semanticColors.error.background}
              borderColor={semanticColors.error.border}
              padding="$3"
            >
              <Text color={semanticColors.error.text}>{error}</Text>
            </Card>
          )}

          <Button
            size="$4"
            onPress={handleCalculate}
            disabled={isCalculating}
            backgroundColor={semanticColors.primary.background}
            pressStyle={{ backgroundColor: semanticColors.primary.backgroundHover }}
            icon={Sparkles}
          >
            {isCalculating ? 'Calculating...' : 'Calculate My Chart'}
          </Button>

          <Card
            backgroundColor={semanticColors.warning.background}
            borderColor={semanticColors.warning.border}
            padding="$3"
          >
            <Text fontSize="$2" color={semanticColors.warning.text}>
              💡 Tip: This is a simplified calculation using deterministic algorithms. For
              production-grade charts, use astronomical ephemeris data.
            </Text>
          </Card>
        </YStack>
      ) : (
        <ChartDisplay chart={humanDesignChart} />
      )}
    </YStack>
  )
}

/**
 * Display calculated Human Design chart
 */
function ChartDisplay({ chart }: { chart: HumanDesignChart }) {
  return (
    <YStack gap="$4">
      <Card elevate borderWidth={2} borderColor="$borderColor" padding="$4">
        <YStack gap="$3">
          <H4>Your Human Design</H4>

          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Text fontWeight="600">Type:</Text>
              <Text color={semanticColors.primary.text} fontWeight="700">
                {chart.type}
              </Text>
            </XStack>

            <XStack justifyContent="space-between">
              <Text fontWeight="600">Strategy:</Text>
              <Text>{chart.strategy}</Text>
            </XStack>

            <XStack justifyContent="space-between">
              <Text fontWeight="600">Authority:</Text>
              <Text>{chart.authority}</Text>
            </XStack>

            <XStack justifyContent="space-between">
              <Text fontWeight="600">Profile:</Text>
              <Text>{chart.profile}</Text>
            </XStack>

            <XStack justifyContent="space-between">
              <Text fontWeight="600">Definition:</Text>
              <Text>{chart.definition}</Text>
            </XStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <Text fontWeight="600">Defined Centers:</Text>
            <XStack flexWrap="wrap" gap="$2">
              {Object.entries(chart.centers)
                .filter(([_, defined]) => defined)
                .map(([center, _]) => (
                  <Card
                    key={center}
                    backgroundColor={semanticColors.success.background}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                  >
                    <Text fontSize="$2" textTransform="capitalize">
                      {center === 'g' ? 'Identity' : center}
                    </Text>
                  </Card>
                ))}
            </XStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <Text fontWeight="600">Incarnation Cross:</Text>
            <Text fontSize="$3">{chart.incarnationCross}</Text>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <Text fontWeight="600">Activated Gates ({chart.gates.length}):</Text>
            <XStack flexWrap="wrap" gap="$2">
              {chart.gates.map((gate) => (
                <Card
                  key={gate}
                  backgroundColor={semanticColors.primary.background}
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                >
                  <Text fontSize="$2">{gate}</Text>
                </Card>
              ))}
            </XStack>
          </YStack>
        </YStack>
      </Card>

      <Button
        size="$3"
        chromeless
        onPress={() => useSovereignPathStore.getState().setHumanDesignChart(undefined as any)}
      >
        Recalculate Chart
      </Button>
    </YStack>
  )
}

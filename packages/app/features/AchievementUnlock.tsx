/**
 * Achievement Unlock Toast/Modal
 * Displays when a user unlocks a new achievement with celebration
 */

import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { YStack, XStack, Text, H2, Card, Button } from '@my/ui'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { Achievement } from '../types'

// Conditional haptics import
let Haptics: any
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics')
}

interface AchievementUnlockProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  const scale = useSharedValue(0)
  const rotation = useSharedValue(0)

  useEffect(() => {
    if (achievement) {
      // Celebration haptics
      if (Platform.OS !== 'web' && Haptics) {
        const celebrate = async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
          await new Promise((r) => setTimeout(r, 100))
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          await new Promise((r) => setTimeout(r, 100))
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        }
        celebrate()
      }

      // Scale animation
      scale.value = withSequence(withSpring(1.2, { damping: 10 }), withSpring(1, { damping: 8 }))

      // Subtle rotation
      rotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      )

      // Auto-close after 4 seconds
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement])

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }))

  if (!achievement) return null

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$colorTransparent"
      padding="$4"
      zIndex={1000}
    >
      <Animated.View style={animatedCardStyle}>
        <Card
          elevate
          size="$6"
          padding="$6"
          backgroundColor="$background"
          borderColor="green"
          borderWidth={3}
          maxWidth={400}
        >
          <YStack gap="$4" alignItems="center">
            <Text fontSize={80}>{achievement.icon}</Text>

            <YStack gap="$2" alignItems="center">
              <Text
                fontSize="$2"
                fontWeight="600"
                color="green"
                textTransform="uppercase"
                letterSpacing={2}
              >
                Achievement Unlocked
              </Text>

              <H2 size="$8" textAlign="center">
                {achievement.name}
              </H2>

              <Text fontSize="$4" color="$color11" textAlign="center">
                {achievement.description}
              </Text>
            </YStack>

            <Button
              size="$4"
              backgroundColor="green"
              onPress={onClose}
              pressStyle={{ backgroundColor: 'green' }}
            >
              <Text color="white" fontWeight="600">
                Awesome! 🎉
              </Text>
            </Button>
          </YStack>
        </Card>
      </Animated.View>
    </YStack>
  )
}

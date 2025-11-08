/**
 * Success Celebration Component
 * Lightweight success animation for routine completion
 */

import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { YStack, Text } from '@my/ui'
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Animated,
  SPRING_CONFIGS,
  TIMING_CONFIGS,
} from '../lib/animations'

// Conditional haptics import
let Haptics: any = null
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics')
  } catch (e) {
    // Haptics not available
  }
}

// Create animated components ONCE outside of render to prevent infinite loops
const AnimatedYStack = Animated?.createAnimatedComponent?.(YStack) || YStack
const AnimatedText = Animated?.createAnimatedComponent?.(Text) || Text

interface SuccessCelebrationProps {
  isVisible: boolean
  onComplete?: () => void
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  isVisible,
  onComplete,
}) => {
  const isNative = Platform.OS !== 'web'

  // Fallback for web - simple static message
  if (!isNative || !useSharedValue || !Animated) {
    if (!isVisible) return null
    return (
      <YStack
        position="absolute"
        top="50%"
        left="50%"
        zIndex={1000}
        transform={[{ translateX: -50 }, { translateY: -50 }]}
      >
        <Text fontSize="$10" textAlign="center">
          ✓
        </Text>
      </YStack>
    )
  }

  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)
  const checkScale = useSharedValue(0)

  useEffect(() => {
    if (isVisible) {
      // Haptic feedback - simple success pattern
      if (Haptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }

      // Circle scale animation: grow in with spring
      scale.value = withSpring(1, SPRING_CONFIGS.bouncy)
      opacity.value = withTiming(1, TIMING_CONFIGS.fast)

      // Checkmark appears with slight delay and bounce
      setTimeout(() => {
        checkScale.value = withSequence(
          withSpring(1.2, SPRING_CONFIGS.snappy),
          withSpring(1, SPRING_CONFIGS.gentle)
        )
      }, 100)

      // Auto-dismiss after 1.5s
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, TIMING_CONFIGS.normal, () => {
          scale.value = 0
          checkScale.value = 0
        })
        onComplete?.()
      }, 1500)

      return () => clearTimeout(timer)
    } else {
      // Reset
      scale.value = 0
      opacity.value = 0
      checkScale.value = 0
    }
  }, [isVisible])

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }))

  if (!isVisible) return null

  return (
    <YStack
      position="absolute"
      top="50%"
      left="50%"
      zIndex={1000}
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
      style={{ transform: [{ translateX: -75 }, { translateY: -75 }] }}
    >
      {/* Success Circle Background */}
      <AnimatedYStack
        width={150}
        height={150}
        borderRadius={75}
        backgroundColor="green"
        alignItems="center"
        justifyContent="center"
        style={circleStyle}
      >
        {/* Checkmark */}
        <AnimatedText fontSize="$12" color="white" fontWeight="bold" style={checkStyle}>
          ✓
        </AnimatedText>
      </AnimatedYStack>
    </YStack>
  )
}

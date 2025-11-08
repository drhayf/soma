/**
 * Animated Button Component
 * Enhanced Button with press scale feedback and haptics
 */

import React, { useMemo } from 'react'
import { Platform } from 'react-native'
import { Button } from '@my/ui'
import type { ButtonProps } from 'tamagui'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Animated,
  SPRING_CONFIGS,
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

// Create animated component ONCE outside of render to prevent infinite loops
const AnimatedButtonComponent = Animated?.createAnimatedComponent?.(Button) || Button

interface AnimatedButtonProps extends ButtonProps {
  pressScale?: number
  enableHaptics?: boolean
  hapticStyle?: 'light' | 'medium' | 'heavy'
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  pressScale = 0.95,
  enableHaptics = true,
  hapticStyle = 'light',
  onPress,
  children,
  ...props
}) => {
  const isNative = Platform.OS !== 'web'

  // Fallback to Tamagui's built-in animations on web
  if (!isNative || !useSharedValue || !Animated) {
    return (
      <Button
        {...props}
        onPress={onPress}
        pressStyle={{ scale: pressScale }}
        animation="quick"
        hoverStyle={{ scale: 1.02 }}
      >
        {children}
      </Button>
    )
  }

  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(pressScale, SPRING_CONFIGS.snappy)

    // Trigger haptic feedback
    if (enableHaptics && Haptics) {
      if (hapticStyle === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else if (hapticStyle === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else if (hapticStyle === 'heavy') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
    }
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIGS.bouncy)
  }

  return (
    <AnimatedButtonComponent
      {...props}
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedButtonComponent>
  )
}

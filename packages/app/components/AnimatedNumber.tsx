/**
 * Animated Number Counter
 * Smooth number transitions with spring physics
 */

import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { Text } from '@my/ui'
import type { TextProps } from 'tamagui'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Animated,
  SPRING_CONFIGS,
} from '../lib/animations'

// Create animated component ONCE outside of render to prevent infinite loops
const AnimatedText = Animated?.createAnimatedComponent?.(Text) || Text

interface AnimatedNumberProps extends TextProps {
  value: number
  prefix?: string
  suffix?: string
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = '',
  suffix = '',
  ...textProps
}) => {
  const isNative = Platform.OS !== 'web'

  // Fallback for web
  if (!isNative || !useSharedValue || !Animated) {
    return (
      <Text {...textProps}>
        {prefix}
        {value}
        {suffix}
      </Text>
    )
  }

  const animatedValue = useSharedValue(value)
  const scale = useSharedValue(1)

  useEffect(() => {
    // Animate to new value with spring
    animatedValue.value = withSpring(value, SPRING_CONFIGS.bouncy)

    // Pulse scale effect on change
    scale.value = withSpring(1.15, SPRING_CONFIGS.snappy, () => {
      scale.value = withSpring(1, SPRING_CONFIGS.gentle)
    })
  }, [value])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // For now, we'll use a simpler approach without animated text interpolation
  // because react-native-reanimated's text animation requires additional setup
  return (
    <AnimatedText {...textProps} style={animatedStyle}>
      {prefix}
      {value}
      {suffix}
    </AnimatedText>
  )
}

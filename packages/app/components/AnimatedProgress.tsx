/**
 * Animated Progress Component
 * Progress bar with spring-based fill animation
 */

import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { Progress } from '@my/ui'
import type { ProgressProps } from 'tamagui'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Animated,
  SPRING_CONFIGS,
} from '../lib/animations'

// Create animated component ONCE outside of render to prevent infinite loops
const ProgressIndicator =
  Animated?.createAnimatedComponent?.(Progress.Indicator) || Progress.Indicator

interface AnimatedProgressProps extends Omit<ProgressProps, 'value'> {
  value: number
  max?: number
  animateOnChange?: boolean
  useSpring?: boolean
  duration?: number
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  animateOnChange = true,
  useSpring: shouldUseSpring = true,
  duration = 600,
  ...props
}) => {
  const isNative = Platform.OS !== 'web'

  // Fallback to Tamagui's built-in animations on web
  if (!isNative || !useSharedValue || !Animated) {
    return (
      <Progress value={value} max={max} {...props}>
        <Progress.Indicator animation="bouncy" backgroundColor="green" />
      </Progress>
    )
  }

  const progress = useSharedValue(0)

  useEffect(() => {
    if (animateOnChange) {
      const targetValue = (value / max) * 100

      if (shouldUseSpring) {
        progress.value = withSpring(targetValue, {
          ...SPRING_CONFIGS.smooth,
          overshootClamping: true,
        })
      } else {
        progress.value = withTiming(targetValue, {
          duration,
        })
      }
    } else {
      progress.value = (value / max) * 100
    }
  }, [value, max, animateOnChange, shouldUseSpring, duration])

  // For the indicator, we need to animate its width/scaleX
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }))

  return (
    <Progress value={100} max={100} {...props}>
      <ProgressIndicator
        backgroundColor="green"
        style={animatedIndicatorStyle}
        animation={undefined}
      />
    </Progress>
  )
}

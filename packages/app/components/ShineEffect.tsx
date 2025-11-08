/**
 * Shine Effect Component
 * Animated shine/glint effect for achievement badges and highlights
 */

import React, { useEffect } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { YStack } from '@my/ui'
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  Animated,
} from '../lib/animations'

// Create animated component ONCE outside of render to prevent infinite loops
const AnimatedYStack = Animated?.createAnimatedComponent?.(YStack) || YStack

interface ShineEffectProps {
  children: React.ReactNode
  enabled?: boolean
  delay?: number
  duration?: number
  repeat?: boolean
}

export const ShineEffect: React.FC<ShineEffectProps> = ({
  children,
  enabled = true,
  delay = 0,
  duration = 1200,
  repeat = false,
}) => {
  const isNative = Platform.OS !== 'web'

  if (!isNative || !useSharedValue || !Animated || !enabled) {
    return <YStack>{children}</YStack>
  }

  const translateX = useSharedValue(-200)
  const opacity = useSharedValue(0.6)

  useEffect(() => {
    if (enabled) {
      const animation = withTiming(200, {
        duration,
        easing: Easing?.bezier(0.4, 0.0, 0.2, 1),
      })

      const withDelayWrapper = delay > 0 ? withDelay(delay, animation) : animation

      translateX.value = repeat ? withRepeat(withDelayWrapper, -1, false) : withDelayWrapper
    }
  }, [enabled, delay, duration, repeat])

  const shineStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ translateX: translateX.value }, { skewX: '-20deg' }],
    opacity: opacity.value,
  }))

  return (
    <YStack overflow="hidden" position="relative">
      {children}
      <AnimatedYStack style={shineStyle} backgroundColor="white" width={50} pointerEvents="none" />
    </YStack>
  )
}

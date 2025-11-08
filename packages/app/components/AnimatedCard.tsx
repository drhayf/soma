/**
 * Animated Card Component
 * Enhanced Card with entrance animations and press feedback
 */

import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { Card } from '@my/ui'
import type { CardProps } from 'tamagui'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Animated,
  SPRING_CONFIGS,
} from '../lib/animations'

// Create animated component ONCE outside of render to prevent infinite loops
const AnimatedCardComponent = Animated?.createAnimatedComponent?.(Card) || Card

interface AnimatedCardProps extends CardProps {
  delay?: number
  staggerIndex?: number
  animateOnMount?: boolean
  pressScale?: number
  children: React.ReactNode
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  delay = 0,
  staggerIndex = 0,
  animateOnMount = true,
  pressScale = 0.98,
  children,
  onPress,
  ...props
}) => {
  const isNative = Platform.OS !== 'web'

  // Only use animations on native
  if (!isNative || !useSharedValue || !Animated) {
    return (
      <Card {...props} onPress={onPress} pressStyle={{ scale: pressScale }} animation="bouncy">
        {children}
      </Card>
    )
  }

  const opacity = useSharedValue(animateOnMount ? 0 : 1)
  const translateY = useSharedValue(animateOnMount ? 20 : 0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (animateOnMount) {
      const totalDelay = delay + staggerIndex * 50

      opacity.value = withTiming(1, {
        duration: 400,
        ...(totalDelay > 0 && { delay: totalDelay }),
      })

      translateY.value = withSpring(0, {
        ...SPRING_CONFIGS.gentle,
        ...(totalDelay > 0 && { delay: totalDelay }),
      })
    }
  }, [animateOnMount, delay, staggerIndex])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(pressScale, SPRING_CONFIGS.snappy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy)
  }

  return (
    <AnimatedCardComponent
      {...props}
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedCardComponent>
  )
}

/**
 * Animated Sheet Component
 * Sheet modal with scale and opacity entrance/exit animations
 */

import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { Sheet } from '@my/ui'
import type { SheetProps } from 'tamagui'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Animated,
  SPRING_CONFIGS,
} from '../lib/animations'

// Create animated component ONCE outside of render to prevent infinite loops
const AnimatedSheetFrame = Animated?.createAnimatedComponent?.(Sheet.Frame) || Sheet.Frame

interface AnimatedSheetProps extends SheetProps {
  children: React.ReactNode
}

export const AnimatedSheet: React.FC<AnimatedSheetProps> = ({
  open,
  onOpenChange,
  children,
  ...props
}) => {
  const isNative = Platform.OS !== 'web'

  // On web, use Tamagui's built-in animations
  if (!isNative || !useSharedValue || !Animated) {
    return (
      <Sheet
        modal
        open={open}
        onOpenChange={onOpenChange}
        animation="medium"
        snapPoints={[85, 50, 25]}
        dismissOnSnapToBottom
        {...props}
      >
        {children}
      </Sheet>
    )
  }

  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (open) {
      // Entrance animation
      scale.value = withSpring(1, SPRING_CONFIGS.bouncy)
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      // Exit animation
      scale.value = withTiming(0.9, { duration: 150 })
      opacity.value = withTiming(0, { duration: 150 })
    }
  }, [open])

  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85, 50, 25]}
      dismissOnSnapToBottom
      animation="medium"
      {...props}
    >
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" opacity={0.5} animation="lazy" />
      <AnimatedSheetFrame
        padding="$4"
        backgroundColor="$background"
        borderRadius="$6"
        style={animatedFrameStyle}
      >
        {children}
      </AnimatedSheetFrame>
    </Sheet>
  )
}

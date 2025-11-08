/**
 * Shared Animation Utilities
 * Reusable animation configurations and utilities using react-native-reanimated
 */

import { Platform } from 'react-native'

// Conditional imports for Reanimated
let Animated: any = null
let useSharedValue: any = null
let useAnimatedStyle: any = null
let withSpring: any = null
let withTiming: any = null
let withSequence: any = null
let withDelay: any = null
let withRepeat: any = null
let Easing: any = null

if (Platform.OS !== 'web') {
  try {
    const Reanimated = require('react-native-reanimated')
    Animated = Reanimated.default
    useSharedValue = Reanimated.useSharedValue
    useAnimatedStyle = Reanimated.useAnimatedStyle
    withSpring = Reanimated.withSpring
    withTiming = Reanimated.withTiming
    withSequence = Reanimated.withSequence
    withDelay = Reanimated.withDelay
    withRepeat = Reanimated.withRepeat
    Easing = Reanimated.Easing
  } catch (e) {
    console.log('Reanimated not available')
  }
}

// Spring configurations
export const SPRING_CONFIGS = {
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },
  bouncy: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  snappy: {
    damping: 25,
    stiffness: 200,
    mass: 0.8,
  },
  smooth: {
    damping: 30,
    stiffness: 100,
    mass: 1,
  },
}

// Timing configurations
export const TIMING_CONFIGS = {
  fast: {
    duration: 200,
    easing: Easing?.out(Easing?.cubic),
  },
  normal: {
    duration: 300,
    easing: Easing?.out(Easing?.cubic),
  },
  slow: {
    duration: 500,
    easing: Easing?.out(Easing?.cubic),
  },
  smooth: {
    duration: 400,
    easing: Easing?.bezier(0.4, 0.0, 0.2, 1),
  },
}

// Animation presets
export const ANIMATION_PRESETS = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  slideInUp: {
    from: { translateY: 20, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
  },
  slideInDown: {
    from: { translateY: -20, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
  },
  scaleIn: {
    from: { scale: 0.9, opacity: 0 },
    to: { scale: 1, opacity: 1 },
  },
  scaleOut: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 0.9, opacity: 0 },
  },
  bounce: {
    from: { scale: 1 },
    to: { scale: 1.1 },
  },
}

// Stagger delay calculator
export const getStaggerDelay = (index: number, baseDelay: number = 50) => {
  return index * baseDelay
}

// Conditional animation wrapper
export const conditionalAnimation = (condition: boolean, animation: any, fallback: any = 0) => {
  return condition ? animation : fallback
}

export {
  Animated,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
}

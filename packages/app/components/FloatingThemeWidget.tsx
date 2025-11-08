/**
 * FloatingThemeWidget - Modern pill-shaped theme control with blur and smooth animations
 *
 * Features:
 * - Fixed at top of screen (stays visible while scrolling)
 * - Pill-shaped design with glassmorphism
 * - Click to expand menu with blur backdrop
 * - Auto/Light/Dark theme controls
 * - Visual indicator of current mode
 * - Smooth spring animations
 * - Hidden during focused experiences (routine player)
 * - Respects safe area insets (iPhone notch/Dynamic Island)
 */

import { useState } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, Text, Button, styled, useTheme, AnimatePresence } from '@my/ui'
import { useThemeStore, type ThemeSetting } from '../lib/theme-store'
import { Sun, Moon, Zap } from '@tamagui/lucide-icons'

interface FloatingThemeWidgetProps {
  /** Hide the widget (for focused experiences like routine player) */
  hidden?: boolean
}

// Styled components for glassmorphism effect
const FloatingContainer = styled(YStack, {
  position: 'absolute',
  left: 0,
  right: 0,
  zIndex: 9999,
  alignItems: 'center',
  pointerEvents: 'none',

  ...(Platform.OS === 'web' && {
    // @ts-ignore - fixed is valid on web
    position: 'fixed' as any,
    top: 16,
  }),
})

const PillButton = styled(XStack, {
  backgroundColor: '$background',
  borderRadius: 100,
  paddingHorizontal: '$4',
  paddingVertical: '$2.5',
  borderWidth: 1,
  borderColor: '$borderColor',
  gap: '$2',
  alignItems: 'center',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
  pointerEvents: 'auto',
  cursor: 'pointer',

  hoverStyle: {
    scale: 1.05,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderColor: 'blue',
  },

  pressStyle: {
    scale: 0.98,
  },

  animation: 'quick',
})

const MenuContainer = styled(YStack, {
  backgroundColor: '$background',
  borderRadius: '$6',
  padding: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  gap: '$3',
  minWidth: 240,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.2,
  shadowRadius: 24,
  elevation: 16,
  marginTop: '$3',

  animation: 'quick',
})

const BlurBackdrop = styled(YStack, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 9998,
  pointerEvents: 'auto',

  animation: 'quick',

  ...(Platform.OS === 'web' && {
    // @ts-ignore - fixed is valid on web
    position: 'fixed' as any,
  }),
})

const ThemeOptionButton = styled(XStack, {
  padding: '$3',
  borderRadius: '$4',
  gap: '$3',
  alignItems: 'center',
  cursor: 'pointer',
  borderWidth: 2,
  borderColor: 'transparent',

  hoverStyle: {
    backgroundColor: '$color3',
  },

  pressStyle: {
    scale: 0.97,
  },

  variants: {
    active: {
      true: {
        borderColor: 'blue',
        backgroundColor: 'blue',
      },
    },
  } as const,

  animation: 'quick',
})

const StatusIndicator = styled(YStack, {
  width: 8,
  height: 8,
  borderRadius: 100,

  variants: {
    mode: {
      light: {
        backgroundColor: 'yellow',
      },
      dark: {
        backgroundColor: 'blue',
      },
      auto: {
        backgroundColor: 'green',
      },
    },
  } as const,

  animation: 'bouncy',
})

interface ThemeOption {
  value: ThemeSetting
  label: string
  icon: typeof Sun | typeof Moon | typeof Zap
  description: string
}

const themeOptions: ThemeOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    icon: Zap,
    description: 'Based on time of day',
  },
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Always light mode',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Always dark mode',
  },
]

export function FloatingThemeWidget({ hidden = false }: FloatingThemeWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const themeSetting = useThemeStore((state) => state.themeSetting)
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const setThemeSetting = useThemeStore((state) => state.setThemeSetting)
  const isAuto = useThemeStore((state) => state.isAuto)
  const theme = useTheme()

  // Get safe area insets for iPhone notch/Dynamic Island
  const insets = useSafeAreaInsets()
  const topOffset = Platform.OS === 'web' ? 16 : Math.max(insets.top + 8, 16)

  // Don't render if hidden
  if (hidden) {
    return null
  }

  const handleOptionSelect = (option: ThemeSetting) => {
    setThemeSetting(option)
    setIsExpanded(false)
  }

  // Get current mode indicator
  const getCurrentMode = (): 'light' | 'dark' | 'auto' => {
    if (isAuto()) return 'auto'
    return themeSetting as 'light' | 'dark'
  }

  // Get display label
  const getDisplayLabel = () => {
    if (isAuto()) {
      return `Auto (${currentTheme === 'light' ? 'Light' : 'Dark'})`
    }
    return themeSetting === 'light' ? 'Light' : 'Dark'
  }

  // Get icon component
  const getCurrentIcon = () => {
    if (isAuto()) return Zap
    return themeSetting === 'light' ? Sun : Moon
  }

  const IconComponent = getCurrentIcon()

  return (
    <>
      {/* Blur backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <BlurBackdrop
            key="backdrop"
            animation="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            opacity={1}
            onPress={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating widget */}
      <FloatingContainer style={{ top: topOffset }} pointerEvents="box-none">
        <YStack alignItems="center" pointerEvents="box-none">
          {/* Pill button */}
          <PillButton onPress={() => setIsExpanded(!isExpanded)}>
            <StatusIndicator mode={getCurrentMode()} />
            <IconComponent size={16} color={theme.color10?.val || '#666'} />
            <Text fontSize="$2" fontWeight="600" color="$color11">
              {getDisplayLabel()}
            </Text>
          </PillButton>

          {/* Expanded menu */}
          <AnimatePresence>
            {isExpanded && (
              <MenuContainer
                key="menu"
                animation="quick"
                enterStyle={{ y: -20, opacity: 0, scale: 0.9 }}
                exitStyle={{ y: -20, opacity: 0, scale: 0.9 }}
              >
                <Text fontSize="$3" fontWeight="700" color="$color12" marginBottom="$2">
                  Theme Settings
                </Text>

                {themeOptions.map((option) => {
                  const OptionIcon = option.icon
                  const isActive = themeSetting === option.value

                  return (
                    <ThemeOptionButton
                      key={option.value}
                      active={isActive}
                      onPress={() => handleOptionSelect(option.value)}
                    >
                      <OptionIcon
                        size={20}
                        color={
                          isActive ? theme.blue10?.val || '#0066FF' : theme.color11?.val || '#666'
                        }
                      />
                      <YStack flex={1} gap="$1">
                        <Text
                          fontSize="$3"
                          fontWeight="600"
                          color={isActive ? 'blue' : '$color12'}
                        >
                          {option.label}
                        </Text>
                        <Text fontSize="$2" color="$color11">
                          {option.description}
                        </Text>
                      </YStack>
                      {isActive && (
                        <YStack
                          width={20}
                          height={20}
                          borderRadius={100}
                          backgroundColor="blue"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="$1" color="white">
                            ✓
                          </Text>
                        </YStack>
                      )}
                    </ThemeOptionButton>
                  )
                })}
              </MenuContainer>
            )}
          </AnimatePresence>
        </YStack>
      </FloatingContainer>
    </>
  )
}

/**
 * FloatingNavPill - Pill-shaped bottom navigation with horizontal scroll
 *
 * Features:
 * - Fixed at bottom of screen with glassmorphism
 * - Horizontal scroll with 7 tabs visible + 8th peeking
 * - Smooth scroll animations
 * - Active tab indicator
 * - Respects safe area insets
 * - Matches FloatingThemeWidget design language
 */

import { useRef, useState, useEffect } from 'react'
import { ScrollView, Platform, TouchableOpacity, View, Keyboard, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, Text, styled } from '@my/ui'
import { usePathname, useRouter, useSegments } from 'expo-router'
import {
  Home,
  ListOrdered,
  BookOpen,
  MessageCircle,
  Trophy,
  ScrollText,
  Target,
  Fingerprint,
  Database,
  Shield,
} from '@tamagui/lucide-icons'

// Export height constant for use in screens that need to account for nav pill
export const FLOATING_NAV_HEIGHT = 100 // Approximate height including padding and safe area

// Tab configuration
const TABS = [
  { path: '/', segment: 'index', label: 'Home', icon: Home },
  { path: '/routines', segment: 'routines', label: 'Routines', icon: ListOrdered },
  { path: '/journal', segment: 'journal', label: 'The Log', icon: ScrollText },
  { path: '/vault', segment: 'vault', label: 'Vault', icon: BookOpen },
  { path: '/progress', segment: 'progress', label: 'Progress', icon: Trophy },
  { path: '/path', segment: 'path', label: 'The Path', icon: Target },
  { path: '/blueprint', segment: 'blueprint', label: 'Blueprint', icon: Fingerprint },
  { path: '/guide', segment: 'guide', label: 'Guide', icon: MessageCircle },
  { path: '/rag', segment: 'rag', label: 'RAG System', icon: Database },
  { path: '/auth', segment: 'auth', label: 'Auth', icon: Shield },
]

// Styled components matching FloatingThemeWidget
const FloatingContainer = styled(YStack, {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  alignItems: 'center',
  pointerEvents: 'box-none', // Allow touches through to pill but not to content behind
})

const PillContainer = styled(XStack, {
  backgroundColor: '$background',
  borderRadius: 100,
  borderWidth: 1,
  borderColor: '$borderColor',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
  overflow: 'hidden',
  pointerEvents: 'auto',
  maxWidth: '95%',
})

export function FloatingNavPill() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const segments = useSegments()
  const scrollRef = useRef<ScrollView>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current // 0 = visible, 1 = hidden

  // Get current active segment - handle both root and nested routes
  // Cast to string[] to allow flexible indexing on the tuple
  const segmentArray = segments as string[]
  const currentSegment: string =
    segmentArray.length > 1 ? segmentArray[1] || '' : segmentArray[0] || 'index'

  // Smooth slide animation when keyboard opens/closes
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true)
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start()
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardWillHide', () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setKeyboardVisible(false)
      })
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [slideAnim])

  const handleTabPress = (path: string, index: number) => {
    router.push(path as any)

    // Smooth auto-scroll to center the tapped tab
    if (scrollRef.current) {
      const TAB_WIDTH = 70 // Approximate width of each tab
      const CONTAINER_WIDTH = 350 // Approximate visible container width
      const scrollToX = index * TAB_WIDTH - CONTAINER_WIDTH / 2 + TAB_WIDTH / 2

      scrollRef.current.scrollTo({
        x: Math.max(0, scrollToX),
        animated: true,
      })
    }
  }

  // Calculate slide transform
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150], // Slide down 150px to hide
  })

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 16),
        paddingHorizontal: 12,
        transform: [{ translateY }],
        opacity,
        pointerEvents: keyboardVisible ? 'none' : 'auto',
      }}
    >
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 100,
          borderWidth: 1,
          borderColor: '#e5e5e5',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          overflow: 'hidden',
          maxWidth: '95%',
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 6,
          }}
        >
          {TABS.map((tab, index) => {
            const Icon = tab.icon
            const isActive = currentSegment === tab.segment
            const iconColor = isActive ? '#52a868' : '#a1a1aa'
            const textColor = isActive ? '#52a868' : '#a1a1aa'

            return (
              <TouchableOpacity
                key={tab.segment}
                onPress={() => handleTabPress(tab.path, index)}
                activeOpacity={0.7}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  minWidth: 60,
                }}
              >
                <Icon size={22} color={iconColor} />
                <Text
                  fontSize={10}
                  fontWeight={isActive ? '600' : '400'}
                  color={textColor}
                  marginTop={4}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </Animated.View>
  )
}

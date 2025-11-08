/**
 * Expo Guide Screen
 * Modern AI Chat interface with session management and smooth keyboard handling
 */

import { useState, useRef, useEffect } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, H2, Paragraph, Input, Button, Card, Text } from '@my/ui'
import { Send, MessageCircle, Plus, Trash2, Clock } from '@tamagui/lucide-icons'
import type { ChatMessage } from 'app'
import { useProgressStore, useChatStore, useSovereignPathStore } from 'app/lib/store'
import { useHealthData } from 'app/hooks/useHealthData'
import { useCosmicData } from 'app/hooks/useCosmicData'
import { useAstrologyData } from 'app/hooks/useAstrologyData'
import { AnimatedSheet } from 'app/components/AnimatedSheet'
import { FLOATING_NAV_HEIGHT, getApiUrl } from 'app'

export default function GuideScreen() {
  const insets = useSafeAreaInsets()
  const topPadding = Math.max(insets.top + 8, 16) + 48 + 8

  // Get stores - use primitive selectors to avoid infinite loops
  const complianceStreak = useProgressStore((state) => state.complianceStreak)
  const lastCompletedDate = useProgressStore((state) => state.lastCompletedDate)
  const totalCompletions = useProgressStore((state) => state.totalCompletions)
  const currentSessionId = useChatStore((state) => state.currentSessionId)
  const chatSessions = useChatStore((state) => state.chatSessions)
  const startNewSession = useChatStore((state) => state.startNewSession)
  const getRecentMessages = useChatStore((state) => state.getRecentMessages)
  const addChatMessage = useChatStore((state) => state.addChatMessage)
  const getSessionCount = useChatStore((state) => state.getSessionCount)
  const deleteSession = useChatStore((state) => state.deleteSession)
  const getCurrentSession = useChatStore((state) => state.getCurrentSession)

  // Get multi-source data for AI synthesis
  const humanDesignChart = useSovereignPathStore((state) => state.humanDesignChart)
  const birthData = useSovereignPathStore((state) => state.birthData)
  const { metrics: healthMetrics } = useHealthData()
  const { data: cosmicData } = useCosmicData()
  // Note: astrologyData will be fetched by the API route directly using birthData

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Welcome. I am the Peak Somatic Guide, embodying the integrated wisdom of a world-class sports physical therapist, orthopedic specialist, master somatic healer, and metaphysical guide. Ask me anything about your anterior pelvic tilt correction, biomechanics, energetic alignment, or the deeper meaning behind your body's patterns.",
      timestamp: Date.now(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const paddingAnim = useRef(new Animated.Value(FLOATING_NAV_HEIGHT - 10)).current

  // Track keyboard visibility with smooth padding animation
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true)
      Animated.timing(paddingAnim, {
        toValue: 0, // Minimal padding when keyboard is open
        duration: 250,
        useNativeDriver: false, // Can't use native driver for padding
      }).start()
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false)
      Animated.timing(paddingAnim, {
        toValue: FLOATING_NAV_HEIGHT - 10, // Full padding when keyboard is closed
        duration: 250,
        useNativeDriver: false,
      }).start()
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [paddingAnim])

  // Initialize session on mount
  useEffect(() => {
    if (!currentSessionId) {
      startNewSession()
    }
  }, [currentSessionId, startNewSession])

  // Auto-scroll to bottom when messages change or keyboard appears
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    })

    return () => {
      keyboardDidShowListener.remove()
    }
  }, [])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // Scroll to show loading indicator
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)

    try {
      // Get recent chat history for context
      const recentHistory = getRecentMessages(5)

      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          userProgress: {
            complianceStreak,
            lastCompletedDate,
            totalCompletions,
          },
          recentHistory: recentHistory,
          // Multi-source synthesis data (astrologyData fetched by API using birthData)
          humanDesignChart,
          healthMetrics,
          cosmicData,
          birthData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Save to persistent store
      addChatMessage(userMessage.content, data.response)
    } catch (error) {
      console.error('Error calling AI:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'I apologize, but I encountered an error connecting to the guidance system. Please ensure your Next.js server is running and the API endpoint is accessible.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSession = () => {
    startNewSession()
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          "Welcome to a new session. I'm here to guide you through your somatic alignment journey. What would you like to explore today?",
        timestamp: Date.now(),
      },
    ])
    setShowSessions(false)
  }

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId)
    if (sessionId === currentSessionId) {
      // If we deleted the current session, start a new one
      handleNewSession()
    }
  }

  const formatSessionDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <XStack
      key={item.id}
      justifyContent={item.role === 'user' ? 'flex-end' : 'flex-start'}
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <YStack
        maxWidth="85%"
        backgroundColor={item.role === 'user' ? 'blue' : '$color3'}
        borderRadius="$4"
        padding="$3"
        borderWidth={1}
        borderColor={item.role === 'user' ? 'blue' : '$borderColor'}
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 1 }}
        shadowOpacity={0.1}
        shadowRadius={2}
        elevation={1}
      >
        <Paragraph size="$4" lineHeight="$5" color={item.role === 'user' ? 'white' : '$color12'}>
          {item.content}
        </Paragraph>
      </YStack>
    </XStack>
  )

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <YStack flex={1} backgroundColor="$background">
          {/* Header */}
          <YStack
            paddingTop={topPadding}
            paddingHorizontal="$4"
            paddingBottom="$3"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            backgroundColor="$backgroundHover"
          >
            <XStack justifyContent="space-between" alignItems="center" gap="$2">
              <YStack flex={1}>
                <H2>AI Somatic Guide</H2>
                <Paragraph opacity={0.7} size="$3">
                  {getSessionCount()} conversation{getSessionCount() !== 1 ? 's' : ''}
                </Paragraph>
              </YStack>
              <XStack gap="$2">
                <Button
                  size="$3"
                  icon={MessageCircle}
                  onPress={() => setShowSessions(true)}
                  chromeless
                  circular
                />
                <Button
                  size="$3"
                  icon={Plus}
                  onPress={handleNewSession}
                  backgroundColor="green"
                  color="white"
                  circular
                />
              </XStack>
            </XStack>
          </YStack>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 16,
              flexGrow: 1,
            }}
            ListFooterComponent={
              isLoading ? (
                <XStack justifyContent="flex-start" paddingHorizontal="$4" paddingVertical="$2">
                  <YStack
                    maxWidth="85%"
                    backgroundColor="$color3"
                    borderRadius="$4"
                    padding="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Paragraph size="$4" opacity={0.7}>
                      Accessing integrated wisdom...
                    </Paragraph>
                  </YStack>
                </XStack>
              ) : null
            }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />

          {/* Input Bar */}
          <Animated.View
            style={{
              padding: 12,
              gap: 8,
              borderTopWidth: 1,
              borderTopColor: '#e5e5e5',
              backgroundColor: 'white',
              paddingBottom: Animated.add(paddingAnim, Math.max(insets.bottom, 8)),
              flexDirection: 'row',
            }}
          >
            <Input
              flex={1}
              size="$4"
              placeholder="Ask about posture, exercises, metaphysics..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              disabled={isLoading}
              borderRadius="$10"
              backgroundColor="$backgroundHover"
            />
            <Button
              size="$4"
              icon={Send}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              backgroundColor={!inputText.trim() || isLoading ? '$color8' : 'green'}
              color="white"
              circular
              pressStyle={{ scale: 0.95 }}
            />
          </Animated.View>
        </YStack>
      </KeyboardAvoidingView>

      {/* Session Management Sheet */}
      <AnimatedSheet open={showSessions} onOpenChange={setShowSessions}>
        <YStack padding="$4" gap="$4" maxHeight="80%">
          <XStack justifyContent="space-between" alignItems="center">
            <H2>Chat Sessions</H2>
            <Button size="$3" onPress={() => setShowSessions(false)} chromeless>
              Done
            </Button>
          </XStack>

          {chatSessions.length === 0 ? (
            <YStack padding="$8" gap="$3" alignItems="center">
              <MessageCircle size={48} color="$color10" opacity={0.5} />
              <Paragraph textAlign="center" opacity={0.7}>
                No saved sessions yet.{'\n'}Start a conversation to create one!
              </Paragraph>
            </YStack>
          ) : (
            <YStack gap="$3">
              {chatSessions.map((session) => (
                <Card
                  key={session.id}
                  elevate
                  bordered
                  padding="$3"
                  backgroundColor={session.id === currentSessionId ? 'green' : '$backgroundHover'}
                  borderColor={session.id === currentSessionId ? 'green' : '$borderColor'}
                >
                  <XStack justifyContent="space-between" alignItems="center" gap="$3">
                    <YStack flex={1} gap="$1">
                      <XStack alignItems="center" gap="$2">
                        <Clock size={14} color="$color11" />
                        <Text fontSize="$2" color="$color11">
                          {formatSessionDate(session.lastActive)}
                        </Text>
                      </XStack>
                      <Paragraph size="$3" fontWeight="600">
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </Paragraph>
                      {session.messages[0] && (
                        <Paragraph size="$2" opacity={0.7} numberOfLines={2}>
                          {session.messages[0].userMessage}
                        </Paragraph>
                      )}
                    </YStack>
                    <Button
                      size="$3"
                      icon={Trash2}
                      onPress={() => handleDeleteSession(session.id)}
                      chromeless
                      color="red"
                      circular
                    />
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      </AnimatedSheet>
    </>
  )
}

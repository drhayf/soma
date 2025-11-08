/**
 * Next.js Guide Page
 * AI Chat interface
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { YStack, XStack, H2, Paragraph, Input, Button, Card, ScrollView } from '@my/ui'
import { Send } from '@tamagui/lucide-icons'
import type { ChatMessage } from 'app'
import { useProgressStore, useChatStore, useSovereignPathStore } from 'app/lib/store'
import { useHealthData } from 'app/hooks/useHealthData'
import { useCosmicData } from 'app/hooks/useCosmicData'

export default function GuidePage() {
  // Get stores - use primitive selectors to avoid infinite loops
  const complianceStreak = useProgressStore((state) => state.complianceStreak)
  const lastCompletedDate = useProgressStore((state) => state.lastCompletedDate)
  const totalCompletions = useProgressStore((state) => state.totalCompletions)
  const currentSessionId = useChatStore((state) => state.currentSessionId)
  const startNewSession = useChatStore((state) => state.startNewSession)
  const getRecentMessages = useChatStore((state) => state.getRecentMessages)
  const addChatMessage = useChatStore((state) => state.addChatMessage)
  const getSessionCount = useChatStore((state) => state.getSessionCount)
  const clearAllSessions = useChatStore((state) => state.clearAllSessions)

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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize session on mount
  useEffect(() => {
    if (!currentSessionId) {
      startNewSession()
    }
  }, [currentSessionId, startNewSession])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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

    try {
      // Get recent chat history for context
      const recentHistory = getRecentMessages(5)

      const response = await fetch('/api/chat', {
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
          'I apologize, but I encountered an error. Please ensure you have set up the GOOGLE_API_KEY environment variable and that the API is accessible.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack flex={1} height="100vh" bg="$background" pt={80}>
      {/* Header */}
      <YStack p="$4" borderBottomWidth={1} borderBottomColor="$borderColor" bg="$backgroundHover">
        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1}>
            <H2>AI Somatic Guide</H2>
            <Paragraph opacity={0.7} size="$3">
              Peak integrated wisdom • {getSessionCount()} session(s) saved
            </Paragraph>
          </YStack>
          <Button size="$3" onPress={() => clearAllSessions()} chromeless>
            Clear History
          </Button>
        </XStack>
      </YStack>

      {/* Messages */}
      <ScrollView flex={1}>
        <YStack p="$4" gap="$3">
          {messages.map((message) => (
            <XStack
              key={message.id}
              justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              <Card
                elevate
                size="$4"
                bordered
                maxWidth="85%"
                backgroundColor={message.role === 'user' ? 'blue' : '$backgroundHover'}
              >
                <Card.Header>
                  <Paragraph
                    size="$4"
                    lineHeight="$5"
                    color={message.role === 'user' ? 'white' : undefined}
                  >
                    {message.content}
                  </Paragraph>
                </Card.Header>
              </Card>
            </XStack>
          ))}
          {isLoading && (
            <XStack justifyContent="flex-start">
              <Card elevate size="$4" bordered maxWidth="85%" bg="$backgroundHover">
                <Card.Header>
                  <Paragraph size="$4" opacity={0.7}>
                    Accessing integrated wisdom...
                  </Paragraph>
                </Card.Header>
              </Card>
            </XStack>
          )}
        </YStack>
      </ScrollView>

      {/* Input */}
      <XStack
        p="$4"
        gap="$2"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        bg="$backgroundHover"
      >
        <Input
          flex={1}
          size="$4"
          placeholder="Ask about posture, exercises, metaphysics..."
          value={inputText}
          onChangeText={setInputText}
          onKeyPress={(e: any) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isLoading}
        />
        <Button
          size="$4"
          backgroundColor="green"
          icon={Send}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
          opacity={!inputText.trim() || isLoading ? 0.5 : 1}
        />
      </XStack>
    </YStack>
  )
}

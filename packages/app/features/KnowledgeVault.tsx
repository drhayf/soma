/**
 * Shared KnowledgeVault Component
 * Works on both Expo (React Native) and Next.js (Web)
 */

import { useState } from 'react'
import { YStack, H2, H3, Paragraph, ScrollView } from '@my/ui'
import type { KnowledgeVaultTab } from '../types'

interface KnowledgeVaultProps {
  tabs: KnowledgeVaultTab[]
}

export function KnowledgeVault({ tabs }: KnowledgeVaultProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

  return (
    <YStack flex={1}>
      <YStack padding="$4" paddingBottom="$2">
        <H2 marginBottom="$3">Knowledge Vault</H2>

        {/* iOS-style Segmented Control */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          <YStack flexDirection="row" gap="$2" paddingHorizontal="$1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <YStack
                  key={tab.id}
                  paddingHorizontal="$3.5"
                  paddingVertical="$2.5"
                  borderRadius="$10"
                  backgroundColor={isActive ? 'green' : '$backgroundHover'}
                  pressStyle={{ opacity: 0.7, scale: 0.98 }}
                  animation="quick"
                  onPress={() => setActiveTab(tab.id)}
                  cursor="pointer"
                  minWidth={90}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Paragraph
                    size="$3"
                    fontWeight={isActive ? '600' : '500'}
                    color={isActive ? 'white' : '$color11'}
                    numberOfLines={1}
                    textAlign="center"
                  >
                    {tab.title}
                  </Paragraph>
                </YStack>
              )
            })}
          </YStack>
        </ScrollView>
      </YStack>

      {/* Content Area */}
      <ScrollView flex={1}>
        {tabs.map((tab) => {
          if (tab.id !== activeTab) return null
          return (
            <YStack key={tab.id} gap="$5" padding="$4" paddingTop="$2">
              {tab.sections.map((section) => (
                <YStack key={section.id} gap="$3">
                  <H3 size="$7" color="green">
                    {section.title}
                  </H3>
                  <YStack gap="$2">
                    {section.content.map((paragraph, index) => (
                      <Paragraph
                        key={index}
                        size="$4"
                        lineHeight="$5"
                        color="$color11"
                        opacity={0.9}
                      >
                        {paragraph}
                      </Paragraph>
                    ))}
                  </YStack>
                </YStack>
              ))}
            </YStack>
          )
        })}
      </ScrollView>
    </YStack>
  )
}

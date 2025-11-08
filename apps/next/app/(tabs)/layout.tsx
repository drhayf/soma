/**
 * Next.js Tabs Layout
 * Provides consistent navigation structure matching mobile experience
 */

'use client'

import { ReactNode } from 'react'
import { YStack } from '@my/ui'
import { NavBar } from '../../components/NavBar'
import { FloatingThemeWidget } from 'app'

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <YStack flex={1} height="100vh">
      <YStack flex={1} overflow="hidden">
        {children}
      </YStack>
      <FloatingThemeWidget />
      <NavBar />
    </YStack>
  )
}

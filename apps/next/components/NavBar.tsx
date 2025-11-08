/**
 * NavBar Component for Next.js
 * Bottom navigation bar with horizontal scroll support
 * Displays 7 items at once with subtle peek indicators for more content
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { YStack } from '@my/ui'
import {
  Home,
  ListOrdered,
  BookOpen,
  MessageCircle,
  Trophy,
  ScrollText,
  Target,
  Fingerprint,
} from '@tamagui/lucide-icons'
import { useRef, useState, useEffect } from 'react'

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const tabs = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/routines', label: 'Routines', icon: ListOrdered },
    { path: '/journal', label: 'The Log', icon: ScrollText },
    { path: '/vault', label: 'Vault', icon: BookOpen },
    { path: '/progress', label: 'Progress', icon: Trophy },
    { path: '/path', label: 'The Path', icon: Target },
    { path: '/blueprint', label: 'Blueprint', icon: Fingerprint },
    { path: '/guide', label: 'Guide', icon: MessageCircle },
  ]

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }

  useEffect(() => {
    checkScroll()
    const scrollEl = scrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        scrollEl.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [])

  return (
    <YStack
      borderTopWidth={1}
      borderTopColor="$borderColor"
      bg="$background"
      position="relative"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      style={{ position: 'sticky' }}
    >
      {/* Subtle left peek gradient */}
      {canScrollLeft && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '24px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Subtle right peek gradient */}
      {canScrollRight && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '24px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '8px 0',
          maxWidth: '100vw', // Force container to respect viewport width
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Container div with explicit width to force scrolling: 8 tabs × 115px = 920px */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            paddingLeft: '8px',
            paddingRight: '8px',
            width: '920px',
            minWidth: '920px',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.path || pathname?.startsWith(tab.path + '/')

            return (
              <div
                key={tab.path}
                onClick={() => router.push(tab.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  width: '115px',
                  minWidth: '115px',
                  maxWidth: '115px',
                  flexShrink: 0,
                  padding: '8px',
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.6,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = isActive ? '1' : '0.6')}
              >
                <Icon size={24} color={isActive ? '#52a868' : '#a1a1aa'} />
                <span
                  style={{
                    fontSize: '14px',
                    color: isActive ? '#52a868' : '#a1a1aa',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </YStack>
  )
}

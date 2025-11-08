/**
 * Progress Dashboard Component
 * Comprehensive visualization of user progress with calendar heatmap,
 * streak tracking, completion stats, and journal history
 */

import React, { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import {
  YStack,
  XStack,
  H1,
  H2,
  H3,
  Text,
  Paragraph,
  Card,
  Button,
  ScrollView,
  Progress,
} from '@my/ui'
import { useProgressStore, useJournalStore, useAchievementStore } from '../lib/store'
import type { JournalEntry, MoodType } from '../types'
import shallow from 'zustand/shallow'
import { semanticColors, iconColors } from '../lib/theme-colors'

// Nav height constant
const FLOATING_NAV_HEIGHT = 100

// Conditional haptics import
let Haptics: any = null
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics')
  } catch (e) {
    // Haptics not available
  }
}

interface CalendarDay {
  date: string
  count: number
  hasCompletion: boolean
}

const MOOD_EMOJIS: Record<MoodType, string> = {
  great: '😊',
  good: '🙂',
  neutral: '😐',
  tired: '😴',
  stressed: '😰',
  pain: '😣',
  focused: '🎯',
}

// Generate calendar heatmap data for last 12 weeks (84 days)
const generateCalendarData = (journalEntries: JournalEntry[]): CalendarDay[][] => {
  const weeks: CalendarDay[][] = []
  const today = new Date()

  // Group entries by date
  const entriesByDate = new Map<string, number>()
  journalEntries.forEach((entry) => {
    const dateStr = new Date(entry.timestamp).toISOString().split('T')[0]
    if (dateStr) {
      entriesByDate.set(dateStr, (entriesByDate.get(dateStr) || 0) + 1)
    }
  })

  // Generate 12 weeks of data
  for (let weekIndex = 0; weekIndex < 12; weekIndex++) {
    const week: CalendarDay[] = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const daysAgo = (11 - weekIndex) * 7 + (6 - dayIndex)
      const date = new Date(today)
      date.setDate(date.getDate() - daysAgo)
      const dateStr = date.toISOString().split('T')[0]
      if (!dateStr) continue

      const count = entriesByDate.get(dateStr) || 0

      week.push({
        date: dateStr,
        count,
        hasCompletion: count > 0,
      })
    }

    weeks.push(week)
  }

  return weeks
}

// Get color intensity based on completion count
const getHeatmapColor = (count: number): string => {
  if (count === 0) return '#27272a' // gray-800
  if (count === 1) return '#3f6212' // green-900/50
  if (count === 2) return '#4d7c0f' // green-700
  if (count >= 3) return '#52a868' // green-600
  return '#65a30d' // green-500
}

interface CalendarHeatmapProps {
  journalEntries: JournalEntry[]
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ journalEntries }) => {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const calendarData = useMemo(() => generateCalendarData(journalEntries), [journalEntries])

  const handleDayPress = (day: CalendarDay) => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setSelectedDay(day)
  }

  return (
    <YStack gap="$3">
      {/* Day labels */}
      <XStack gap="$2" paddingLeft={20}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <Text key={i} fontSize="$2" width={14} textAlign="center" color="$color">
            {day}
          </Text>
        ))}
      </XStack>

      {/* Calendar grid - rotated to show weeks horizontally */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2">
          {calendarData.map((week, weekIndex) => (
            <YStack key={`week-${weekIndex}`} gap="$2">
              {week.map((day, dayIndex) => (
                <YStack
                  key={`${weekIndex}-${dayIndex}-${day.date}`}
                  width={14}
                  height={14}
                  backgroundColor={getHeatmapColor(day.count) as any}
                  borderRadius="$2"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => handleDayPress(day)}
                  cursor="pointer"
                />
              ))}
            </YStack>
          ))}
        </XStack>
      </ScrollView>

      {/* Legend */}
      <XStack gap="$2" alignItems="center" justifyContent="flex-end" paddingRight="$2">
        <Text fontSize="$2" color="$color11">
          Less
        </Text>
        <YStack width={12} height={12} backgroundColor="$color5" borderRadius="$1" />
        <YStack width={12} height={12} backgroundColor="$green6" borderRadius="$1" />
        <YStack width={12} height={12} backgroundColor="$green8" borderRadius="$1" />
        <YStack width={12} height={12} backgroundColor="$green10" borderRadius="$1" />
        <Text fontSize="$2" color="$color11">
          More
        </Text>
      </XStack>

      {/* Selected day info */}
      {selectedDay && selectedDay.hasCompletion && (
        <Card
          padding="$3"
          backgroundColor={semanticColors.success.background}
          borderWidth={1}
          borderColor={semanticColors.success.border}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Paragraph size="$3">
              {new Date(selectedDay.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Paragraph>
            <Paragraph size="$3" fontWeight="600" color={semanticColors.success.text}>
              {selectedDay.count} routine{selectedDay.count !== 1 ? 's' : ''}
            </Paragraph>
          </XStack>
        </Card>
      )}
    </YStack>
  )
}

interface WeeklyBarChartProps {
  journalEntries: JournalEntry[]
}

const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ journalEntries }) => {
  const weekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts = new Array(7).fill(0)

    // Count entries by day of week
    journalEntries.forEach((entry) => {
      const date = new Date(entry.timestamp)
      const dayOfWeek = date.getDay()
      counts[dayOfWeek]++
    })

    return days.map((day, index) => ({
      day,
      count: counts[index],
    }))
  }, [journalEntries])

  const maxCount = Math.max(...weekData.map((d) => d.count), 1)

  return (
    <YStack gap="$3">
      <XStack gap="$2" alignItems="flex-end" height={150}>
        {weekData.map((item, index) => {
          const heightPercent = (item.count / maxCount) * 100

          return (
            <YStack key={index} flex={1} gap="$1" alignItems="center">
              <Text fontSize="$2" color="$color11" marginBottom="$1">
                {item.count}
              </Text>
              <YStack flex={1} width="100%" justifyContent="flex-end">
                <YStack
                  width="100%"
                  height={`${heightPercent}%`}
                  backgroundColor="green"
                  borderRadius="$2"
                  minHeight={item.count > 0 ? 8 : 0}
                />
              </YStack>
              <Text fontSize="$2" color="$color10" marginTop="$1">
                {item.day}
              </Text>
            </YStack>
          )
        })}
      </XStack>
    </YStack>
  )
}

export const ProgressDashboard: React.FC = () => {
  const complianceStreak = useProgressStore((state) => state.complianceStreak)
  const totalCompletions = useProgressStore((state) => state.totalCompletions)
  const lastCompletedDate = useProgressStore((state) => state.lastCompletedDate)
  const getDaysSinceLastCompletion = useProgressStore((state) => state.getDaysSinceLastCompletion)
  const journalEntries = useJournalStore((state) => state.journalEntries)
  const getRecentEntries = useJournalStore((state) => state.getRecentEntries)
  const achievements = useAchievementStore((state) => state.achievements)
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'all'>('month')

  // Calculate stats
  const daysSinceLastCompletion = getDaysSinceLastCompletion()
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length
  const achievementPercent =
    achievements.length > 0 ? Math.round((unlockedAchievements / achievements.length) * 100) : 0

  // Filter entries by view mode
  const filteredEntries = useMemo(() => {
    const now = new Date()

    if (viewMode === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return journalEntries.filter((e) => new Date(e.timestamp) >= weekAgo)
    } else if (viewMode === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return journalEntries.filter((e) => new Date(e.timestamp) >= monthAgo)
    }

    return journalEntries
  }, [journalEntries, viewMode])

  // Calculate routine type breakdown
  const morningCount = journalEntries.filter((e) => e.routineType === 'morning').length
  const eveningCount = journalEntries.filter((e) => e.routineType === 'evening').length
  const morningPercent =
    totalCompletions > 0 ? Math.round((morningCount / totalCompletions) * 100) : 0
  const eveningPercent =
    totalCompletions > 0 ? Math.round((eveningCount / totalCompletions) * 100) : 0

  const recentEntries = getRecentEntries(10)

  const handleViewModeChange = (mode: 'week' | 'month' | 'all') => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setViewMode(mode)
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: FLOATING_NAV_HEIGHT }}>
      <YStack flex={1} padding="$4" gap="$4" backgroundColor="$background">
        {/* Header */}
        <YStack gap="$2" marginTop="$4">
          <H1 size="$9">Progress Dashboard</H1>
          <Paragraph opacity={0.7} size="$4">
            Your somatic alignment journey
          </Paragraph>
        </YStack>

        {/* View Mode Selector */}
        <XStack gap="$2" justifyContent="center">
          <Button
            size="$3"
            backgroundColor={viewMode === 'week' ? 'green' : '$color4'}
            color={viewMode === 'week' ? 'white' : '$color11'}
            onPress={() => handleViewModeChange('week')}
            pressStyle={{ scale: 0.95 }}
          >
            Week
          </Button>
          <Button
            size="$3"
            backgroundColor={viewMode === 'month' ? 'green' : '$color4'}
            color={viewMode === 'month' ? 'white' : '$color11'}
            onPress={() => handleViewModeChange('month')}
            pressStyle={{ scale: 0.95 }}
          >
            Month
          </Button>
          <Button
            size="$3"
            backgroundColor={viewMode === 'all' ? 'green' : '$color4'}
            color={viewMode === 'all' ? 'white' : '$color11'}
            onPress={() => handleViewModeChange('all')}
            pressStyle={{ scale: 0.95 }}
          >
            All Time
          </Button>
        </XStack>

        {/* Key Stats Grid */}
        <XStack gap="$3">
          <Card
            flex={1}
            elevate
            size="$4"
            padding="$4"
            backgroundColor={semanticColors.success.background}
          >
            <YStack gap="$2" alignItems="center">
              <Text fontSize={48} lineHeight={48}>
                🔥
              </Text>
              <H2 size="$9" color={semanticColors.success.text}>
                {complianceStreak}
              </H2>
              <Paragraph size="$3" textAlign="center" color="$color11">
                Day Streak
              </Paragraph>
            </YStack>
          </Card>

          <Card
            flex={1}
            elevate
            size="$4"
            padding="$4"
            backgroundColor={semanticColors.info.background}
          >
            <YStack gap="$2" alignItems="center">
              <Text fontSize={48} lineHeight={48}>
                ✓
              </Text>
              <H2 size="$9" color={semanticColors.info.text}>
                {totalCompletions}
              </H2>
              <Paragraph size="$3" textAlign="center" color="$color11">
                Total Routines
              </Paragraph>
            </YStack>
          </Card>
        </XStack>

        {/* Last Completion Info */}
        {lastCompletedDate && (
          <Card elevate size="$4" padding="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Paragraph size="$3" color="$color11">
                  Last Completed
                </Paragraph>
                <Paragraph size="$5" fontWeight="600">
                  {new Date(lastCompletedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Paragraph>
              </YStack>
              {daysSinceLastCompletion === 0 && (
                <YStack
                  backgroundColor={semanticColors.success.border}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$4"
                >
                  <Text color="white" fontWeight="600" fontSize="$3">
                    TODAY ✓
                  </Text>
                </YStack>
              )}
              {daysSinceLastCompletion > 0 && (
                <YStack
                  backgroundColor={semanticColors.warning.border}
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderRadius="$4"
                >
                  <Text color="white" fontWeight="600" fontSize="$3">
                    {daysSinceLastCompletion} day{daysSinceLastCompletion !== 1 ? 's' : ''} ago
                  </Text>
                </YStack>
              )}
            </XStack>
          </Card>
        )}

        {/* Calendar Heatmap */}
        <Card elevate size="$4" padding="$4">
          <YStack gap="$3">
            <H3 size="$6">Activity Calendar</H3>
            <Paragraph size="$3" color="$color11">
              Last 12 weeks of practice
            </Paragraph>
            <CalendarHeatmap journalEntries={journalEntries} />
          </YStack>
        </Card>

        {/* Weekly Activity Chart */}
        <Card elevate size="$4" padding="$4">
          <YStack gap="$3">
            <H3 size="$6">Weekly Activity</H3>
            <Paragraph size="$3" color="$color11">
              Routines by day of week
            </Paragraph>
            <WeeklyBarChart journalEntries={filteredEntries} />
          </YStack>
        </Card>

        {/* Routine Type Breakdown */}
        <Card elevate size="$4" padding="$4">
          <YStack gap="$3">
            <H3 size="$6">Routine Types</H3>
            <XStack gap="$3">
              <YStack flex={1} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Paragraph size="$3">🌅 Morning</Paragraph>
                  <Paragraph size="$3" fontWeight="600" color={semanticColors.warning.text}>
                    {morningCount}
                  </Paragraph>
                </XStack>
                <Progress value={morningPercent} max={100} size="$2">
                  <Progress.Indicator
                    animation="bouncy"
                    backgroundColor={semanticColors.warning.border}
                  />
                </Progress>
              </YStack>

              <YStack flex={1} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Paragraph size="$3">🌙 Evening</Paragraph>
                  <Paragraph size="$3" fontWeight="600" color={semanticColors.info.text}>
                    {eveningCount}
                  </Paragraph>
                </XStack>
                <Progress value={eveningPercent} max={100} size="$2">
                  <Progress.Indicator
                    animation="bouncy"
                    backgroundColor={semanticColors.info.border}
                  />
                </Progress>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Achievement Summary */}
        <Card elevate size="$4" padding="$4" backgroundColor="$backgroundHover">
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <H3 size="$6">🏆 Achievements</H3>
              <Paragraph size="$4" fontWeight="600" color={semanticColors.success.text}>
                {unlockedAchievements}/{achievements.length}
              </Paragraph>
            </XStack>
            <Progress value={achievementPercent} max={100} size="$3">
              <Progress.Indicator
                animation="bouncy"
                backgroundColor={semanticColors.success.border}
              />
            </Progress>
          </YStack>
        </Card>

        {/* Recent Journal Entries */}
        <Card elevate size="$4" padding="$4">
          <YStack gap="$3">
            <H3 size="$6">Recent Journal Entries</H3>
            {recentEntries.length === 0 && (
              <Paragraph size="$3" color="$color11" textAlign="center" padding="$4">
                No journal entries yet. Complete a routine to start journaling!
              </Paragraph>
            )}
            {recentEntries.map((entry) => (
              <Card
                key={entry.id}
                padding="$3"
                backgroundColor="$color2"
                borderWidth={1}
                borderColor="$color6"
              >
                <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
                  <YStack flex={1} gap="$1">
                    <XStack gap="$2" alignItems="center">
                      <Text fontSize={24}>{MOOD_EMOJIS[entry.mood]}</Text>
                      <Paragraph size="$3" fontWeight="600">
                        {entry.routineName}
                      </Paragraph>
                      {entry.routineType && (
                        <Text fontSize={16}>{entry.routineType === 'morning' ? '🌅' : '🌙'}</Text>
                      )}
                    </XStack>
                    <Paragraph size="$2" color="$color11">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Paragraph>
                    {entry.notes && (
                      <Paragraph size="$3" numberOfLines={2} opacity={0.8} marginTop="$1">
                        {entry.notes}
                      </Paragraph>
                    )}
                  </YStack>
                  {entry.difficulty && (
                    <YStack
                      backgroundColor={
                        entry.difficulty === 'easy'
                          ? 'green'
                          : entry.difficulty === 'moderate'
                            ? 'yellow'
                            : 'red'
                      }
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$3"
                    >
                      <Text color="white" fontSize="$2" fontWeight="600">
                        {entry.difficulty.toUpperCase()}
                      </Text>
                    </YStack>
                  )}
                </XStack>
              </Card>
            ))}
          </YStack>
        </Card>

        {/* Bottom Padding */}
        <YStack height={40} />
      </YStack>
    </ScrollView>
  )
}

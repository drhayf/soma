import React, { useState, useMemo } from 'react'
import { Platform } from 'react-native'
import { YStack, XStack, H2, H3, Text, Paragraph, Card, Button, Progress, ScrollView } from '@my/ui'
import { useAchievementStore } from '../lib/store'
import { ShineEffect } from '../components/ShineEffect'
import { AnimatedButton } from '../components/AnimatedButton'
import type { Achievement } from '../types'
import { semanticColors } from '../lib/theme-colors'

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

type CategoryFilter = 'all' | 'completion' | 'streak' | 'journey' | 'special'
type SortOption = 'recent' | 'progress' | 'category'

interface AchievementBadgeProps {
  achievement: Achievement
  onPress: () => void
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, onPress }) => {
  const isUnlocked = achievement.unlocked
  const progress = achievement.progress || 0
  const requirement = achievement.requirement
  const progressPercent = requirement > 0 ? Math.round((progress / requirement) * 100) : 0

  // Check if recently unlocked (within last 24 hours)
  const isRecentlyUnlocked =
    isUnlocked &&
    achievement.unlockedDate &&
    Date.now() - new Date(achievement.unlockedDate).getTime() < 24 * 60 * 60 * 1000

  const handlePress = () => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onPress()
  }

  const badgeContent = (
    <Card
      elevate
      size="$4"
      padding="$4"
      backgroundColor={isUnlocked ? '$background' : '$color2'}
      borderColor={isUnlocked ? 'green' : '$color6'}
      borderWidth={isUnlocked ? 2 : 1}
      pressStyle={{
        scale: 0.97,
        borderColor: isUnlocked ? 'green' : '$color7',
      }}
      animation="bouncy"
      onPress={handlePress}
      cursor="pointer"
    >
      <YStack gap="$3" alignItems="center" minHeight={160}>
        {/* Icon with lock overlay for locked achievements */}
        <YStack position="relative" alignItems="center" justifyContent="center">
          <Text
            fontSize={isUnlocked ? 56 : 48}
            opacity={isUnlocked ? 1 : 0.3}
            style={{
              filter: isUnlocked ? 'none' : 'grayscale(100%)',
            }}
          >
            {achievement.icon}
          </Text>
          {!isUnlocked && (
            <YStack
              position="absolute"
              backgroundColor="$color8"
              borderRadius="$6"
              padding="$2"
              bottom={-8}
              right={-8}
            >
              <Text fontSize={18}>🔒</Text>
            </YStack>
          )}
          {isUnlocked && (
            <YStack
              position="absolute"
              backgroundColor={semanticColors.success.border}
              borderRadius="$6"
              padding="$2"
              bottom={-8}
              right={-8}
            >
              <Text fontSize={14}>✓</Text>
            </YStack>
          )}
        </YStack>

        {/* Achievement Name */}
        <H3
          size="$5"
          textAlign="center"
          color={isUnlocked ? '$color' : '$color10'}
          numberOfLines={2}
        >
          {achievement.name}
        </H3>

        {/* Progress Bar for in-progress achievements */}
        {!isUnlocked && progress > 0 && (
          <YStack width="100%" gap="$1">
            <Progress value={progressPercent} max={100} size="$2">
              <Progress.Indicator
                animation="bouncy"
                backgroundColor={semanticColors.success.border}
              />
            </Progress>
            <Text fontSize="$2" textAlign="center" color="$color11">
              {progress}/{requirement}
            </Text>
          </YStack>
        )}

        {/* Unlock Date for completed achievements */}
        {isUnlocked && achievement.unlockedDate && (
          <Text fontSize="$2" color={semanticColors.success.text} fontWeight="600">
            Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
          </Text>
        )}
      </YStack>
    </Card>
  )

  // Wrap with ShineEffect if recently unlocked
  return isRecentlyUnlocked ? (
    <ShineEffect enabled={true} delay={300} duration={1500} repeat={false}>
      {badgeContent}
    </ShineEffect>
  ) : (
    badgeContent
  )
}

interface AchievementDetailModalProps {
  achievement: Achievement
  onClose: () => void
}

const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  achievement,
  onClose,
}) => {
  const isUnlocked = achievement.unlocked
  const progress = achievement.progress || 0
  const requirement = achievement.requirement
  const progressPercent = requirement > 0 ? Math.round((progress / requirement) * 100) : 0

  const categoryColors = {
    completion: 'blue',
    streak: 'yellow',
    journey: 'blue',
    special: 'red',
  }

  const categoryLabels = {
    completion: 'Completion Milestone',
    streak: 'Streak Challenge',
    journey: 'Journaling Journey',
    special: 'Special Achievement',
  }

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.7)"
      justifyContent="center"
      alignItems="center"
      padding="$4"
      zIndex={1000}
      onPress={onClose}
    >
      <Card
        elevate
        size="$5"
        padding="$5"
        backgroundColor="$background"
        maxWidth={500}
        width="100%"
        onPress={(e) => e.stopPropagation()}
        animation="quick"
        enterStyle={{
          scale: 0.9,
          opacity: 0,
          y: -20,
        }}
      >
        <YStack gap="$4">
          {/* Close Button */}
          <XStack justifyContent="flex-end">
            <AnimatedButton
              size="$3"
              circular
              chromeless
              onPress={onClose}
              icon={<Text fontSize={20}>✕</Text>}
              pressScale={0.9}
              hapticStyle="light"
            />
          </XStack>

          {/* Icon */}
          <YStack alignItems="center">
            <Text
              fontSize={80}
              style={{
                filter: isUnlocked ? 'none' : 'grayscale(100%)',
              }}
              opacity={isUnlocked ? 1 : 0.5}
            >
              {achievement.icon}
            </Text>
          </YStack>

          {/* Name & Status */}
          <YStack gap="$2" alignItems="center">
            <H2 size="$8" textAlign="center">
              {achievement.name}
            </H2>
            {isUnlocked ? (
              <XStack
                backgroundColor={semanticColors.success.border}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                gap="$2"
                alignItems="center"
              >
                <Text fontSize={14}>✓</Text>
                <Text color="white" fontWeight="600" fontSize="$3">
                  UNLOCKED
                </Text>
              </XStack>
            ) : (
              <XStack
                backgroundColor="$color8"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                gap="$2"
                alignItems="center"
              >
                <Text fontSize={14}>🔒</Text>
                <Text color="$color11" fontWeight="600" fontSize="$3">
                  LOCKED
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Description */}
          <Paragraph size="$4" textAlign="center" color="$color11">
            {achievement.description}
          </Paragraph>

          {/* Category Badge */}
          <XStack justifyContent="center">
            <YStack
              backgroundColor={categoryColors[achievement.category] as any}
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderRadius="$3"
            >
              <Text color="white" fontSize="$2" fontWeight="600">
                {categoryLabels[achievement.category]}
              </Text>
            </YStack>
          </XStack>

          {/* Progress Section */}
          {!isUnlocked && (
            <YStack gap="$3" padding="$4" backgroundColor="$color2" borderRadius="$4">
              <H3 size="$5" textAlign="center">
                Progress
              </H3>
              <Progress value={progressPercent} max={100} size="$3">
                <Progress.Indicator
                  animation="bouncy"
                  backgroundColor={semanticColors.success.border}
                />
              </Progress>
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$color11">
                  {progress} / {requirement}
                </Text>
                <Text fontSize="$3" color={semanticColors.success.text} fontWeight="600">
                  {Math.round(progressPercent)}%
                </Text>
              </XStack>
              {achievement.category === 'completion' && (
                <Paragraph size="$2" textAlign="center" color="$color10">
                  Complete {requirement - progress} more routine
                  {requirement - progress !== 1 ? 's' : ''} to unlock
                </Paragraph>
              )}
              {achievement.category === 'streak' && (
                <Paragraph size="$2" textAlign="center" color="$color10">
                  {requirement - progress} more day{requirement - progress !== 1 ? 's' : ''} to
                  unlock
                </Paragraph>
              )}
              {achievement.category === 'journey' && (
                <Paragraph size="$2" textAlign="center" color="$color10">
                  Write {requirement - progress} more journal entr
                  {requirement - progress !== 1 ? 'ies' : 'y'} to unlock
                </Paragraph>
              )}
            </YStack>
          )}

          {/* Unlock Date */}
          {isUnlocked && achievement.unlockedDate && (
            <YStack
              gap="$2"
              padding="$4"
              backgroundColor={semanticColors.success.background}
              borderRadius="$4"
            >
              <Text fontSize="$3" textAlign="center" color="$color11">
                Unlocked on
              </Text>
              <Text
                fontSize="$5"
                textAlign="center"
                fontWeight="600"
                color={semanticColors.success.text}
              >
                {new Date(achievement.unlockedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </YStack>
          )}

          {/* Close Button */}
          <AnimatedButton
            size="$5"
            onPress={onClose}
            backgroundColor={semanticColors.success.background}
            pressScale={0.97}
            hapticStyle="medium"
          >
            <Text color="white" fontWeight="600">
              Close
            </Text>
          </AnimatedButton>
        </YStack>
      </Card>
    </YStack>
  )
}

export const AchievementGallery: React.FC = () => {
  const achievements = useAchievementStore((state) => state.achievements)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('category')

  // Stats
  const totalAchievements = achievements.length
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const progressPercent =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0

  // Filter and sort achievements
  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = achievements

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter)
    }

    // Apply sorting
    const sorted = [...filtered]
    if (sortOption === 'recent') {
      sorted.sort((a, b) => {
        if (!a.unlocked && !b.unlocked) return 0
        if (!a.unlocked) return 1
        if (!b.unlocked) return -1
        return new Date(b.unlockedDate!).getTime() - new Date(a.unlockedDate!).getTime()
      })
    } else if (sortOption === 'progress') {
      sorted.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1
        if (!a.unlocked && b.unlocked) return 1
        if (a.unlocked && b.unlocked) return 0
        const aPercent = a.requirement > 0 ? (a.progress || 0) / a.requirement : 0
        const bPercent = b.requirement > 0 ? (b.progress || 0) / b.requirement : 0
        return bPercent - aPercent
      })
    } else if (sortOption === 'category') {
      sorted.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.requirement - b.requirement
      })
    }

    return sorted
  }, [achievements, categoryFilter, sortOption])

  const handleFilterChange = (filter: CategoryFilter) => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setCategoryFilter(filter)
  }

  const handleSortChange = (sort: SortOption) => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setSortOption(sort)
  }

  return (
    <YStack flex={1} padding="$4" gap="$4">
      {/* Header Stats */}
      <Card elevate size="$4" padding="$4" backgroundColor={semanticColors.success.background}>
        <YStack gap="$3">
          <H2 size="$8" textAlign="center">
            🏆 Achievements
          </H2>
          <XStack justifyContent="space-around" alignItems="center">
            <YStack alignItems="center" gap="$1">
              <Text fontSize={40}>{unlockedCount}</Text>
              <Text fontSize="$3" color="$color11">
                Unlocked
              </Text>
            </YStack>
            <YStack alignItems="center" gap="$1">
              <Text fontSize={40}>{totalAchievements - unlockedCount}</Text>
              <Text fontSize="$3" color="$color11">
                Locked
              </Text>
            </YStack>
            <YStack alignItems="center" gap="$1">
              <Text fontSize={40} color={semanticColors.success.text} fontWeight="600">
                {Math.round(progressPercent)}%
              </Text>
              <Text fontSize="$3" color="$color11">
                Complete
              </Text>
            </YStack>
          </XStack>
          <Progress value={progressPercent} max={100} size="$3">
            <Progress.Indicator
              animation="bouncy"
              backgroundColor={semanticColors.success.border}
            />
          </Progress>
        </YStack>
      </Card>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2" paddingHorizontal="$1">
          <AnimatedButton
            size="$3"
            backgroundColor={categoryFilter === 'all' ? 'green' : '$color4'}
            color={categoryFilter === 'all' ? 'white' : '$color11'}
            onPress={() => handleFilterChange('all')}
            pressScale={0.95}
            hapticStyle="light"
          >
            All
          </AnimatedButton>
          <AnimatedButton
            size="$3"
            backgroundColor={categoryFilter === 'completion' ? 'blue' : '$color4'}
            color={categoryFilter === 'completion' ? 'white' : '$color11'}
            onPress={() => handleFilterChange('completion')}
            pressScale={0.95}
            hapticStyle="light"
          >
            Completion
          </AnimatedButton>
          <AnimatedButton
            size="$3"
            backgroundColor={categoryFilter === 'streak' ? 'yellow' : '$color4'}
            color={categoryFilter === 'streak' ? 'white' : '$color11'}
            onPress={() => handleFilterChange('streak')}
            pressScale={0.95}
            hapticStyle="light"
          >
            Streak
          </AnimatedButton>
          <AnimatedButton
            size="$3"
            backgroundColor={categoryFilter === 'journey' ? 'blue' : '$color4'}
            color={categoryFilter === 'journey' ? 'white' : '$color11'}
            onPress={() => handleFilterChange('journey')}
            pressScale={0.95}
            hapticStyle="light"
          >
            Journey
          </AnimatedButton>
          <AnimatedButton
            size="$3"
            backgroundColor={categoryFilter === 'special' ? 'red' : '$color4'}
            color={categoryFilter === 'special' ? 'white' : '$color11'}
            onPress={() => handleFilterChange('special')}
            pressScale={0.95}
            hapticStyle="light"
          >
            Special
          </AnimatedButton>
        </XStack>
      </ScrollView>

      {/* Sort Options */}
      <XStack gap="$2" justifyContent="center">
        <Text fontSize="$3" color="$color11">
          Sort by:
        </Text>
        <AnimatedButton
          size="$2"
          chromeless
          color={sortOption === 'category' ? 'green' : '$color11'}
          onPress={() => handleSortChange('category')}
          fontWeight={sortOption === 'category' ? '600' : '400'}
          pressScale={0.93}
          hapticStyle="light"
        >
          Category
        </AnimatedButton>
        <Text color="$color8">•</Text>
        <AnimatedButton
          size="$2"
          chromeless
          color={sortOption === 'progress' ? 'green' : '$color11'}
          onPress={() => handleSortChange('progress')}
          fontWeight={sortOption === 'progress' ? '600' : '400'}
          pressScale={0.93}
          hapticStyle="light"
        >
          Progress
        </AnimatedButton>
        <Text color="$color8">•</Text>
        <AnimatedButton
          size="$2"
          chromeless
          color={sortOption === 'recent' ? 'green' : '$color11'}
          onPress={() => handleSortChange('recent')}
          fontWeight={sortOption === 'recent' ? '600' : '400'}
          pressScale={0.93}
          hapticStyle="light"
        >
          Recent
        </AnimatedButton>
      </XStack>

      {/* Achievement Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: FLOATING_NAV_HEIGHT }}
      >
        <YStack gap="$3" paddingBottom="$6">
          {/* Use responsive grid - 2 columns on mobile, 3-4 on larger screens */}
          {filteredAndSortedAchievements
            .reduce((rows, achievement, index) => {
              const rowIndex = Math.floor(index / 2)
              if (!rows[rowIndex]) {
                rows[rowIndex] = []
              }
              rows[rowIndex].push(achievement)
              return rows
            }, [] as Achievement[][])
            .map((row, rowIndex) => (
              <XStack key={rowIndex} gap="$3">
                {row.map((achievement) => (
                  <YStack key={achievement.id} flex={1} maxWidth="50%">
                    <AchievementBadge
                      achievement={achievement}
                      onPress={() => setSelectedAchievement(achievement)}
                    />
                  </YStack>
                ))}
                {/* Add empty spacer if odd number in last row */}
                {row.length === 1 && <YStack flex={1} maxWidth="50%" />}
              </XStack>
            ))}
        </YStack>
      </ScrollView>

      {/* Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </YStack>
  )
}

/**
 * User List Screen - Select from existing users
 * Development/testing helper to quickly switch between accounts
 */

import { useState, useEffect } from 'react'
import { YStack, XStack, Button, Paragraph, H2, Circle, Spinner, ScrollView } from '@my/ui'
import { User as UserIcon, Plus, Check } from '@tamagui/lucide-icons'
import { supabase } from '../../lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { semanticColors, iconColors } from '../../lib/theme-colors'

interface UserListScreenProps {
  onUserSelect: (user: User) => void
  onCreateNew: () => void
}

export function UserListScreen({ onUserSelect, onCreateNew }: UserListScreenProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      // Note: This requires service role key - only works in development
      // In production, you'd manage this through the Supabase dashboard
      const { data, error: listError } = await supabase.auth.admin.listUsers()

      if (listError) {
        throw listError
      }

      setUsers(data?.users || [])
    } catch (err: any) {
      console.error('[UserList] Error loading users:', err)
      setError('Could not load users. Use magic link instead.')
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = async (user: User) => {
    // This is for development only - in production users would use magic link/PIN
    onUserSelect(user)
  }

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Spinner size="large" />
        <Paragraph color="gray">Loading accounts...</Paragraph>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4" padding="$6">
        <Paragraph color={semanticColors.error.text} textAlign="center">
          {error}
        </Paragraph>
        <Button onPress={onCreateNew} theme="blue">
          Sign In with Magic Link
        </Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$6" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <H2>Select Account</H2>
        <Paragraph color="gray" fontSize="$3">
          Development mode - Quickly switch between test accounts
        </Paragraph>
      </YStack>

      <ScrollView flex={1}>
        <YStack padding="$4" gap="$3">
          {/* Create new account */}
          <Button
            size="$5"
            onPress={onCreateNew}
            theme="blue"
            icon={<Plus />}
            justifyContent="flex-start"
          >
            Create New Account
          </Button>

          {/* Existing users */}
          {users.length === 0 ? (
            <YStack padding="$6" alignItems="center" gap="$3">
              <Paragraph color="gray" textAlign="center">
                No accounts found. Create one to get started!
              </Paragraph>
            </YStack>
          ) : (
            users.map((user) => (
              <Button
                key={user.id}
                size="$5"
                onPress={() => handleUserClick(user)}
                backgroundColor="gray"
                borderColor="gray"
                borderWidth={1}
                pressStyle={{
                  backgroundColor: 'gray',
                  borderColor: 'gray',
                }}
                justifyContent="flex-start"
              >
                <XStack flex={1} gap="$3" alignItems="center">
                  <Circle
                    size={40}
                    backgroundColor={semanticColors.primary.background}
                    borderColor={semanticColors.primary.border}
                    borderWidth={1}
                  >
                    <UserIcon size={20} color={iconColors.primary} />
                  </Circle>
                  <YStack flex={1} alignItems="flex-start">
                    <Paragraph fontWeight="600" color="gray">
                      {user.email}
                    </Paragraph>
                    <Paragraph fontSize="$2" color="gray">
                      Created {new Date(user.created_at).toLocaleDateString()}
                    </Paragraph>
                  </YStack>
                </XStack>
              </Button>
            ))
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

/**
 * Local Auth Screen - PIN + Biometric + User Selection
 * Fast local authentication for returning users
 */

import { useState, useEffect } from 'react'
import { YStack, XStack, Button, Paragraph, H2, H3, Circle, Spinner } from '@my/ui'
import { Fingerprint, Lock, Check, User as UserIcon } from '@tamagui/lucide-icons'
import { useAuthStore } from '../../lib/auth-store'
import { Platform } from 'react-native'
import { semanticColors, iconColors } from '../../lib/theme-colors'

// For biometric auth on native
let LocalAuthentication: any = null
if (Platform.OS !== 'web') {
  try {
    LocalAuthentication = require('expo-local-authentication')
  } catch {
    console.log('[Auth] expo-local-authentication not available')
  }
}

interface LocalAuthScreenProps {
  onAuthSuccess: () => void
}

export function LocalAuthScreen({ onAuthSuccess }: LocalAuthScreenProps) {
  const user = useAuthStore((state) => state.user)
  const hasLocalAuth = useAuthStore((state) => state.hasLocalAuth)
  const biometricEnabled = useAuthStore((state) => state.biometricEnabled)
  const verifyLocalPin = useAuthStore((state) => state.verifyLocalPin)

  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if biometric is available
  useEffect(() => {
    if (Platform.OS !== 'web' && LocalAuthentication) {
      LocalAuthentication.hasHardwareAsync().then((hasHardware: boolean) => {
        if (hasHardware) {
          LocalAuthentication.isEnrolledAsync().then((isEnrolled: boolean) => {
            setBiometricAvailable(isEnrolled)
          })
        }
      })
    }
  }, [])

  // Auto-trigger biometric on mount if enabled
  useEffect(() => {
    if (biometricEnabled && biometricAvailable && Platform.OS !== 'web') {
      handleBiometricAuth()
    }
  }, [biometricEnabled, biometricAvailable])

  const handleBiometricAuth = async () => {
    if (!LocalAuthentication) return

    setLoading(true)
    setError(null)

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Somatic Alignment',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      })

      if (result.success) {
        onAuthSuccess()
      } else {
        setError('Biometric authentication failed')
      }
    } catch (err) {
      setError('Biometric authentication error')
    } finally {
      setLoading(false)
    }
  }

  const handlePinPress = (digit: string) => {
    if (pin.length >= 4) return

    const newPin = pin + digit
    setPin(newPin)
    setError(null)

    // Auto-verify when 4 digits entered
    if (newPin.length === 4) {
      setTimeout(() => {
        if (verifyLocalPin(newPin)) {
          onAuthSuccess()
        } else {
          setError('Incorrect PIN')
          setPin('')
        }
      }, 100)
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(null)
  }

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$6"
      gap="$6"
      backgroundColor="$background"
    >
      {/* User info */}
      <YStack alignItems="center" gap="$3">
        <Circle
          size={80}
          backgroundColor={semanticColors.primary.background}
          borderColor={semanticColors.primary.border}
          borderWidth={2}
        >
          <UserIcon size={40} color={iconColors.primary} />
        </Circle>
        <YStack alignItems="center" gap="$1">
          <H2>Welcome Back</H2>
          <Paragraph color="gray" fontSize="$4">
            {user?.email || 'Sign in to continue'}
          </Paragraph>
        </YStack>
      </YStack>

      {/* Biometric option */}
      {biometricAvailable && biometricEnabled && Platform.OS !== 'web' && (
        <Button
          size="$6"
          circular
          backgroundColor={semanticColors.primary.background}
          borderColor={semanticColors.primary.border}
          borderWidth={2}
          icon={
            loading ? (
              <Spinner color={iconColors.primary} />
            ) : (
              <Fingerprint size={32} color={iconColors.primary} />
            )
          }
          onPress={handleBiometricAuth}
          disabled={loading}
        />
      )}

      {/* PIN entry */}
      {hasLocalAuth && (
        <YStack gap="$4" alignItems="center" width="100%" maxWidth={300}>
          <YStack alignItems="center" gap="$2">
            <Lock size={24} color="gray" />
            <H3 color="gray">Enter PIN</H3>
          </YStack>

          {/* PIN dots */}
          <XStack gap="$3">
            {[0, 1, 2, 3].map((i) => (
              <Circle
                key={i}
                size={16}
                backgroundColor={i < pin.length ? semanticColors.primary.border : '$gray6'}
                borderColor={i < pin.length ? semanticColors.primary.border : '$gray8'}
                borderWidth={2}
              />
            ))}
          </XStack>

          {/* Error message */}
          {error && (
            <Paragraph color={semanticColors.error.text} fontSize="$3" textAlign="center">
              {error}
            </Paragraph>
          )}

          {/* PIN pad */}
          <YStack gap="$3" width="100%">
            {[
              [1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
              ['', 0, '⌫'],
            ].map((row, rowIndex) => (
              <XStack key={rowIndex} gap="$3" justifyContent="center">
                {row.map((digit, colIndex) => (
                  <Button
                    key={colIndex}
                    size="$6"
                    circular
                    backgroundColor={digit === '' ? 'transparent' : 'gray'}
                    borderColor={digit === '' ? 'transparent' : 'gray'}
                    borderWidth={1}
                    onPress={() => {
                      if (digit === '⌫') {
                        handleDelete()
                      } else if (digit !== '') {
                        handlePinPress(String(digit))
                      }
                    }}
                    disabled={digit === ''}
                    pressStyle={{
                      backgroundColor: 'gray',
                      borderColor: 'gray',
                    }}
                  >
                    <Paragraph fontSize="$7" fontWeight="600" color="gray">
                      {digit}
                    </Paragraph>
                  </Button>
                ))}
              </XStack>
            ))}
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}

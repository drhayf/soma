/**
 * Auth Screen - Beautiful Production-Ready Authentication
 * Features: User list, Supabase connection status, PIN auth, session persistence
 */

import { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Input,
  Button,
  Paragraph,
  H1,
  H2,
  H3,
  Spinner,
  Circle,
  ScrollView,
  Card,
} from '@my/ui'
import {
  Mail,
  Check,
  Lock,
  Shield,
  ChevronRight,
  RefreshCw,
  Loader,
  Database,
} from '@tamagui/lucide-icons'
import { useAuthStore } from '../../lib/auth-store'
import { supabase } from '../../lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { LocalProfileScreen } from './local-profile-screen'
import { SupabaseSyncStatus } from './supabase-sync-status'
import { semanticColors, iconColors, statusColors } from '../../lib/theme-colors'

type AuthMode =
  | 'user-select'
  | 'quick-unlock' // NEW: Quick biometric/PIN unlock
  | 'pin-entry'
  | 'magic-link'
  | 'setup-pin'
  | 'local-profile'
  | 'sync-status'

interface ConnectionStatus {
  connected: boolean
  checking: boolean
  userCount: number | null
}

export function AuthScreen() {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const hasLocalAuth = useAuthStore((state) => state.hasLocalAuth)
  const biometricEnabled = useAuthStore((state) => state.biometricEnabled)
  const enableBiometric = useAuthStore((state) => state.enableBiometric)
  const disableBiometric = useAuthStore((state) => state.disableBiometric)
  const signIn = useAuthStore((state) => state.signIn)
  const setLocalPin = useAuthStore((state) => state.setLocalPin)
  const unlockWithPin = useAuthStore((state) => state.unlockWithPin)
  const setUser = useAuthStore((state) => state.setUser)
  const setSession = useAuthStore((state) => state.setSession)

  const [mode, setMode] = useState<AuthMode>(hasLocalAuth ? 'quick-unlock' : 'user-select')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [useBiometric, setUseBiometric] = useState(biometricEnabled) // Toggle for biometric vs PIN
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    checking: true,
    userCount: null,
  })

  // Email/Password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // PIN state
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // Check Supabase connection and biometric availability
  useEffect(() => {
    checkConnection()
    checkBiometric()
  }, [])

  const checkBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      setBiometricAvailable(compatible && enrolled)

      if (!(compatible && enrolled) && biometricEnabled) {
        // Biometric was enabled but no longer available - disable it
        disableBiometric()
        setUseBiometric(false)
      }
    } catch (error) {
      console.error('[Auth] Biometric check failed:', error)
      setBiometricAvailable(false)
    }
  }

  const checkConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, checking: true }))

    try {
      // Check if we can query the database
      const { error: dbError } = await supabase.from('sovereign_logs').select('id').limit(1)

      if (!dbError) {
        setConnectionStatus({
          connected: true,
          checking: false,
          userCount: null,
        })
      } else {
        throw dbError
      }
    } catch (err: any) {
      console.error('[Auth] Connection check failed:', err)
      setConnectionStatus({
        connected: false,
        checking: false,
        userCount: null,
      })
      setError('Could not connect to Supabase. Check your configuration.')
    }
  }

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser)
    setError(null)

    // Check if this user has local PIN configured
    if (hasLocalAuth) {
      setMode('pin-entry')
    } else {
      setMode('setup-pin')
    }
  }

  const handlePinVerify = async (pinToVerify?: string) => {
    setLoading(true)
    setError(null)

    // Use provided PIN or fall back to state
    const pinValue = pinToVerify || pin

    console.log('[Auth] Verifying PIN, length:', pinValue.length)

    // Use the new unlockWithPin function that decrypts and signs in
    const result = await unlockWithPin(pinValue)

    if (result.success && result.session) {
      console.log('[Auth] PIN unlock successful')
      setPin('')
      setMode('user-select') // Show signed-in view
    } else {
      console.error('[Auth] PIN unlock failed:', result.error)
      setError(result.error || 'Unlock failed')
      setPin('')
    }

    setLoading(false)
  }

  const handlePinSetup = () => {
    if (newPin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    // Store PIN with encrypted password
    // The email and password are from the sign-in form
    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLocalPin(newPin, email, password)
    setError(null)

    // Sign in the user
    if (selectedUser) {
      setUser(selectedUser)
      if (session) {
        setSession(session)
      }
    }

    // Navigate back to main screen (user is now authenticated)
    setMode('user-select')
    setSelectedUser(null)
    setNewPin('')
    setConfirmPin('')
    console.log('[Auth] PIN setup complete - credentials encrypted and stored')
  }

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Somatic Alignment',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
      })

      if (result.success) {
        console.log('[Auth] Biometric authentication successful - enter PIN to continue')
        // After successful biometric auth, show PIN entry
        // Biometric is an additional security layer, not a replacement for PIN
        setMode('pin-entry')
      } else {
        console.log('[Auth] Biometric authentication failed or cancelled')
        setError('Authentication failed')
      }
    } catch (error) {
      console.error('[Auth] Biometric error:', error)
      setError('Biometric authentication error')
    }
  }

  const handleQuickUnlock = () => {
    if (useBiometric && biometricAvailable) {
      handleBiometricAuth()
    } else {
      setMode('pin-entry')
    }
  }

  const handleToggleBiometric = async () => {
    if (!useBiometric && biometricAvailable) {
      // Enabling biometric - require one-time biometric auth
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric unlock',
          fallbackLabel: 'Cancel',
          cancelLabel: 'Cancel',
        })

        if (result.success) {
          enableBiometric()
          setUseBiometric(true)
        }
      } catch (error) {
        console.error('[Auth] Biometric enable error:', error)
      }
    } else {
      // Disabling biometric
      disableBiometric()
      setUseBiometric(false)
    }
  }

  const handleAuth = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isRegistering) {
        // Sign up with email/password
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          setUser(data.user)
          if (data.session) {
            setSession(data.session)
          }
          // After signup, go to PIN setup
          setSelectedUser(data.user)
          setMode('setup-pin')
        }
      } else {
        // Sign in with email/password
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.user && data.session) {
          // User successfully signed in - set session immediately
          setUser(data.user)
          setSession(data.session)

          // If no PIN configured, offer to set one up
          if (!hasLocalAuth) {
            setSelectedUser(data.user)
            setMode('setup-pin')
          } else {
            // Already signed in, go straight to user-select (main screen)
            setMode('user-select')
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePinPress = (digit: string) => {
    if (pin.length >= 4) return

    const newPinValue = pin + digit
    setPin(newPinValue)
    setError(null)

    // Auto-verify when 4 digits entered - pass the PIN directly to avoid state delay
    if (newPinValue.length === 4) {
      setTimeout(() => {
        handlePinVerify(newPinValue)
      }, 100)
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(null)
  }

  // Render connection status indicator
  const ConnectionIndicator = () => (
    <XStack
      gap="$2"
      alignItems="center"
      paddingHorizontal="$4"
      paddingVertical="$2"
      backgroundColor={
        connectionStatus.connected
          ? semanticColors.success.background
          : semanticColors.error.background
      }
      borderRadius="$10"
      borderWidth={1}
      borderColor={
        connectionStatus.connected ? semanticColors.success.border : semanticColors.error.border
      }
    >
      {connectionStatus.checking ? (
        <Spinner size="small" color="$gray10" />
      ) : (
        <Circle
          size={8}
          backgroundColor={connectionStatus.connected ? statusColors.online : statusColors.offline}
          animation="quick"
        />
      )}
      <Paragraph fontSize="$2" fontWeight="600" color="$gray12">
        {connectionStatus.checking
          ? 'Connecting...'
          : connectionStatus.connected
            ? 'Supabase Connected'
            : 'Connection Failed'}
      </Paragraph>
      {connectionStatus.userCount !== null && (
        <Paragraph fontSize="$2" color="gray">
          • {connectionStatus.userCount} account{connectionStatus.userCount !== 1 ? 's' : ''}
        </Paragraph>
      )}
    </XStack>
  )

  // Quick Unlock Screen - Show when user has local auth but isn't signed in
  if (mode === 'quick-unlock' && hasLocalAuth) {
    return (
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$6" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <H2>Quick Unlock</H2>
          <Paragraph color="gray" fontSize="$3">
            Use {useBiometric && biometricAvailable ? 'Face ID / Touch ID' : 'PIN'} to sign in
          </Paragraph>
        </YStack>

        {/* Content */}
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" gap="$6">
          {/* Biometric/PIN Icon */}
          <Circle
            size={120}
            backgroundColor={semanticColors.primary.background}
            borderColor={semanticColors.primary.border}
            borderWidth={3}
          >
            {useBiometric && biometricAvailable ? (
              <Shield size={60} color={iconColors.primary} />
            ) : (
              <Lock size={60} color={iconColors.primary} />
            )}
          </Circle>

          <YStack alignItems="center" gap="$2">
            <H3>{useBiometric && biometricAvailable ? 'Biometric Authentication' : 'Enter PIN'}</H3>
            <Paragraph fontSize="$3" color="gray" textAlign="center">
              {useBiometric && biometricAvailable
                ? 'Tap the button below to authenticate'
                : 'Use your 4-digit PIN to unlock'}
            </Paragraph>
          </YStack>

          {/* Unlock Button */}
          <Button
            size="$6"
            theme="blue"
            onPress={handleQuickUnlock}
            icon={useBiometric && biometricAvailable ? <Shield /> : <Lock />}
            width={250}
          >
            {useBiometric && biometricAvailable ? 'Unlock with Biometric' : 'Enter PIN'}
          </Button>

          {/* Toggle Between Biometric and PIN */}
          {biometricAvailable && (
            <Card padding="$4" backgroundColor="$gray4" borderWidth={1} borderColor="$gray7">
              <XStack gap="$3" alignItems="center">
                <YStack flex={1}>
                  <Paragraph fontSize="$3" fontWeight="600" color="$gray12">
                    Use Biometric Unlock
                  </Paragraph>
                  <Paragraph fontSize="$2" color="$gray11">
                    {useBiometric ? 'Face ID / Touch ID enabled' : 'Use PIN instead'}
                  </Paragraph>
                </YStack>
                <Button
                  size="$3"
                  variant="outlined"
                  theme={useBiometric ? 'green' : 'blue'}
                  onPress={handleToggleBiometric}
                >
                  {useBiometric ? 'ON' : 'OFF'}
                </Button>
              </XStack>
            </Card>
          )}

          {error && (
            <Card
              padding="$3"
              backgroundColor={semanticColors.error.background}
              borderWidth={1}
              borderColor={semanticColors.error.border}
            >
              <Paragraph color={semanticColors.error.text} fontSize="$3">
                {error}
              </Paragraph>
            </Card>
          )}

          {/* Switch to Email/Password */}
          <Button
            size="$4"
            variant="outlined"
            onPress={() => {
              setMode('user-select')
              setError(null)
            }}
          >
            Sign in with Email/Password Instead
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Signed In View - Show when user is authenticated
  if (user && session && mode === 'user-select') {
    return (
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$6" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack gap="$2" flex={1}>
              <H1>You're Signed In</H1>
              <Paragraph color="gray" fontSize="$4">
                {user.email}
              </Paragraph>
            </YStack>
            <ConnectionIndicator />
          </XStack>
        </YStack>

        {/* Content */}
        <ScrollView flex={1}>
          <YStack padding="$6" gap="$4">
            {/* User Info Card */}
            <Card elevate padding="$4" gap="$4">
              <XStack gap="$4" alignItems="center">
                <Circle
                  size={60}
                  backgroundColor={semanticColors.primary.background}
                  borderColor={semanticColors.primary.border}
                  borderWidth={2}
                >
                  <Paragraph fontSize="$7" fontWeight="700" color={semanticColors.primary.text}>
                    {user.email?.[0]?.toUpperCase()}
                  </Paragraph>
                </Circle>
                <YStack gap="$2" flex={1}>
                  <Paragraph fontSize="$5" fontWeight="600" color="$gray12">
                    {user.email}
                  </Paragraph>
                  <Paragraph fontSize="$3" color="$gray11">
                    Authenticated with Supabase
                  </Paragraph>
                  {hasLocalAuth && (
                    <XStack gap="$2" alignItems="center">
                      <Lock size={14} color={iconColors.success} />
                      <Paragraph fontSize="$2" color={semanticColors.success.text} fontWeight="600">
                        Local PIN Configured
                      </Paragraph>
                    </XStack>
                  )}
                </YStack>
              </XStack>
            </Card>

            {/* Quick Actions */}
            <YStack gap="$3">
              <Paragraph fontSize="$4" fontWeight="600" color="gray">
                Account Settings
              </Paragraph>

              <Button
                size="$4"
                variant="outlined"
                icon={<Database />}
                onPress={() => setMode('sync-status')}
              >
                View Sync Status
              </Button>

              <Button
                size="$4"
                variant="outlined"
                icon={<Shield />}
                onPress={() => setMode('local-profile')}
              >
                Local Profile
              </Button>

              <Button
                size="$4"
                theme="red"
                onPress={async () => {
                  await useAuthStore.getState().signOut()
                  setMode('user-select')
                }}
              >
                Sign Out
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    )
  }

  // Local Profile Screen
  if (mode === 'local-profile') {
    return (
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$6" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$2" flex={1}>
              <H2>Local Profile</H2>
              <Paragraph color="gray" fontSize="$3">
                View your Zustand local state
              </Paragraph>
            </YStack>
            <Button size="$3" variant="outlined" onPress={() => setMode('user-select')}>
              Back
            </Button>
          </XStack>
        </YStack>

        <ScrollView flex={1}>
          <YStack gap="$4">
            <LocalProfileScreen />

            {/* Advanced Settings - Clear PIN */}
            {hasLocalAuth && (
              <YStack padding="$4" gap="$3">
                <Paragraph fontSize="$3" fontWeight="600" color="gray">
                  Advanced Settings
                </Paragraph>
                <Button
                  size="$3"
                  theme="red"
                  variant="outlined"
                  onPress={() => {
                    useAuthStore.getState().clearLocalAuth()
                    setError(null)
                    setPin('')
                    setNewPin('')
                    setConfirmPin('')
                    console.log('[Auth] Local PIN cleared - starting fresh')
                  }}
                >
                  Clear PIN Data
                </Button>
                <Paragraph fontSize="$2" color="gray">
                  Remove stored PIN and encrypted password. You'll need to set up PIN again after
                  signing in.
                </Paragraph>
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    )
  }

  // Supabase Sync Status Screen
  if (mode === 'sync-status') {
    return (
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$6" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$2" flex={1}>
              <H2>Supabase Sync Status</H2>
              <Paragraph color="gray" fontSize="$3">
                View what's synced to the cloud
              </Paragraph>
            </YStack>
            <Button size="$3" variant="outlined" onPress={() => setMode('user-select')}>
              Back
            </Button>
          </XStack>
        </YStack>

        <ScrollView flex={1}>
          <YStack padding="$4">
            <SupabaseSyncStatus />
          </YStack>
        </ScrollView>
      </YStack>
    )
  }

  // PIN Entry Screen
  if (mode === 'pin-entry') {
    // Get user from selectedUser or last session
    const pinUser = selectedUser || user

    if (!pinUser && !hasLocalAuth) {
      // No user to authenticate - go back
      setMode('user-select')
      return null
    }

    return (
      <YStack flex={1} backgroundColor="$background">
        {/* Header with connection status */}
        <YStack padding="$4" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack justifyContent="space-between" alignItems="center">
            <H2>Enter PIN</H2>
            <ConnectionIndicator />
          </XStack>
        </YStack>

        {/* Content */}
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" gap="$6">
          {/* User avatar */}
          {pinUser && (
            <YStack alignItems="center" gap="$3">
              <Circle
                size={80}
                backgroundColor={semanticColors.primary.background}
                borderColor={semanticColors.primary.border}
                borderWidth={2}
              >
                <Paragraph fontSize="$8" fontWeight="700" color={semanticColors.primary.text}>
                  {pinUser.email?.[0]?.toUpperCase()}
                </Paragraph>
              </Circle>
              <YStack alignItems="center" gap="$1">
                <Paragraph fontSize="$5" fontWeight="600" color="$gray12">
                  {pinUser.email}
                </Paragraph>
                <Paragraph fontSize="$3" color="gray">
                  Enter your PIN to continue
                </Paragraph>
              </YStack>
            </YStack>
          )}

          {/* PIN dots */}
          <XStack gap="$3">
            {[0, 1, 2, 3].map((i) => (
              <Circle
                key={i}
                size={16}
                backgroundColor={i < pin.length ? semanticColors.primary.border : '$gray6'}
                borderColor={i < pin.length ? semanticColors.primary.border : '$gray8'}
                borderWidth={2}
                animation="quick"
              />
            ))}
          </XStack>

          {/* Error message */}
          {error && (
            <XStack
              gap="$2"
              paddingHorizontal="$4"
              paddingVertical="$3"
              backgroundColor={semanticColors.error.background}
              borderRadius="$4"
              borderWidth={1}
              borderColor={semanticColors.error.border}
              maxWidth={300}
            >
              <Paragraph color={semanticColors.error.text} fontSize="$3" textAlign="center">
                {error}
              </Paragraph>
            </XStack>
          )}

          {/* PIN pad */}
          <YStack gap="$3" width="100%" maxWidth={280}>
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
                    width={80}
                    height={80}
                    borderRadius="$10"
                    backgroundColor={digit === '' ? 'transparent' : 'gray'}
                    borderColor={digit === '' ? 'transparent' : 'gray'}
                    borderWidth={digit === '' ? 0 : 1}
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
                      scale: 0.95,
                    }}
                    animation="quick"
                  >
                    <Paragraph fontSize="$8" fontWeight="600" color="gray">
                      {digit}
                    </Paragraph>
                  </Button>
                ))}
              </XStack>
            ))}
          </YStack>

          {/* Back button */}
          <Button
            size="$4"
            variant="outlined"
            onPress={() => {
              if (hasLocalAuth) {
                setMode('quick-unlock')
              } else {
                setMode('user-select')
              }
              setSelectedUser(null)
              setPin('')
              setError(null)
            }}
            marginTop="$4"
          >
            {hasLocalAuth ? 'Back to Quick Unlock' : 'Back'}
          </Button>
        </YStack>
      </YStack>
    )
  }

  // PIN Setup Screen
  if (mode === 'setup-pin' && selectedUser) {
    return (
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack justifyContent="space-between" alignItems="center">
            <H2>{hasLocalAuth ? 'Re-configure PIN' : 'Set Up PIN'}</H2>
            <ConnectionIndicator />
          </XStack>
        </YStack>

        <ScrollView>
          <YStack padding="$6" gap="$6" alignItems="center">
            <YStack alignItems="center" gap="$3">
              <Circle
                size={64}
                backgroundColor={semanticColors.primary.background}
                borderColor={semanticColors.primary.border}
                borderWidth={2}
              >
                <Lock size={32} color={iconColors.primary} />
              </Circle>
              <H3>{hasLocalAuth ? 'Update PIN & Password' : 'Create Your PIN'}</H3>
              <Paragraph color="$gray11" textAlign="center" maxWidth={400}>
                {hasLocalAuth
                  ? 'Enter your Supabase password and create a new PIN to securely link them together'
                  : 'Set up a 4-digit PIN for quick access. Your password will be encrypted with the PIN.'}
              </Paragraph>
            </YStack>

            <YStack gap="$4" width="100%" maxWidth={400}>
              {hasLocalAuth && (
                <>
                  <YStack gap="$2">
                    <Paragraph fontSize="$3" fontWeight="600" color="gray">
                      Current Email
                    </Paragraph>
                    <Input
                      value={user?.email || email}
                      editable={false}
                      size="$5"
                      backgroundColor="gray"
                    />
                  </YStack>

                  <YStack gap="$2">
                    <Paragraph fontSize="$3" fontWeight="600" color="gray">
                      Enter Your Supabase Password
                    </Paragraph>
                    <Input
                      placeholder="Your account password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      size="$5"
                      autoCapitalize="none"
                    />
                    <Paragraph fontSize="$2" color="gray">
                      This will be encrypted with your new PIN
                    </Paragraph>
                  </YStack>
                </>
              )}

              <YStack gap="$2">
                <Paragraph fontSize="$3" fontWeight="600" color="gray">
                  Enter 4-digit PIN
                </Paragraph>
                <Input
                  placeholder="••••"
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  size="$5"
                />
              </YStack>

              <YStack gap="$2">
                <Paragraph fontSize="$3" fontWeight="600" color="gray">
                  Confirm PIN
                </Paragraph>
                <Input
                  placeholder="••••"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  size="$5"
                />
              </YStack>

              {error && (
                <XStack
                  gap="$2"
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  backgroundColor={semanticColors.error.background}
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor={semanticColors.error.border}
                >
                  <Paragraph color={semanticColors.error.text} fontSize="$3">
                    {error}
                  </Paragraph>
                </XStack>
              )}

              <Button
                size="$5"
                theme="blue"
                onPress={handlePinSetup}
                disabled={newPin.length !== 4 || confirmPin.length !== 4}
                icon={<Lock />}
              >
                Complete Setup
              </Button>

              <Button
                size="$4"
                variant="outlined"
                onPress={() => {
                  setMode('user-select')
                  setSelectedUser(null)
                  setNewPin('')
                  setConfirmPin('')
                  setError(null)
                }}
              >
                Back
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    )
  }

  // User Selection Screen (Default)
  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <YStack padding="$6" gap="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap="$2" flex={1}>
            <H1>{isRegistering ? 'Create Account' : 'Welcome Back'}</H1>
            <Paragraph color="gray" fontSize="$4">
              {isRegistering
                ? 'Register to sync your progress across devices'
                : 'Sign in to access your account'}
            </Paragraph>
          </YStack>
        </XStack>

        <ConnectionIndicator />
      </YStack>

      <ScrollView flex={1}>
        <YStack padding="$4" gap="$3">
          {/* Loading state */}
          {connectionStatus.checking && (
            <YStack padding="$8" alignItems="center" gap="$4">
              <Spinner size="large" />
              <Paragraph color="gray">Checking connection...</Paragraph>
            </YStack>
          )}

          {/* Error state */}
          {!connectionStatus.checking && !connectionStatus.connected && (
            <Card
              padding="$6"
              backgroundColor={semanticColors.error.background}
              borderWidth={1}
              borderColor={semanticColors.error.border}
              gap="$3"
            >
              <Paragraph color={semanticColors.error.textContrast} fontSize="$4" fontWeight="600">
                Connection Failed
              </Paragraph>
              <Paragraph color={semanticColors.error.text} fontSize="$3">
                {error || 'Could not connect to Supabase. Check your configuration.'}
              </Paragraph>
              <Button size="$4" theme="red" onPress={checkConnection} icon={<RefreshCw />}>
                Retry Connection
              </Button>
            </Card>
          )}

          {/* Email/Password Sign In/Register */}
          {connectionStatus.connected && (
            <Card padding="$5" gap="$4">
              <YStack gap="$2">
                <H3>{isRegistering ? 'Create Your Account' : 'Sign In'}</H3>
                <Paragraph fontSize="$3" color="gray">
                  {isRegistering
                    ? 'Get started with email and password'
                    : 'Enter your credentials to continue'}
                </Paragraph>
              </YStack>

              <Input
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                size="$4"
              />

              <Input
                placeholder="Password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                size="$4"
              />

              {isRegistering && (
                <Input
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  size="$4"
                />
              )}

              {error && (
                <Card
                  padding="$3"
                  backgroundColor={semanticColors.error.background}
                  borderWidth={1}
                  borderColor={semanticColors.error.border}
                >
                  <Paragraph color={semanticColors.error.text} fontSize="$3">
                    {error}
                  </Paragraph>
                </Card>
              )}

              <Button
                size="$4"
                theme="blue"
                onPress={handleAuth}
                disabled={loading || !email || !password}
                icon={loading ? <Spinner /> : <Lock />}
              >
                {loading ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
              </Button>

              <Button
                size="$3"
                variant="outlined"
                onPress={() => {
                  setIsRegistering(!isRegistering)
                  setError(null)
                  setPassword('')
                  setConfirmPassword('')
                }}
              >
                {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
              </Button>
            </Card>
          )}

          {/* Local Profile Access */}
          <YStack height={1} backgroundColor="$borderColor" marginVertical="$4" />

          <Card
            padding="$4"
            gap="$3"
            borderWidth={1}
            pressStyle={{ scale: 0.98, opacity: 0.8 }}
            animation="quick"
            onPress={() => setMode('local-profile')}
            cursor="pointer"
            hoverStyle={{ backgroundColor: 'purple' }}
          >
            <XStack gap="$3" alignItems="center">
              <Circle
                size={48}
                backgroundColor={semanticColors.info.background}
                borderColor={semanticColors.info.border}
                borderWidth={2}
              >
                <Database size={24} color={iconColors.info} />
              </Circle>
              <YStack flex={1} gap="$1">
                <Paragraph fontSize="$4" fontWeight="600" color={semanticColors.info.text}>
                  View Local Profile
                </Paragraph>
                <Paragraph fontSize="$2" color={semanticColors.info.text}>
                  See your Zustand local state (works offline)
                </Paragraph>
              </YStack>
              <ChevronRight size={24} color={iconColors.info} />
            </XStack>
          </Card>

          {/* Supabase Sync Status */}
          {connectionStatus.connected && (
            <Card
              padding="$4"
              gap="$3"
              borderWidth={1}
              pressStyle={{ scale: 0.98, opacity: 0.8 }}
              animation="quick"
              onPress={() => setMode('sync-status')}
              cursor="pointer"
              hoverStyle={{ backgroundColor: 'blue' }}
            >
              <XStack gap="$3" alignItems="center">
                <Circle
                  size={48}
                  backgroundColor={semanticColors.success.background}
                  borderColor={semanticColors.success.border}
                  borderWidth={2}
                >
                  <Shield size={24} color={iconColors.success} />
                </Circle>
                <YStack flex={1} gap="$1">
                  <Paragraph fontSize="$4" fontWeight="600" color={semanticColors.success.text}>
                    Supabase Sync Status
                  </Paragraph>
                  <Paragraph fontSize="$2" color={semanticColors.success.text}>
                    View what's synced to the cloud (RAG-ready)
                  </Paragraph>
                </YStack>
                <ChevronRight size={24} color={iconColors.success} />
              </XStack>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

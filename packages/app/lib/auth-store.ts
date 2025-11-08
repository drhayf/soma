/**
 * Auth Store - User Authentication State
 * Cross-platform auth state management with Supabase
 * Supports: Magic Link, PIN, Biometric (Face ID/Touch ID)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, signInWithEmail, signOut, getCurrentUser } from './supabase-client'
import type { User, Session } from '@supabase/supabase-js'
import { getStorage } from './store'
import { encryptPassword, decryptPassword, hashPin, verifyPinHash } from './pin-encryption'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean

  // Local auth (PIN/Biometric)
  hasLocalAuth: boolean
  pinHash: string | null // Hashed PIN for verification (never store plain PIN!)
  biometricEnabled: boolean
  encryptedPassword: string | null // Encrypted password vault
  userEmail: string | null // Email for auto-login

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  signIn: (email: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>

  // Local auth actions
  setLocalPin: (pin: string, email: string, password: string) => void
  verifyLocalPin: (pin: string) => boolean
  unlockWithPin: (pin: string) => Promise<{ success: boolean; session?: Session; error?: string }>
  enableBiometric: () => void
  disableBiometric: () => void
  clearLocalAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      hasLocalAuth: false,
      pinHash: null,
      biometricEnabled: false,
      encryptedPassword: null,
      userEmail: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),

      signIn: async (email: string) => {
        const { data, error } = await signInWithEmail(email)

        if (error) {
          console.error('[Auth] Sign in error:', error)
          return { error }
        }

        console.log('[Auth] Magic link sent to:', email)
        return { error: null }
      },

      signOut: async () => {
        set({ loading: true })

        const { error } = await signOut()

        if (error) {
          console.error('[Auth] Sign out error:', error)
        }

        // Keep local auth settings but clear session
        set({ user: null, session: null, loading: false })
      },

      // Local PIN auth with encrypted password vault
      setLocalPin: (pin: string, email: string, password: string) => {
        // Normalize PIN (trim and ensure string)
        const normalizedPin = String(pin).trim()
        const normalizedEmail = email.trim()

        // Hash the PIN for verification (never store the plain PIN!)
        const hashedPin = hashPin(normalizedPin)

        // Encrypt the password using the PIN as the key
        const encrypted = encryptPassword(password, normalizedPin)

        set({
          pinHash: hashedPin,
          encryptedPassword: encrypted,
          userEmail: normalizedEmail,
          hasLocalAuth: true,
        })
        console.log('[Auth] Local PIN configured with encrypted password vault', {
          pinLength: normalizedPin.length,
          email: normalizedEmail,
          hashLength: hashedPin.length,
        })
      },

      verifyLocalPin: (pin: string) => {
        const state = get()
        if (!state.pinHash) return false
        return verifyPinHash(pin, state.pinHash)
      },

      unlockWithPin: async (pin: string) => {
        const state = get()

        // Normalize PIN (trim and ensure string)
        const normalizedInputPin = String(pin).trim()

        console.log('[Auth] PIN unlock attempt')

        // Verify PIN hash first (without exposing stored PIN)
        if (!state.pinHash || !verifyPinHash(normalizedInputPin, state.pinHash)) {
          return { success: false, error: 'Incorrect PIN' }
        }

        // Decrypt password and sign in to Supabase
        if (!state.encryptedPassword || !state.userEmail) {
          return { success: false, error: 'No stored credentials' }
        }

        const password = decryptPassword(state.encryptedPassword, normalizedInputPin)
        if (!password) {
          return { success: false, error: 'Failed to decrypt password' }
        }

        // Sign in to Supabase with decrypted credentials
        console.log('[Auth] Unlocking with PIN - signing in to Supabase...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email: state.userEmail,
          password: password,
        })

        if (error) {
          console.error('[Auth] Unlock sign-in failed:', error)
          return { success: false, error: error.message }
        }

        if (data.session) {
          set({
            user: data.session.user,
            session: data.session,
          })
          console.log('[Auth] Successfully unlocked and signed in')
          return { success: true, session: data.session }
        }

        return { success: false, error: 'No session returned' }
      },

      enableBiometric: () => {
        set({ biometricEnabled: true })
        console.log('[Auth] Biometric enabled')
      },

      disableBiometric: () => {
        set({ biometricEnabled: false })
        console.log('[Auth] Biometric disabled')
      },

      clearLocalAuth: () => {
        set({
          hasLocalAuth: false,
          pinHash: null,
          biometricEnabled: false,
          encryptedPassword: null,
          userEmail: null,
        })
        console.log('[Auth] Local auth cleared')
      },

      initialize: async () => {
        if (get().initialized) return

        set({ loading: true })

        // Migration: Check for old plain-text PIN storage and clear it
        const state = get()
        const storedData: any = state
        if (storedData.localAuthPin && !storedData.pinHash) {
          console.log('[Auth] Detected old plain-text PIN storage - migrating to hashed PIN')
          console.log('[Auth] Clearing old auth data for security. Please set up PIN again.')
          set({
            hasLocalAuth: false,
            pinHash: null,
            encryptedPassword: null,
            userEmail: null,
            biometricEnabled: false,
          })
        }

        // Get initial session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const user = session?.user ?? null

        set({
          session,
          user,
          loading: false,
          initialized: true,
        })

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
          console.log('[Auth] State change:', _event)
          set({
            session,
            user: session?.user ?? null,
            loading: false,
          })
        })
      },
    }),
    {
      name: 'somatic-alignment-auth',
      storage: getStorage(),
      partialize: (state) => ({
        // Persist everything except loading states
        user: state.user,
        session: state.session,
        hasLocalAuth: state.hasLocalAuth,
        pinHash: state.pinHash, // Store hash, not plain PIN
        biometricEnabled: state.biometricEnabled,
        encryptedPassword: state.encryptedPassword,
        userEmail: state.userEmail,
      }),
    }
  )
)

/**
 * Supabase Client for App (Cross-Platform)
 * Client-side auth with anon key
 *
 * OFFLINE MODE: If env vars are missing, creates a mock client for offline-only operation
 */

import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured - running in OFFLINE MODE')
  console.warn(
    '   Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable online features'
  )
}

/**
 * Client-side Supabase client (uses anon key, respects RLS)
 * Safe to use in app code - user can only access their own data
 *
 * Falls back to mock client if not configured (offline mode)
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Platform-specific storage
        ...(Platform.OS === 'web'
          ? {
              storage: window?.localStorage,
            }
          : {
              storage: undefined, // Will use AsyncStorage via react-native-async-storage
            }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : // Mock client for offline mode
    createClient('https://offline.supabase.co', 'offline-anon-key')

/**
 * Auth helper functions
 */

export async function signInWithEmail(email: string) {
  if (!isSupabaseConfigured) {
    console.warn('[Auth] Cannot sign in - Supabase not configured')
    return { data: null, error: new Error('Supabase not configured. Running in offline mode.') }
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        Platform.OS === 'web' ? window.location.origin : 'somaticalignment://auth/callback',
    },
  })

  return { data, error }
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    return { error: null } // No-op in offline mode
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  if (!isSupabaseConfigured) {
    return null
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Test Supabase connection
 */
export async function testConnection() {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error:
        'Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env',
      offline: true,
    }
  }

  try {
    const { error } = await supabase.from('sovereign_logs').select('id').limit(1)

    if (error) {
      return { success: false, error: error.message, offline: false }
    }

    return { success: true, error: null, offline: false }
  } catch (err: any) {
    return { success: false, error: err.message, offline: false }
  }
}

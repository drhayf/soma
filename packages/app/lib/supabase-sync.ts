/**
 * Real-time Supabase Sync - Auto-upload data for RAG system
 * All local data is immediately synced to Supabase when online
 */

import { supabase, isSupabaseConfigured } from './supabase-client'
import type {
  ChatHistoryEntry,
  JournalEntry,
  SovereignLogEntry,
  AttunementFeedback,
} from '../types'

// Get user from auth store (imported dynamically to avoid circular deps)
function getCurrentUserId(): string | null {
  // Import inside function to avoid circular dependency
  const { useAuthStore } = require('./auth-store')
  const user = useAuthStore.getState().user
  return user?.id || null
}

// Sync mode: 'auto' = immediate sync, 'manual' = queue for later
let syncMode: 'auto' | 'manual' = 'auto'
let manualQueue: Array<{
  type: 'chat' | 'journal' | 'sovereign' | 'feedback'
  data: any
  timestamp: string
}> = []

/**
 * Get current sync mode
 */
export function getSyncMode(): 'auto' | 'manual' {
  return syncMode
}

/**
 * Toggle between auto and manual sync
 */
export function setSyncMode(mode: 'auto' | 'manual') {
  syncMode = mode
  console.log(`[Supabase Sync] Mode set to: ${mode}`)
}

/**
 * Get queued items (for manual mode)
 */
export function getQueuedItems() {
  return [...manualQueue]
}

/**
 * Clear the manual queue
 */
export function clearQueue() {
  manualQueue = []
}

/**
 * Sync chat message to Supabase sovereign_logs table
 */
export async function syncChatMessage(message: ChatHistoryEntry, sessionId: string) {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Sync] Skipping chat sync - not configured')
    return { success: false, error: 'Not configured' }
  }

  const userId = getCurrentUserId()
  if (!userId) {
    console.warn('[Supabase Sync] Skipping chat sync - user not authenticated')
    return { success: false, error: 'User not authenticated' }
  }

  const logEntry = {
    user_id: userId,
    content: `USER: ${message.userMessage}\n\nAI: ${message.aiResponse}`,
    category: 'chat',
    metadata: {
      sessionId,
      messageId: message.id,
      routineContext: message.routineContext,
    },
    created_at: message.timestamp,
  }

  if (syncMode === 'manual') {
    // Add to queue instead of syncing
    manualQueue.push({
      type: 'chat',
      data: logEntry,
      timestamp: new Date().toISOString(),
    })
    console.log(`[Supabase Sync] Chat message queued (manual mode)`)
    return { success: true, queued: true }
  }

  try {
    const { data, error } = await supabase.from('sovereign_logs').insert([logEntry]).select()

    if (error) {
      console.error('[Supabase Sync] Chat sync failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Supabase Sync] Chat message synced:', data?.[0]?.id)
    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('[Supabase Sync] Chat sync error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Sync journal entry to Supabase sovereign_logs table
 */
export async function syncJournalEntry(entry: JournalEntry) {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Sync] Skipping journal sync - not configured')
    return { success: false, error: 'Not configured' }
  }

  const userId = getCurrentUserId()
  if (!userId) {
    console.warn('[Supabase Sync] Skipping journal sync - user not authenticated')
    return { success: false, error: 'User not authenticated' }
  }

  const logEntry = {
    user_id: userId,
    content: `${entry.routineName} - ${entry.mood}\n\nPhysical Sensations: ${entry.physicalSensations.join(', ')}\n\nNotes: ${entry.notes || 'None'}`,
    category: 'journal',
    metadata: {
      journalId: entry.id,
      routineType: entry.routineType,
      mood: entry.mood,
      physicalSensations: entry.physicalSensations,
      emotionalState: entry.emotionalState,
      difficulty: entry.difficulty,
    },
    created_at: entry.timestamp,
  }

  if (syncMode === 'manual') {
    manualQueue.push({
      type: 'journal',
      data: logEntry,
      timestamp: new Date().toISOString(),
    })
    console.log(`[Supabase Sync] Journal entry queued (manual mode)`)
    return { success: true, queued: true }
  }

  try {
    const { data, error } = await supabase.from('sovereign_logs').insert([logEntry]).select()

    if (error) {
      console.error('[Supabase Sync] Journal sync failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Supabase Sync] Journal entry synced:', data?.[0]?.id)
    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('[Supabase Sync] Journal sync error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Sync sovereign log entry to Supabase
 */
export async function syncSovereignLog(entry: SovereignLogEntry) {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Sync] Skipping sovereign log sync - not configured')
    return { success: false, error: 'Not configured' }
  }

  const userId = getCurrentUserId()
  if (!userId) {
    console.warn('[Supabase Sync] Skipping sovereign log sync - user not authenticated')
    return { success: false, error: 'User not authenticated' }
  }

  // Build content from available fields
  let content = `${entry.entryType.toUpperCase()}\n\n`
  if (entry.notes) content += `Notes: ${entry.notes}\n`
  if (entry.urgeState) content += `Urge State: ${entry.urgeState}\n`
  if (entry.actionTaken) content += `Action Taken: ${entry.actionTaken}\n`
  if (entry.dreamDescription) content += `Dream: ${entry.dreamDescription}\n`
  if (entry.personsInvolved) content += `Persons Involved: ${entry.personsInvolved}\n`

  const logEntry = {
    user_id: userId,
    content: content.trim() || entry.entryType,
    category: entry.entryType || 'sovereign',
    metadata: {
      sovereignId: entry.id,
      urgeState: entry.urgeState,
      actionTaken: entry.actionTaken,
      physicalSensations: entry.physicalSensations,
      emotionalState: entry.emotionalState,
      customFields: entry.customFields,
      aiAnalysis: entry.aiAnalysis,
      analyzedAt: entry.analyzedAt,
    },
    created_at: entry.timestamp,
  }

  if (syncMode === 'manual') {
    manualQueue.push({
      type: 'sovereign',
      data: logEntry,
      timestamp: new Date().toISOString(),
    })
    console.log(`[Supabase Sync] Sovereign log queued (manual mode)`)
    return { success: true, queued: true }
  }

  try {
    const { data, error } = await supabase.from('sovereign_logs').insert([logEntry]).select()

    if (error) {
      console.error('[Supabase Sync] Sovereign log sync failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Supabase Sync] Sovereign log synced:', data?.[0]?.id)
    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('[Supabase Sync] Sovereign log sync error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Sync attunement feedback to Supabase
 */
export async function syncAttunementFeedback(feedback: AttunementFeedback) {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase Sync] Skipping feedback sync - not configured')
    return { success: false, error: 'Not configured' }
  }

  const userId = getCurrentUserId()
  if (!userId) {
    console.warn('[Supabase Sync] Skipping feedback sync - user not authenticated')
    return { success: false, error: 'User not authenticated' }
  }

  const logEntry = {
    user_id: userId,
    content: `ATTUNEMENT FEEDBACK\n\nQuestion: ${feedback.originalQuestion}\nOriginal Answer: ${feedback.originalAnswer}\nRating: ${feedback.userRating}/5${feedback.userCustomAnswer ? `\nCustom Answer: ${feedback.userCustomAnswer}` : ''}`,
    category: 'feedback',
    metadata: {
      feedbackId: feedback.id,
      attunementId: feedback.attunementId,
      userRating: feedback.userRating,
      originalQuestion: feedback.originalQuestion,
      originalAnswer: feedback.originalAnswer,
      userCustomAnswer: feedback.userCustomAnswer,
      vectorized: feedback.vectorized,
    },
    created_at: feedback.timestamp,
  }

  if (syncMode === 'manual') {
    manualQueue.push({
      type: 'feedback',
      data: logEntry,
      timestamp: new Date().toISOString(),
    })
    console.log(`[Supabase Sync] Feedback queued (manual mode)`)
    return { success: true, queued: true }
  }

  try {
    const { data, error } = await supabase.from('sovereign_logs').insert([logEntry]).select()

    if (error) {
      console.error('[Supabase Sync] Feedback sync failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Supabase Sync] Feedback synced:', data?.[0]?.id)
    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('[Supabase Sync] Feedback sync error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Flush the manual queue - upload all queued items
 */
export async function flushQueue() {
  if (manualQueue.length === 0) {
    return { success: true, uploaded: 0, failed: 0 }
  }

  console.log(`[Supabase Sync] Flushing ${manualQueue.length} queued items...`)

  let uploaded = 0
  let failed = 0
  const failedItems: any[] = []

  for (const item of manualQueue) {
    try {
      const { error } = await supabase.from('sovereign_logs').insert([item.data])

      if (error) {
        console.error(`[Supabase Sync] Failed to upload ${item.type}:`, error)
        failed++
        failedItems.push(item)
      } else {
        uploaded++
      }
    } catch (err) {
      console.error(`[Supabase Sync] Error uploading ${item.type}:`, err)
      failed++
      failedItems.push(item)
    }
  }

  // Replace queue with only failed items
  manualQueue = failedItems

  console.log(`[Supabase Sync] Queue flushed: ${uploaded} uploaded, ${failed} failed`)
  return { success: true, uploaded, failed, remainingQueue: manualQueue.length }
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  const stats = {
    total: manualQueue.length,
    byType: {
      chat: 0,
      journal: 0,
      sovereign: 0,
      feedback: 0,
    },
  }

  for (const item of manualQueue) {
    stats.byType[item.type]++
  }

  return stats
}

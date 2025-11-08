/**
 * Offline Sync - simple local queue and sync engine
 * - enqueue(item): store locally
 * - getPendingCount(): number
 * - syncPending(supabase): attempts to upload queued items
 */

import { Platform } from 'react-native'
import { supabase } from './supabase-client'

const STORAGE_KEY = 'somatic-offline-queue'

type QueueItem = {
  id: string
  type: 'log' | 'embedding' | 'misc'
  payload: any
  createdAt: number
}

function getStorageAdapter() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      async getItem(key: string) {
        const v = window.localStorage.getItem(key)
        return v
      },
      async setItem(key: string, value: string) {
        window.localStorage.setItem(key, value)
      },
      async removeItem(key: string) {
        window.localStorage.removeItem(key)
      },
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default
    return {
      async getItem(key: string) {
        return await AsyncStorage.getItem(key)
      },
      async setItem(key: string, value: string) {
        await AsyncStorage.setItem(key, value)
      },
      async removeItem(key: string) {
        await AsyncStorage.removeItem(key)
      },
    }
  } catch (err) {
    // In-memory fallback
    const mem = new Map<string, string>()
    return {
      async getItem(key: string) {
        return mem.get(key) ?? null
      },
      async setItem(key: string, value: string) {
        mem.set(key, value)
      },
      async removeItem(key: string) {
        mem.delete(key)
      },
    }
  }
}

async function loadQueue(): Promise<QueueItem[]> {
  const storage = getStorageAdapter()
  const raw = await storage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch (err) {
    return []
  }
}

async function saveQueue(q: QueueItem[]) {
  const storage = getStorageAdapter()
  await storage.setItem(STORAGE_KEY, JSON.stringify(q))
}

export async function enqueue(item: Omit<QueueItem, 'id' | 'createdAt'>) {
  const q = await loadQueue()
  const entry: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    ...item,
  }
  q.push(entry)
  await saveQueue(q)
  return entry.id
}

export async function getPendingCount() {
  const q = await loadQueue()
  return q.length
}

export async function clearQueue() {
  const storage = getStorageAdapter()
  await storage.removeItem(STORAGE_KEY)
}

/**
 * Attempt to sync pending items to Supabase.
 * - If an item upload fails, it stays in queue
 * - Returns report with succeeded and failed ids
 */
export async function syncPending(options?: { onProgress?: (msg: string) => void }) {
  const q = await loadQueue()
  const succeeded: string[] = []
  const failed: { id: string; error: any }[] = []

  for (const item of q) {
    try {
      options?.onProgress?.(`Syncing ${item.type} ${item.id}...`)

      if (item.type === 'log') {
        // Expect payload to contain: { id, user_id, content, category, metadata }
        const { payload } = item
        const { data, error } = await supabase.from('sovereign_logs').insert(payload)
        if (error) throw error
        succeeded.push(item.id)
      } else if (item.type === 'embedding') {
        // Expect payload: { id, log_id, embedding, content, metadata }
        const { payload } = item
        const { data, error } = await supabase.from('sovereign_log_embeddings').insert(payload)
        if (error) throw error
        succeeded.push(item.id)
      } else {
        // misc - attempt a generic RPC if provided
        const { payload } = item
        if (payload?.rpc && typeof payload.rpc === 'string') {
          const { data, error } = await supabase.rpc(payload.rpc, payload.params || {})
          if (error) throw error
          succeeded.push(item.id)
        } else {
          // nothing we can do
          failed.push({ id: item.id, error: 'Unknown item type or missing rpc' })
        }
      }
    } catch (err) {
      failed.push({ id: item.id, error: err })
    }
  }

  // Remove succeeded items from queue
  const remaining = q.filter((i) => !succeeded.includes(i.id))
  await saveQueue(remaining)

  return { succeeded, failed }
}

export default {
  enqueue,
  loadQueue,
  getPendingCount,
  clearQueue,
  syncPending,
}

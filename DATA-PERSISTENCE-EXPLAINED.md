# 📊 Data Persistence System - Complete Explanation

## Current State: **Dual-Layer Architecture**

Your app currently has **TWO completely separate data systems** that can work independently OR together:

---

## 🏠 Layer 1: Local-Only Persistence (Existing)

### What It Is

A **Zustand + localStorage/AsyncStorage** system that's been working all along.

### What It Stores

```typescript
// ALL stored locally in the device:
- User Progress (streaks, total completions)
- Journal Entries (daily logs, moods, sensations)
- Chat History (AI conversations)
- Achievements (unlocked badges)
- Sovereign Logs (urge tracking, leak patterns)
- Sovereign Log Drafts
- Attunement Feedback
- OEJTS Results (personality assessment)
- Human Design Chart
- Health Metrics (from HealthKit)
- Blueprint Calculator State
- Theme Preferences
```

### How It Works

```typescript
// packages/app/lib/store.ts (1060 lines!)

// Progress tracking
export const useProgressStore = create(
  persist(
    (set, get) => ({
      complianceStreak: 0,
      lastCompletedDate: null,
      totalCompletions: 0,
      // ... methods
    }),
    {
      name: 'somatic-alignment-progress',
      storage: getStorage(), // localStorage or AsyncStorage
    }
  )
)

// Journal entries
export const useJournalStore = create(
  persist(
    (set, get) => ({
      journalEntries: [],
      // ... methods
    }),
    { name: 'somatic-alignment-journal', storage: getStorage() }
  )
)

// Sovereign logs
export const useSovereignLogStore = create(
  persist(
    (set, get) => ({
      sovereignEntries: [],
      drafts: [],
      // ... methods
    }),
    { name: 'somatic-alignment-sovereign', storage: getStorage() }
  )
)

// And 8+ more stores...
```

### Storage Locations

- **Web:** `localStorage` (browser-based, per-domain)
- **Native:** `AsyncStorage` (device-based, per-app)
- **Fallback:** In-memory Map (session-only)

### Advantages

✅ Works **offline** - no internet needed
✅ **Instant** - no network latency
✅ **Private** - never leaves device
✅ **Simple** - no backend setup
✅ **Already working** - powering the entire app

### Limitations

❌ **Device-locked** - can't access from other devices
❌ **No backup** - if you clear app data, it's gone
❌ **No sync** - can't share with others or sync across devices
❌ **Limited space** - localStorage has ~5-10MB limit

---

## ☁️ Layer 2: Supabase Cloud Persistence (New)

### What It Is

A **PostgreSQL database** in the cloud with vector search (pgvector) for RAG features.

### What It Stores (Currently)

```sql
-- Only these two tables exist in Supabase:
sovereign_logs (
  id UUID,
  user_id UUID,
  content TEXT,
  category TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)

sovereign_log_embeddings (
  id UUID,
  log_id UUID,
  embedding vector(384),  -- For AI semantic search
  content TEXT,
  created_at TIMESTAMPTZ
)
```

### How It Works

```typescript
// packages/app/lib/supabase-client.ts

// Client-side (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  }
})

// Usage:
const { data } = await supabase
  .from('sovereign_logs')
  .insert({ user_id: user.id, content: '...', category: 'Physical' })

// Semantic search:
const { data } = await supabase.rpc('match_sovereign_logs', {
  query_embedding: [0.1, 0.2, ...], // 384D vector
  match_threshold: 0.7,
  match_count: 5
})
```

### Advantages

✅ **Cloud backup** - never lose data
✅ **Multi-device** - access from anywhere
✅ **Semantic search** - AI-powered vector similarity
✅ **Shareable** - can share logs with others
✅ **Scalable** - unlimited storage
✅ **Secure** - Row-Level Security (RLS)

### Limitations

❌ **Requires internet** - can't work offline
❌ **Network latency** - slower than local
❌ **Complexity** - need to manage sync, conflicts
❌ **Cost** - Supabase has limits on free tier

---

## 🔄 Current Integration Status

### What's Connected

✅ **Auth System** - Supabase auth with local PIN/biometric
✅ **Sovereign Logs** - Can be synced (via RAG dashboard)
✅ **Embeddings** - Generated and stored in Supabase

### What's NOT Connected (Yet)

❌ Journal entries (local only)
❌ Chat history (local only)
❌ Achievements (local only)
❌ User progress/streaks (local only)
❌ OEJTS results (local only)
❌ Human Design chart (local only)
❌ Health metrics (local only)

---

## 🎯 Proposed Hybrid Architecture

### Option 1: **Local-First with Optional Cloud Sync** (Recommended)

```
┌─────────────────────────────────────┐
│         User's Device               │
├─────────────────────────────────────┤
│                                     │
│  Primary: Zustand + AsyncStorage    │
│  ✓ All data stored locally          │
│  ✓ Works offline                    │
│  ✓ Fast & instant                   │
│                                     │
│  Optional: Supabase Cloud Sync      │
│  ↓ Periodic upload                  │
│  ↑ Download on new device           │
│  ✓ Backup & restore                 │
│  ✓ Multi-device access              │
└─────────────────────────────────────┘
```

**How It Works:**

1. **Everything stays local** (current behavior)
2. **Optional "Sync to Cloud" button** in settings
3. **Auto-sync in background** (if user enables it)
4. **Conflict resolution:** Latest timestamp wins OR manual merge UI

**User Experience:**

```
Settings Screen:
┌─────────────────────────────────────┐
│ ☁️  Cloud Sync                      │
├─────────────────────────────────────┤
│ ○ Disabled (Local Only)             │
│ ● Enabled                           │
│                                     │
│ Last Synced: 2 minutes ago          │
│ [ Sync Now ]                        │
│                                     │
│ What gets synced:                   │
│ ✓ Journal entries                   │
│ ✓ Sovereign logs                    │
│ ✓ Chat history                      │
│ ✓ Achievements                      │
│ ✓ Progress/streaks                  │
│                                     │
│ [ View Sync Conflicts ]             │
└─────────────────────────────────────┘
```

### Option 2: **Cloud-First with Local Cache**

```
┌─────────────────────────────────────┐
│         Supabase Cloud              │
│       (Source of Truth)             │
└──────────────┬──────────────────────┘
               │
               ↓ Cached locally
┌─────────────────────────────────────┐
│         User's Device               │
│  AsyncStorage = Read cache          │
│  ✓ Fast reads                       │
│  ✓ Offline viewing                  │
│  ✗ Writes require internet          │
└─────────────────────────────────────┘
```

**Trade-offs:**

- Pro: Always synced, no conflicts
- Con: Can't add entries offline

### Option 3: **Separate Stores** (Current State)

Keep both systems completely separate:

- **Local stores** - For personal progress, offline use
- **Supabase** - Only for RAG semantic search features

**Good for:**

- Users who want privacy (local-only)
- Users who want cloud features (opt-in)
- Testing/development

---

## 💡 Recommended Implementation

### Phase 1: **Status Quo with Clarity** (Now)

✅ Keep both systems separate
✅ Add UI indicators showing what's local vs cloud
✅ Document the distinction clearly

### Phase 2: **Optional Sync** (Week 1)

1. Create sync button in settings
2. Upload local data to Supabase on demand
3. Show sync status (last synced, pending changes)
4. Download cloud data on new device

### Phase 3: **Auto-Sync** (Week 2)

1. Background sync every 5 minutes (if enabled)
2. Conflict detection (compare timestamps)
3. Merge UI for manual conflict resolution
4. Sync indicator in nav bar

### Phase 4: **Offline Queue** (Week 3)

1. Queue writes when offline
2. Auto-upload when connection returns
3. Retry failed uploads
4. Show pending sync count

---

## 🔧 Code Example: Hybrid Sync

```typescript
// packages/app/lib/sync-manager.ts

import { useAuthStore } from './auth-store'
import { useJournalStore } from './store'
import { supabase } from './supabase-client'

export interface SyncStatus {
  enabled: boolean
  lastSyncedAt: Date | null
  pendingChanges: number
  syncing: boolean
}

export const useSyncStore = create<{
  status: SyncStatus
  enableSync: () => void
  disableSync: () => void
  syncNow: () => Promise<void>
}>((set, get) => ({
  status: {
    enabled: false,
    lastSyncedAt: null,
    pendingChanges: 0,
    syncing: false,
  },

  enableSync: () => {
    set({ status: { ...get().status, enabled: true } })
    get().syncNow() // Immediate sync on enable
  },

  disableSync: () => {
    set({ status: { ...get().status, enabled: false } })
  },

  syncNow: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      console.log('[Sync] No user - skipping sync')
      return
    }

    set({ status: { ...get().status, syncing: true } })

    try {
      // 1. Upload local journal entries to Supabase
      const localEntries = useJournalStore.getState().journalEntries

      for (const entry of localEntries) {
        // Check if already synced (by checking metadata)
        if (entry.metadata?.synced) continue

        await supabase.from('journal_entries').upsert({
          id: entry.id,
          user_id: user.id,
          category: entry.category,
          content: entry.content,
          mood: entry.mood,
          sensations: entry.sensations,
          metadata: entry.metadata,
          created_at: entry.timestamp,
        })

        // Mark as synced in local store
        useJournalStore.getState().updateEntryMetadata(entry.id, { synced: true })
      }

      // 2. Download cloud entries not in local store
      const { data: cloudEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)

      for (const cloudEntry of cloudEntries || []) {
        const exists = localEntries.find((e) => e.id === cloudEntry.id)
        if (!exists) {
          useJournalStore.getState().addJournalEntry({
            category: cloudEntry.category,
            content: cloudEntry.content,
            mood: cloudEntry.mood,
            sensations: cloudEntry.sensations,
            metadata: { ...cloudEntry.metadata, synced: true },
          })
        }
      }

      set({
        status: {
          enabled: true,
          lastSyncedAt: new Date(),
          pendingChanges: 0,
          syncing: false,
        },
      })

      console.log('[Sync] Sync complete!')
    } catch (err) {
      console.error('[Sync] Sync failed:', err)
      set({ status: { ...get().status, syncing: false } })
    }
  },
}))

// Auto-sync every 5 minutes if enabled
setInterval(
  () => {
    const { status, syncNow } = useSyncStore.getState()
    if (status.enabled && !status.syncing) {
      syncNow()
    }
  },
  5 * 60 * 1000
)
```

### Settings UI Component

```tsx
// packages/app/features/settings/sync-settings.tsx

export function SyncSettings() {
  const user = useAuthStore((state) => state.user)
  const status = useSyncStore((state) => state.status)
  const enableSync = useSyncStore((state) => state.enableSync)
  const disableSync = useSyncStore((state) => state.disableSync)
  const syncNow = useSyncStore((state) => state.syncNow)

  if (!user) {
    return (
      <Card padding="$4" gap="$3">
        <Paragraph>Sign in to enable cloud sync</Paragraph>
        <Button onPress={() => router.push('/auth')}>Go to Sign In</Button>
      </Card>
    )
  }

  return (
    <Card padding="$4" gap="$4">
      <H3>Cloud Sync</H3>

      <XStack gap="$3" alignItems="center">
        <Switch
          checked={status.enabled}
          onCheckedChange={(checked) => {
            if (checked) enableSync()
            else disableSync()
          }}
        />
        <YStack flex={1}>
          <Paragraph fontWeight="600">{status.enabled ? 'Enabled' : 'Disabled'}</Paragraph>
          <Paragraph fontSize="$2" color="$gray11">
            {status.enabled
              ? 'Data syncs to cloud automatically'
              : 'Data stays on this device only'}
          </Paragraph>
        </YStack>
      </XStack>

      {status.enabled && (
        <>
          <YStack gap="$2">
            <Paragraph fontSize="$3" color="$gray11">
              Last Synced
            </Paragraph>
            <Paragraph fontWeight="600">
              {status.lastSyncedAt ? formatDistanceToNow(status.lastSyncedAt) + ' ago' : 'Never'}
            </Paragraph>
          </YStack>

          {status.pendingChanges > 0 && (
            <Paragraph color="$orange10">{status.pendingChanges} pending changes</Paragraph>
          )}

          <Button
            onPress={syncNow}
            disabled={status.syncing}
            icon={status.syncing ? <Spinner /> : <RefreshCw />}
          >
            {status.syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </>
      )}
    </Card>
  )
}
```

---

## 🎓 Summary

### What You Have Now:

1. **Local Zustand stores** - Work perfectly, store everything locally
2. **Supabase auth** - User accounts, sessions, Face ID/PIN
3. **Supabase vector DB** - Sovereign logs with semantic search

### What You Can Do:

1. **Keep using local stores** - No changes needed, works great
2. **Use Supabase for RAG** - Semantic search on sovereign logs
3. **Optionally sync** - Upload local data to cloud for backup

### Recommendation:

**Use Option 1: Local-First with Optional Sync**

Why?

- ✅ Best of both worlds
- ✅ Works offline (critical for wellness app)
- ✅ Cloud backup when you want it
- ✅ No forced migration
- ✅ User choice and agency

Next steps:

1. Fix the auth screen error ✅ (done)
2. Add sync settings screen
3. Implement optional sync button
4. Test sync flow
5. Add auto-sync (if user enables)

**The local stores are the backbone of your app and work beautifully - Supabase is just an enhancement, not a replacement!** 🚀

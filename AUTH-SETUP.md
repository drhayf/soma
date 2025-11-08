# Supabase Authentication Implementation

## ✅ What's Been Set Up

### 1. Client-Side Auth (`packages/app/lib/supabase-client.ts`)

- Cross-platform Supabase client (anon key, respects RLS)
- Magic link authentication (no passwords!)
- Auto session refresh
- Platform-specific storage (localStorage for web, AsyncStorage for native)

### 2. Auth State Management (`packages/app/lib/auth-store.ts`)

- Zustand store for auth state
- Persistent user/session across app restarts
- Auth state change listeners
- Helper methods: `signIn()`, `signOut()`, `initialize()`

### 3. Auth UI (`packages/app/features/user/auth-screen.tsx`)

- Magic link sign-in form
- Email validation
- Loading states
- Success screen after sending magic link

### 4. Provider Integration (`packages/app/provider/index.tsx`)

- Auto-initializes auth on app start
- Checks for existing session
- Listens for auth state changes

## 🔧 Required Next Steps

### Step 1: Configure Supabase Email Templates

1. **Go to**: Supabase Dashboard → Authentication → Email Templates
2. **Edit "Magic Link" template** to include your branding
3. **Set redirect URLs**:
   - **Web**: `http://localhost:3000` (dev) or your production URL
   - **Native**: `somaticalignment://auth/callback`

### Step 2: Configure Auth Providers

1. **Go to**: Supabase Dashboard → Authentication → Providers
2. **Enable "Email"** provider
3. **Optional**: Enable OAuth (Google, Apple, etc.) for one-tap sign-in

### Step 3: Add Auth Route Protection

You'll need to check auth state before allowing access to features:

```tsx
// In any screen that requires auth
const user = useAuthStore((state) => state.user)
const loading = useAuthStore((state) => state.loading)

if (loading) return <Spinner />
if (!user) return <AuthScreen />

// User is authenticated, show the app
return <YourFeature />
```

### Step 4: Update Sovereign Log Creation

When users create logs, pass their `user_id`:

```tsx
import { useAuthStore } from 'app/lib/auth-store'
import { supabase } from 'app/lib/supabase-client'

const user = useAuthStore((state) => state.user)

// Insert log with user_id
const { data, error } = await supabase.from('sovereign_logs').insert({
  user_id: user.id, // ← Required for RLS
  content: logContent,
  category: 'Physical',
  metadata: {},
})
```

### Step 5: Update Chat API to Use Auth

Your `/api/chat` route needs to:

1. Get user from session
2. Pass `user_id` when retrieving logs via semantic search

```ts
// In apps/next/app/api/chat/route.ts
import { createServerClient } from '@supabase/ssr'

// Get user from cookies (web) or header (native)
const supabase = createServerClient(...)
const { data: { user } } = await supabase.auth.getUser()

// Use user.id for semantic search
const results = await supabase.rpc('match_sovereign_logs', {
  query_embedding,
  filter_user_id: user.id, // ← Only retrieve user's own logs
})
```

## 📱 Usage in App

### Sign In

```tsx
import { AuthScreen } from 'app/features/user/auth-screen'

// Show this screen when user is not authenticated
;<AuthScreen />
```

### Check Auth State

```tsx
import { useAuthStore } from 'app/lib/auth-store'

const user = useAuthStore((state) => state.user)
const loading = useAuthStore((state) => state.loading)

if (loading) return <LoadingScreen />
if (!user) return <AuthScreen />
return <HomeScreen />
```

### Sign Out

```tsx
import { useAuthStore } from 'app/lib/auth-store'

const signOut = useAuthStore((state) => state.signOut)

<Button onPress={signOut}>Sign Out</Button>
```

## 🔒 Security (RLS in Action)

With RLS policies active:

- ✅ Users can ONLY see/edit their own sovereign logs
- ✅ Users can ONLY see/edit their own embeddings
- ✅ Service role key (API routes) can bypass RLS for admin operations
- ✅ Anon key (app) respects RLS automatically

## 🚀 Testing Auth

1. **Start app**: `yarn dev` (web) or `yarn ios` (native)
2. **Enter email**: any valid email
3. **Click "Send Magic Link"**
4. **Check email**: Click link to sign in
5. **App redirects**: User authenticated, session stored

## 🎯 Next Integration Points

1. **Home Screen**: Show auth screen if not logged in
2. **Journal Modal**: Pass `user.id` when creating logs
3. **Chat Feature**: Pass `user.id` to semantic search
4. **Settings**: Add sign out button
5. **Profile**: Show user email, account info

Your RAG system now has:

- ✅ Database with vector embeddings
- ✅ RLS policies for user isolation
- ✅ Auth infrastructure (client + state + UI)
- ⏳ Need to wire auth into features (next step)

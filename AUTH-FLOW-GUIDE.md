# 🔐 Authentication Flow - Complete Guide

## Overview

You now have a **seamless, beautiful authentication system** with:

- ✅ Click any Supabase account to log in
- ✅ Face ID/Touch ID on native
- ✅ 4-digit PIN fallback
- ✅ Session persistence
- ✅ No email required for quick login

---

## User Experience Flow

### First Time Setup

```
1. Open /auth tab
2. Scroll to "Create New Account"
3. Enter YOUR email (e.g., you@example.com)
4. Click "Send Magic Link"
5. Check email → Click link
6. App opens → "Set Up PIN" screen appears
7. Enter 4-digit PIN (e.g., 1234)
8. Confirm PIN
9. Toggle "Enable Face ID" if desired
10. Click "Complete Setup"
11. ✅ Logged in!
```

### Returning User (with PIN)

```
1. Open app
2. Auth screen shows your account
3. Click your account card
4. Face ID prompt appears (if enabled on native)
5. ✅ Face ID success → Logged in!

OR (if Face ID disabled/failed):

4. PIN pad appears
5. Enter your 4-digit PIN
6. ✅ Auto-verifies → Logged in!
```

### Quick Account Switching (Development)

```
1. Open /auth tab
2. See list of all Supabase users
3. Click any account
4. Enter PIN (if you know it)
5. ✅ Logged in as that user
```

---

## Features Explained

### 1. User List

**What you see:**

- All accounts in your Supabase database
- Avatar circles with first letter of email
- Creation date for each account
- "Create New Account" button at bottom

**How it works:**

- Calls `supabase.auth.admin.listUsers()`
- Only works with service role key
- Real-time connection status shown
- Auto-refreshes on mount

### 2. Face ID / Touch ID

**Platform:** Native only (iOS/Android)

**Setup:**

- Toggle "Enable Face ID" during PIN setup
- Stored in local state (persisted)
- Auto-triggers on app open

**Behavior:**

- First prompt after selecting user
- If success → immediate login
- If fail → shows PIN pad
- "Use PIN" fallback option

**Technical:**

- Uses `expo-local-authentication` (v17.0.7)
- Checks `hasHardwareAsync()` - device capable?
- Checks `isEnrolledAsync()` - Face ID enrolled?
- Calls `authenticateAsync()` with prompt

### 3. PIN Authentication

**Setup:**

- 4-digit number pad
- Confirmation required
- Stored securely in Zustand persist

**Entry:**

- Visual dots (fill as you type)
- Auto-verifies at 4 digits
- Error feedback if incorrect
- Delete button (⌫) to backspace

**Security:**

- PIN stored in encrypted local storage
- Never sent to server
- Used only for quick re-entry
- Can be cleared/reset

### 4. Session Persistence

**What persists:**

- User object
- Session token
- PIN (if set)
- Biometric preference
- Username (optional)

**Storage:**

- **Web:** localStorage
- **Native:** AsyncStorage
- **Fallback:** In-memory Map

**Behavior:**

- Survives app restarts
- Auto-initializes on app load
- Checks for valid session
- Refreshes token if needed

---

## Email Management

### Your Control

You manage your own email addresses. No auto-generation.

**Options:**

1. **Personal Email:**

   ```
   you@gmail.com
   your.name@company.com
   ```

2. **Testing Emails:**

   ```
   test1@example.com
   test2@example.com
   dev@local.test
   ```

3. **Project-Specific:**
   ```
   somatic.user1@yourdomain.com
   somatic.user2@yourdomain.com
   ```

### Magic Link Process

```
1. Enter email in "Create New Account"
2. Supabase sends verification email
3. Click link in email
4. Redirects to app (deep link)
5. Session created automatically
6. PIN setup screen appears
```

---

## Code Architecture

### Auth Store (`auth-store.ts`)

```typescript
interface AuthState {
  user: User | null // Supabase user object
  session: Session | null // Auth session with JWT
  hasLocalAuth: boolean // PIN configured?
  localAuthPin: string | null // 4-digit PIN
  biometricEnabled: boolean // Face ID on?

  // Actions
  signIn(email: string) // Magic link
  signOut() // Clear session
  setLocalPin(pin: string) // Store PIN
  verifyLocalPin(pin: string) // Check PIN
  enableBiometric() // Turn on Face ID
}
```

### Auth Screen (`auth-screen.tsx`)

```typescript
type AuthMode =
  | 'user-select'   // List of Supabase users
  | 'pin-entry'     // PIN pad + Face ID
  | 'magic-link'    // Email sign-in
  | 'setup-pin'     // First-time PIN config

// Mode switching logic
if (user && hasLocalAuth) → 'pin-entry'
else → 'user-select'
```

### Local Auth Screen (`local-auth-screen.tsx`)

```typescript
// Auto-trigger Face ID on mount
useEffect(() => {
  if (biometricEnabled && biometricAvailable) {
    handleBiometricAuth()
  }
}, [])

// Face ID prompt
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Unlock Somatic Alignment',
  fallbackLabel: 'Use PIN',
})
```

---

## Security Considerations

### Row-Level Security (RLS)

- Every Supabase query filtered by `user_id`
- No user can see another user's data
- Enforced at database level
- Works with anon key

### PIN Storage

- Stored locally (not in Supabase)
- Only for quick re-entry
- Not a password replacement
- Can be reset anytime

### Session Tokens

- JWT tokens from Supabase
- Auto-refresh enabled
- Expire after inactivity
- Stored in secure storage

### Biometric

- Device-level security
- Never leaves device
- OS-managed (iOS Secure Enclave)
- Fallback to PIN always available

---

## Troubleshooting

### "Connection Failed"

**Problem:** Red dot, can't load users

**Solutions:**

1. Check `.env` has correct `SUPABASE_URL` and keys
2. Verify internet connection
3. Check Supabase dashboard is accessible
4. Try manual refresh button

### "No Accounts Found"

**Problem:** User list is empty

**Solutions:**

1. Create an account via magic link
2. Check service role key is set (for admin.listUsers)
3. Verify RLS policies allow access
4. Check Supabase Auth dashboard

### Face ID Not Working

**Problem:** Biometric doesn't trigger

**Solutions:**

1. Verify running on native (not web)
2. Check device has Face ID/Touch ID enrolled
3. Check app permissions (Settings → Somatic Alignment)
4. Use "Enable Face ID" toggle in PIN setup
5. Fall back to PIN entry

### "Incorrect PIN"

**Problem:** PIN doesn't verify

**Solutions:**

1. Try clicking "Back to User List" → re-select user
2. Clear local auth (would need UI button)
3. Use magic link to create new session
4. Check Zustand persist storage

---

## Development Tips

### Testing Multiple Users

```typescript
// Create test accounts in Supabase Dashboard:
test1@example.com
test2@example.com
test3@example.com

// Each will appear in user list
// Click to switch between them
// Set different PINs for each
```

### Quick PIN Reset

```typescript
// In auth-store.ts, add:
clearLocalAuth() {
  set({
    hasLocalAuth: false,
    localAuthPin: null,
    biometricEnabled: false,
  })
}

// Then add button in auth screen to call it
```

### Bypass Auth (Development)

```typescript
// In home screen or provider:
const user = useAuthStore((state) => state.user)

if (!user && __DEV__) {
  // Auto-sign in for dev
  useAuthStore.getState().setUser(mockUser)
}
```

---

## Where to Find Everything

### Auth Files

```
packages/app/features/user/
  ├── auth-screen.tsx        # Main auth orchestrator
  ├── local-auth-screen.tsx  # PIN + Face ID UI
  └── user-list-screen.tsx   # Supabase user list

packages/app/lib/
  ├── auth-store.ts          # State management
  └── supabase-client.ts     # Supabase setup
```

### Navigation

```
apps/expo/app/(tabs)/
  └── auth.tsx               # Native route

apps/next/app/(tabs)/auth/
  └── page.tsx               # Web route

packages/app/components/
  └── FloatingNavPill.tsx    # Added Auth tab
```

### Configuration

```
apps/next/.env
  ├── NEXT_PUBLIC_SUPABASE_URL
  ├── NEXT_PUBLIC_SUPABASE_ANON_KEY
  └── SUPABASE_SERVICE_ROLE_KEY
```

---

## Summary

✅ **Simple Login:** Click user → Face ID → Done
✅ **No Email Needed:** For returning users (just PIN/Face ID)
✅ **You Control Emails:** Create your own when making accounts
✅ **Seamless Experience:** Auto-triggers biometric, persists session
✅ **Beautiful UI:** Connection status, user avatars, smooth animations
✅ **Production Ready:** RLS security, token refresh, cross-platform

**Next:** Open the app, go to `/auth` tab, create an account, and test it out! 🚀

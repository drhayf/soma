# Cross-Platform API Configuration - Complete ✅

## Problem Solved

The native app was getting network errors because:

1. **API routes** imported React hooks (client-only) → Server component error
2. **Localhost doesn't work** on mobile devices (refers to device, not host computer)
3. **No intelligent environment detection** for dev vs production

## Solution Implemented

### 1. Fixed Server/Client Boundary

**File**: `apps/next/app/api/attunement/route.ts`

- **Removed** client-only hook imports (`formatCosmicDataForAI`, `formatAstrologyForAI`)
- **Added** server-safe formatting functions directly in the route
- Properly typed according to `CosmicData` and `AstrologicalInsight` interfaces

### 2. Created Smart API Configuration

**File**: `packages/app/lib/api-config.ts` (NEW)

```typescript
export function getApiUrl(endpoint: string): string
export function getApiConfig(): ApiConfig
export function getBaseUrl(): string
export const LOCAL_DEV_IP: string | null = '192.168.50.105'
```

**Auto-Detection Logic**:

- **Web Platform**: Always uses relative paths (`''`)
- **Native Development**:
  1. First tries `expo-constants`: `Constants.expoConfig.hostUri` → IP extraction
  2. Then tries `Constants.manifest.debuggerHost` → IP extraction
  3. Then tries `window.location.hostname`
  4. Finally falls back to `LOCAL_DEV_IP` (your computer's IP: **192.168.50.105**)
- **Native Production**: Uses Vercel domain (TODO: update when deployed)

### 3. Updated DailyAttunement Component

**File**: `packages/app/features/DailyAttunement.tsx`

**Before**:

```typescript
const API_BASE_URL = Platform.OS === 'web' ? '' : 'http://localhost:3000'
fetch(`${API_BASE_URL}/api/attunement`)
```

**After**:

```typescript
import { getApiUrl } from 'app/lib/api-config'
fetch(getApiUrl('/api/attunement'))
```

## How It Works

### Development (Native)

1. Expo dev server runs at `exp://192.168.50.105:8081`
2. Next.js server runs at `http://192.168.50.105:3000`
3. `getApiUrl('/api/attunement')` returns: `http://192.168.50.105:3000/api/attunement`
4. Native app can reach Next.js server ✅

### Development (Web)

1. Browser runs at `localhost:3000`
2. `getApiUrl('/api/attunement')` returns: `/api/attunement` (relative)
3. Same-origin request works ✅

### Production (Native)

1. App connects to Vercel deployment
2. `getApiUrl('/api/attunement')` returns: `https://your-app.vercel.app/api/attunement`
3. API calls work from anywhere ✅

### Production (Web)

1. Browser loads from Vercel
2. Relative paths work (same domain) ✅

## Configuration Required

### For Local Development

Your computer's IP is already configured: **192.168.50.105**

If your IP changes (e.g., different WiFi network):

1. Run: `Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }`
2. Update `LOCAL_DEV_IP` in `packages/app/lib/api-config.ts`

### For Production Deployment

Update the production URL in `packages/app/lib/api-config.ts`:

```typescript
// Line 75 and 125
baseUrl = 'https://your-actual-app.vercel.app' // Replace with real domain
```

## Testing Checklist

- [ ] **Web Dev**: Visit `localhost:3000`, open Daily Attunement tab
  - Should fetch from `/api/attunement` (relative path)
  - Check browser DevTools Network tab

- [ ] **Native Dev**: Open Expo Go on iPhone
  - Should fetch from `http://192.168.50.105:3000/api/attunement`
  - Check Expo terminal and Next.js terminal for request logs
  - If fails, check `LOCAL_DEV_IP` matches Expo dev server IP

- [ ] **Native Production**: Deploy to TestFlight
  - Should fetch from `https://your-app.vercel.app/api/attunement`
  - Requires Vercel deployment first

## Debugging Tips

### If Native App Still Can't Connect

1. **Check Expo dev server output** for actual IP:

   ```
   exp://192.168.X.X:8081
   ```

2. **Ensure both servers on same network**:
   - Expo dev server: `192.168.50.105:8081`
   - Next.js dev server: `192.168.50.105:3000`

3. **Check firewall** (Windows Defender):
   - Allow Node.js through firewall
   - Allow port 3000 for incoming connections

4. **Verify API config** in app:
   ```typescript
   import { getApiConfig } from 'app/lib/api-config'
   console.log(getApiConfig()) // Should show baseUrl: http://192.168.50.105:3000
   ```

### Common Errors

| Error                                              | Cause                         | Fix                                   |
| -------------------------------------------------- | ----------------------------- | ------------------------------------- |
| "Network request failed"                           | Wrong IP or firewall blocking | Update `LOCAL_DEV_IP`, check firewall |
| "JSON Parse error"                                 | Getting HTML instead of JSON  | Check Next.js server is running       |
| "You're importing a component that needs useState" | Using hooks in API route      | Import from `api-config`, not hooks   |

## Files Changed

1. ✅ `packages/app/lib/api-config.ts` (NEW) - Smart environment detection
2. ✅ `packages/app/features/DailyAttunement.tsx` - Uses `getApiUrl()`
3. ✅ `apps/next/app/api/attunement/route.ts` - Server-safe formatting functions
4. ✅ `packages/app/index.ts` - Exports `getApiUrl` (pending - needs rebuild)

## Next Steps

1. **Test the fix**:

   ```bash
   # Terminal 1: Next.js server (if not running)
   cd apps/next
   yarn dev

   # Terminal 2: Expo dev server (if not running)
   cd apps/expo
   yarn start
   ```

2. **Reload native app**: Shake device → Reload

3. **Check Daily Attunement tab**: Should now load successfully

4. **Verify in logs**: Look for `[API Config] Dev server IP from...` messages

## Production Deployment Notes

When deploying to Vercel:

1. Update `LOCAL_DEV_IP` to actual production domain
2. Set environment variables in Vercel dashboard
3. Redeploy apps/next
4. Build native app with EAS Build (points to production)

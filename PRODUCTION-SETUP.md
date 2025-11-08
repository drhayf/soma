# Production Setup for Personal iPhone Installation

This guide shows you how to install the Somatic Alignment Guide on your personal iPhone **for free** and configure it to work perfectly in both development and production.

## Overview

- **Development**: Test on your iPhone via Expo Go using your local network
- **Production**: Install a standalone app on your iPhone that connects to your deployed API
- **Cost**: $0 (using free tiers of Expo EAS and Vercel)

---

## Part 1: Deploy Next.js API to Vercel (Free)

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (free)

### Step 2: Get Google API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key for Gemini
3. Copy the API key

### Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from Next.js directory
cd apps/next
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: somatic-alignment (or your choice)
# - Directory: ./
# - Override settings? No

# Add environment variable
vercel env add GOOGLE_API_KEY
# Paste your API key
# Select: Production

# Deploy to production
vercel --prod
```

**Option B: Via GitHub**

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Set Root Directory to `apps/next`
5. Add environment variable:
   - Name: `GOOGLE_API_KEY`
   - Value: Your Google API key
6. Deploy

### Step 4: Note Your Vercel URL

After deployment, you'll get a URL like:

```
https://somatic-alignment-abcd1234.vercel.app
```

### Step 5: Test Your API

Visit in browser:

```
https://your-app.vercel.app/api/chat
```

You should see: `{"error":"Method not allowed"}`

This is correct! The API only accepts POST requests.

---

## Part 2: Configure Expo for Production

### Step 1: Update Production Environment File

Edit `apps/expo/.env.production`:

```env
EXPO_PUBLIC_API_URL=https://your-app.vercel.app/api/chat
```

Replace `your-app.vercel.app` with your actual Vercel URL.

### Step 2: Update App Configuration

Edit `apps/expo/app.json`:

```json
{
  "expo": {
    "name": "Somatic Alignment Guide",
    "slug": "somatic-alignment",
    "version": "1.0.0",
    "scheme": "somaticalignment",
    "owner": "dRof",
    "ios": {
      "bundleIdentifier": "com.drof.somaticalignment",
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["fetch"]
      }
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### Step 3: Create EAS Configuration

Create `apps/expo/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "${EXPO_PUBLIC_API_URL}"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Part 3: Build and Install on iPhone

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
# Use your Expo account credentials
```

### Step 3: Configure EAS Project

```bash
cd apps/expo
eas build:configure
```

This will create/update your project ID in `app.json`.

### Step 4: Build for iPhone (Free Tier)

**Option A: Internal Distribution (Recommended for Personal Use)**

```bash
# Build for your device directly
eas build --platform ios --profile production

# Or for preview/testing
eas build --platform ios --profile preview
```

**Option B: TestFlight Distribution**

```bash
# Requires Apple Developer account ($99/year)
eas build --platform ios --profile production
eas submit --platform ios
```

### Step 5: Install on iPhone

After build completes (~10-20 minutes):

**For Internal Distribution:**

1. Open the build URL on your iPhone
2. Download and install the profile
3. Go to Settings → General → VPN & Device Management
4. Trust the developer profile
5. Install the app

**For TestFlight:**

1. Install TestFlight app from App Store
2. Open the TestFlight invitation link
3. Install the app

---

## Part 4: Development Workflow

### Local Development on iPhone

1. **Start Next.js API Server** (in one terminal):

   ```bash
   cd apps/next
   yarn dev
   ```

2. **Start Expo** (in another terminal):

   ```bash
   cd apps/expo
   npx expo start
   ```

3. **Test on iPhone via Expo Go**:
   - Scan QR code with Expo Go app
   - Uses `.env` file with local network IP
   - API calls go to your laptop at http://192.168.50.105:3000

### Testing Production Build Locally

Before building for production, test the production API URL:

```bash
# Set production env var temporarily
cd apps/expo
EXPO_PUBLIC_API_URL=https://your-app.vercel.app/api/chat npx expo start
```

---

## Part 5: Environment Configuration Summary

### Three Environment Files:

**`.env`** (Local development on network)

```env
EXPO_PUBLIC_API_URL=http://192.168.50.105:3000/api/chat
```

**`.env.production`** (Production build)

```env
EXPO_PUBLIC_API_URL=https://your-app.vercel.app/api/chat
```

**`.env.example`** (Template for other developers)

```env
EXPO_PUBLIC_API_URL=http://192.168.50.105:3000/api/chat
```

### How It Works:

- During **development**: Uses `.env` → calls your local Next.js server
- During **EAS build**: Uses `.env.production` → calls your Vercel deployment
- The app code: `process.env.EXPO_PUBLIC_API_URL` automatically picks the right one

---

## Part 6: Update Workflow

When you make changes and want to update your iPhone app:

### Development (Instant Updates via Expo Go)

```bash
# Just save your files - hot reload happens automatically
# No rebuild needed!
```

### Production (Requires Rebuild)

```bash
cd apps/expo

# Option 1: OTA Update (for minor changes - instant!)
eas update --branch production --message "Fixed UI bug"

# Option 2: Full Rebuild (for native code changes)
eas build --platform ios --profile production --auto-submit
```

---

## Part 7: Free Tier Limits

### Vercel (Free Forever)

- ✅ Unlimited API requests for personal use
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (your AI API)
- ✅ Automatic HTTPS
- ✅ Custom domains

### Expo EAS (Free Tier)

- ✅ Unlimited builds for internal distribution
- ⚠️ 30 build minutes/month (usually enough for 2-3 builds)
- ✅ Unlimited OTA updates
- ✅ Development builds

### Google AI (Gemini Free Tier)

- ✅ 15 requests/minute
- ✅ 1 million tokens/minute
- ✅ 1,500 requests/day
- Perfect for personal use!

---

## Part 8: Security for Personal Use

### Protect Your API Key

**Option 1: Rate Limiting (Recommended)**

Edit `apps/next/app/api/chat/route.ts`:

```typescript
// Add simple rate limiting
const rateLimits = new Map()

export async function POST(req: Request) {
  // Simple IP-based rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 20 // 20 requests per minute

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, [])
  }

  const requests = rateLimits.get(ip).filter((time) => now - time < windowMs)

  if (requests.length >= maxRequests) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  requests.push(now)
  rateLimits.set(ip, requests)

  // ... rest of your API code
}
```

**Option 2: Simple API Key (For Extra Security)**

If you want to prevent others from using your API:

1. Add to `apps/next/.env.local`:

   ```env
   GOOGLE_API_KEY=your_google_key
   API_SECRET_KEY=your_random_secret_key_here
   ```

2. Update `apps/next/app/api/chat/route.ts`:

   ```typescript
   export async function POST(req: Request) {
     const apiKey = req.headers.get('x-api-key')
     if (apiKey !== process.env.API_SECRET_KEY) {
       return new Response('Unauthorized', { status: 401 })
     }
     // ... rest of code
   }
   ```

3. Update `apps/expo/app/(tabs)/guide.tsx`:
   ```typescript
   const response = await fetch(API_URL, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-api-key': 'your_random_secret_key_here',
     },
     body: JSON.stringify({ message: userMessage }),
   })
   ```

---

## Quick Start Commands

### First Time Setup

```bash
# 1. Deploy to Vercel
cd apps/next
vercel --prod

# 2. Update production env
# Edit apps/expo/.env.production with your Vercel URL

# 3. Build for iPhone
cd ../expo
eas build --platform ios --profile production
```

### Daily Development

```bash
# Terminal 1: Next.js API
cd apps/next && yarn dev

# Terminal 2: Expo
cd apps/expo && npx expo start
```

### Update Production App

```bash
# Small changes (instant OTA update)
cd apps/expo
eas update --branch production --message "Bug fixes"

# Big changes (rebuild - takes 10-20 min)
eas build --platform ios --profile production
```

---

## Troubleshooting

### "Network request failed" during development

- Make sure Next.js server is running: `cd apps/next && yarn dev`
- Check that IP address matches in `.env`: `http://192.168.50.105:3000/api/chat`
- iPhone and laptop must be on same WiFi network

### "Network request failed" in production build

- Check Vercel deployment is working
- Verify `.env.production` has correct URL
- Test API in browser: `https://your-app.vercel.app/api/chat`

### Build fails on EAS

- Check you're logged in: `eas whoami`
- Verify `app.json` has correct `bundleIdentifier`
- Check build logs for specific errors

### App crashes on launch

- Check for TypeScript errors: `yarn build`
- Verify all dependencies are installed
- Try rebuilding: `eas build --platform ios --profile production --clear-cache`

---

## Cost Breakdown (Annual)

- **Vercel Hosting**: $0 (free tier)
- **Expo EAS Builds**: $0 (free tier, internal distribution)
- **Google AI API**: $0 (free tier, personal use)
- **Apple Developer** (only if using App Store/TestFlight): $99/year
- **Total for Personal Use**: **$0/year** ✅

---

## Next Steps

1. **Right Now**: Test the API locally

   ```bash
   # Start Next.js server
   cd apps/next && yarn dev

   # In another terminal, reload your Expo app
   # The AI chat should work now!
   ```

2. **Today**: Deploy to Vercel

   ```bash
   cd apps/next
   vercel --prod
   ```

3. **This Week**: Build and install on iPhone

   ```bash
   cd apps/expo
   eas build --platform ios --profile production
   ```

4. **Ongoing**: Use OTA updates for quick improvements
   ```bash
   eas update --branch production --message "UI improvements"
   ```

---

You'll have a professional, personal health app on your iPhone that costs nothing to run! 🎉

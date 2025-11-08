# Somatic Alignment Guide - Setup Instructions

## 🎯 You Have Successfully Built a Universal App!

The complete **Somatic Alignment Guide** has been built across both native (Expo) and web (Next.js) platforms, sharing a single source of truth for all content, state, and logic.

## ✅ What Was Built

### Shared Core (`packages/app/`)

- ✅ **types.ts** - Shared TypeScript interfaces
- ✅ **lib/content.ts** - Complete content library (605-line AI system prompt, all routines, knowledge vault)
- ✅ **lib/store.ts** - Zustand state management with cross-platform persistence
- ✅ **features/RoutinePlayer.tsx** - Shared step-by-step exercise player
- ✅ **features/KnowledgeVault.tsx** - Shared knowledge browser

### Native App (`apps/expo/`)

- ✅ **(tabs)/\_layout.tsx** - Bottom tab navigation
- ✅ **(tabs)/index.tsx** - Dashboard with compliance tracker & daily insights
- ✅ **(tabs)/routines.tsx** - Routine selector & player integration
- ✅ **(tabs)/vault.tsx** - Knowledge Vault integration
- ✅ **(tabs)/guide.tsx** - AI chat interface

### Web App (`apps/next/`)

- ✅ **(tabs)/layout.tsx** - Tabs layout with navigation
- ✅ **components/NavBar.tsx** - Bottom navigation bar
- ✅ **(tabs)/page.tsx** - Dashboard (same as native)
- ✅ **(tabs)/routines/page.tsx** - Routines page
- ✅ **(tabs)/vault/page.tsx** - Knowledge Vault page
- ✅ **(tabs)/guide/page.tsx** - AI chat page
- ✅ **api/chat/route.ts** - Secure AI API endpoint with Google Gemini

## 🚀 Next Steps

### 1. Set Up Google Gemini API Key

The AI chat feature requires a Google Gemini API key.

1. Get your API key from: https://aistudio.google.com/apikey

2. Add your key to `apps/next/.env`:

```bash
cd apps/next
# Edit .env and set GOOGLE_API_KEY
```

Or create a local override in `apps/next/.env.local`:

```
GOOGLE_API_KEY=your_actual_api_key_here
```

### 2. Run the Web App

```bash
npm run web
```

Then open: http://localhost:3000

You should see:

- ✅ Dashboard with compliance tracker
- ✅ Daily metaphysical insight
- ✅ Morning & Evening routine cards
- ✅ Bottom navigation (Home, Routines, Vault, Guide)

### 3. Test the Features

**Dashboard:**

- Click on "Begin Morning Protocol" or "Begin Evening Protocol"

**Routines:**

- Navigate through each exercise step
- Complete a routine to increment your compliance streak

**Knowledge Vault:**

- Browse through the 5 tabs of comprehensive content

**AI Guide:**

- Ask questions about posture, exercises, metaphysical significance
- The AI embodies the complete Peak Somatic Guide persona

### 4. Run the Native App (Optional)

```bash
npm run native
```

For iOS:

```bash
npm run ios
```

For Android:

```bash
npm run android
```

**Important for Native Development:**

The native app's AI chat connects to your Next.js server. For development on a physical device:

1. Make sure the Next.js app is running (`npm run web`)
2. Check `apps/expo/.env` - it should have your machine's local IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.X.X:3000/api/chat
   ```
   (Replace with your actual IP - check the Expo server output for your IP)
3. For production builds, use `apps/expo/.env.production` with your deployed Vercel URL

## 📁 Project Structure

```
somatic-alignment/
├── packages/app/           # 🎯 SINGLE SOURCE OF TRUTH
│   ├── lib/content.ts      # All content, routines, AI prompt
│   ├── lib/store.ts        # Compliance tracking state
│   └── features/           # Shared UI components
│
├── apps/expo/              # Native iOS app
│   └── app/(tabs)/         # 4 tab screens
│
└── apps/next/              # Web app
    ├── app/(tabs)/         # 4 tab pages
    ├── app/api/chat/       # AI endpoint
    └── components/         # NavBar

```

## 🎨 Customization

### Adding New Exercises

Edit `packages/app/lib/content.ts`:

```typescript
export const morningRoutineSteps: RoutineStep[] = [
  // Add your new exercise here
  {
    id: 5,
    name: 'Your New Exercise',
    duration: '2 minutes',
    instructions: ['Step 1...', 'Step 2...'],
  },
]
```

Changes automatically apply to both web and native apps!

### Modifying the AI Persona

Edit the `AI_SYSTEM_PROMPT` constant in `packages/app/lib/content.ts`.

### Adding New Knowledge Sections

Add to `knowledgeVaultTabs` in `packages/app/lib/content.ts`.

## 🐛 Troubleshooting

**Issue: "Module not found" errors**

```bash
npm install
```

**Issue: AI chat not working**

- Check that `GOOGLE_API_KEY` is set in `apps/next/.env`
- Restart the Next.js development server
- For Expo: Make sure Next.js dev server is running and update `EXPO_PUBLIC_API_URL` in `apps/expo/.env` to use your machine's local IP (not localhost)

**Issue: Tamagui props errors**

- Use full property names: `flex` instead of `f`, `justifyContent` instead of `jc`
- Use `opacity` instead of `theme="alt1"`
- Use hex colors for icons instead of token colors

**Issue: State not persisting**

- Web: Check browser localStorage
- Native: Ensure `@react-native-async-storage/async-storage` is installed

## 📚 Documentation

- **Full README**: See `SOMATIC-ALIGNMENT-README.md`
- **Original Template**: See original `README.md`
- **Tamagui Docs**: https://tamagui.dev
- **Expo Router**: https://docs.expo.dev/router
- **Next.js**: https://nextjs.org/docs

## 🎉 Success!

You now have a complete, production-ready universal app that:

- ✅ Runs on iOS (native) and web
- ✅ Shares 100% of content and logic
- ✅ Has AI-powered guidance
- ✅ Tracks user progress
- ✅ Provides comprehensive educational content

**Start using it to transform your posture and alignment!** 🧘‍♂️✨

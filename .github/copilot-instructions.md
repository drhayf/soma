# Somatic Alignment Guide - AI Coding Instructions

## Project Architecture

This is a **universal monorepo** using Turborepo + Yarn workspaces. A single codebase powers both native iOS (Expo) and web (Next.js) apps with **100% shared business logic**.

### Critical Structure

- **`packages/app/`** - THE SINGLE SOURCE OF TRUTH. All features, state, types, and content live here
- **`apps/expo/`** - Native iOS wrapper using Expo Router (React Native 0.81.5, Expo SDK 54)
- **`apps/next/`** - Web wrapper using Next.js 14 App Router
- **`packages/ui/`** - Tamagui component library (`@my/ui`)
- **`packages/config/`** - Tamagui configuration with animations and fonts

### Shared-First Development Model

When adding features: implement in `packages/app/features/` first, then import into both apps. Never duplicate logic across apps.

## Technology Stack

| Layer      | Technology                       | Version               |
| ---------- | -------------------------------- | --------------------- |
| Monorepo   | Turborepo + Yarn                 | 4.5.0                 |
| Native     | Expo + React Native              | SDK 54, RN 0.81.5     |
| Web        | Next.js (App Router)             | 14.2.14               |
| Language   | TypeScript                       | 5.8.3                 |
| UI         | Tamagui                          | 1.135.7               |
| State      | Zustand (persisted)              | 5.0.8                 |
| Navigation | Expo Router + Next.js App Router | Tab-based             |
| AI         | Google Gemini 2.0 Flash          | Via Next.js API route |

## Development Workflows

### Build & Run Commands

```bash
# From root - ALWAYS run build before starting apps
yarn build              # Build all packages (required before dev)
yarn native             # Start Expo dev server (cd apps/expo && yarn start)
yarn ios                # Run on iOS simulator
yarn web                # Start Next.js dev server (cd apps/next && yarn dev)
yarn test               # Run Vitest tests
```

### Dependency Installation

**CRITICAL**: Install in the correct workspace or you'll break the monorepo:

- Shared JS/TS: `cd packages/app && yarn add <package>`
- Native-only: `cd apps/expo && yarn add <package>`
- Web-only: `cd apps/next && yarn add <package>`
- Then from root: `yarn && yarn build`

## Cross-Platform Patterns

### State Management

All state uses Zustand in `packages/app/lib/store.ts` with cross-platform persistence:

- Web: `localStorage`
- Native: `@react-native-async-storage/async-storage`
- Fallback: in-memory Map

Example:

```typescript
export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      /* state */
    }),
    { name: 'somatic-alignment-progress', storage: getStorage() }
  )
)
```

### Platform-Specific Code

Use `Platform.OS` checks sparingly. Example from `apps/expo/app/(tabs)/guide.tsx`:

```tsx
import { Platform, KeyboardAvoidingView } from 'react-native'

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
```

### Tamagui Component Guidelines

**NEVER use Tamagui shorthands** - they're disabled in config:

```typescript
// ❌ WRONG
<YStack p="$4" f={1} />

// ✅ CORRECT
<YStack padding="$4" flex={1} />
```

### Navigation

- **Native**: Expo Router with file-based tabs in `apps/expo/app/(tabs)/`
- **Web**: Next.js App Router with file-based tabs in `apps/next/app/(tabs)/`
- Bottom navigation rendered by `NavBar.tsx` (web) and native tabs (Expo)

## Testing Requirements

Before committing changes:

1. **Type check**: `yarn build` must succeed from root
2. **Native test**: `cd apps/expo && npx expo start` - verify in Expo Go on iPhone
3. **Web test**: `cd apps/next && yarn dev` - verify at localhost:3000
4. **Cross-platform verification**: Every feature MUST work on both platforms

Existing React 19 type warnings are expected and can be ignored.

## Content & AI System

All content lives in `packages/app/lib/content.ts`:

- Morning/Evening routine steps (524 lines total)
- Knowledge vault tabs (biomechanics, metaphysics, integration)
- AI system prompt (605-line Peak Somatic Guide persona)

AI chat uses secure Next.js API route at `apps/next/app/api/chat/route.ts`. Native app calls this endpoint; web uses it directly.

## Key Conventions

1. **TypeScript**: Strict mode enabled. All shared types in `packages/app/types.ts`
2. **Imports**: Use path aliases: `app/*` for packages/app, `@my/ui/*` for packages/ui
3. **Linting**: Biome (not ESLint). `noConsoleLog` set to error - use structured logging
4. **React Version**: 19.1.0 on native, 19.0.0 on web (intentional for Next.js compatibility)
5. **File naming**: Use `.tsx` for React components, `.ts` for pure logic

## Deployment

- **Web**: Vercel (see `PRODUCTION-SETUP.md`)
- **Native**: Expo EAS Build for standalone iOS app
- **Environment**: `GOOGLE_API_KEY` required in `apps/next/.env` for AI features

## Critical Files to Understand

- `packages/app/lib/store.ts` - State management with cross-platform persistence adapter
- `packages/app/lib/content.ts` - All routines, knowledge, and AI prompt (524 lines)
- `packages/config/src/tamagui.config.ts` - Disables shorthands, sets fonts/animations
- `turbo.json` - Build pipeline configuration
- `AGENT-HANDOFF-PROMPT.md` - Detailed enhancement workflow and testing protocol

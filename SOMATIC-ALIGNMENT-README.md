# Somatic Alignment Guide

A production-ready, universal app built with **Expo (React Native)** and **Next.js**, sharing a single source of truth for all content, state, and logic. This app guides users through a comprehensive protocol for correcting Anterior Pelvic Tilt (APT) by integrating biomechanical, somatic, energetic, and metaphysical wisdom.

## 🌟 Features

### For Users

- **Daily Routines**: Morning Activation (10-15 min) and Evening Release (10-15 min) protocols
- **Step-by-Step Guidance**: Interactive routine player with detailed instructions
- **Compliance Tracking**: Streak counter to maintain motivation and consistency
- **Knowledge Vault**: Complete reference library covering biomechanics, metaphysics, and 24/7 integration
- **AI Somatic Guide**: Chat with an AI embodying the Peak Somatic Guide persona
- **Daily Insights**: Rotating metaphysical and energetic insights

### For Developers

- **Universal Codebase**: Single source of truth shared between native iOS and web
- **Type-Safe**: Full TypeScript implementation
- **Modern Stack**: Tamagui, Zustand, Expo Router, Next.js App Router
- **Cross-Platform Persistence**: State synced across platforms
- **Production-Ready**: Built on official Tamagui starter template

## 🏗️ Architecture

### Monorepo Structure

```
somatic-alignment/
├── apps/
│   ├── expo/          # Native iOS app (React Native + Expo)
│   │   └── app/
│   │       └── (tabs)/  # Tab-based navigation
│   │           ├── index.tsx      # Dashboard
│   │           ├── routines.tsx   # Routine Player
│   │           ├── vault.tsx      # Knowledge Vault
│   │           └── guide.tsx      # AI Chat
│   └── next/          # Web app (Next.js)
│       ├── app/
│       │   ├── (tabs)/  # Tab-based routing
│       │   └── api/
│       │       └── chat/
│       │           └── route.ts   # AI API endpoint
│       └── components/
│           └── NavBar.tsx         # Bottom navigation
└── packages/
    ├── app/           # Shared core (THE SINGLE SOURCE OF TRUTH)
    │   ├── types.ts           # Shared TypeScript interfaces
    │   ├── lib/
    │   │   ├── content.ts     # All routines, knowledge, AI prompt
    │   │   └── store.ts       # Zustand state management
    │   └── features/
    │       ├── RoutinePlayer.tsx    # Shared player component
    │       └── KnowledgeVault.tsx   # Shared vault component
    └── ui/            # Tamagui components
```

### Technology Stack

| Layer                | Technology                                      |
| -------------------- | ----------------------------------------------- |
| **Monorepo**         | Turborepo                                       |
| **Native**           | Expo (React Native)                             |
| **Web**              | Next.js 15 (App Router)                         |
| **Language**         | TypeScript                                      |
| **UI Library**       | Tamagui                                         |
| **State Management** | Zustand (with persistence)                      |
| **Navigation**       | Expo Router (native) + Next.js App Router (web) |
| **AI**               | Google Gemini 2.0 Flash                         |

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Expo CLI (for mobile development)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd somatic-alignment
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

For the Next.js app, the API key should be in `apps/next/.env`:

```bash
# Already configured in apps/next/.env
GOOGLE_API_KEY=your_actual_api_key_here
```

If you need to override it locally (for testing), create `apps/next/.env.local`:

```bash
GOOGLE_API_KEY=your_test_api_key_here
```

Get your API key from: https://aistudio.google.com/apikey

### Running the Apps

#### Web (Next.js)

```bash
npm run web
```

Then open http://localhost:3000

#### Native (Expo)

```bash
npm run native
```

For iOS Simulator:

```bash
npm run ios
```

For Android Emulator:

```bash
npm run android
```

## 📱 App Structure

### 1. Dashboard (Home)

- **Compliance Tracker**: Visual streak counter with flame icon
- **Daily Focus**: Rotating metaphysical insight (changes every 24 hours)
- **Daily Rhythm Cards**: Quick access to Morning and Evening routines

### 2. Routines

- **Morning Activation Protocol** (4 exercises):
  - Diaphragmatic 'Psoas' Breathing (5 min)
  - Somatic Pelvic Tilts with Pandiculation (10 reps)
  - Glute Bridges (2×15)
  - Dead Bugs (2×10)
- **Evening Release Protocol** (3 exercises):
  - Foam Roll Quads & Hip Flexors (3-5 min)
  - Kneeling Hip Flexor Stretch (30-60s each)
  - 90/90 Passive Rest with Breathing (5 min)

### 3. Knowledge Vault

Five comprehensive sections:

- **Biomechanical Diagnosis**: Lower-Crossed Syndrome, causes, ethnic considerations
- **Metaphysical & Spiritual**: Sacral Chakra, psoas as "muscle of the soul"
- **Peak Integrated Protocol**: Phase 1 (Release) and Phase 2 (Correction)
- **24/7 Integration**: Sitting, sleeping, walking, manual labor protocols
- **Complete Breathing Guide**: General and exercise-specific breathing techniques

### 4. AI Somatic Guide

Real-time chat interface powered by Google Gemini, embodying the complete Peak Somatic Guide persona with integrated biomechanical, energetic, and metaphysical wisdom.

## 🔧 Development

### Adding New Content

All content is centralized in `packages/app/lib/content.ts`. To add new exercises, insights, or knowledge sections, edit this file. Changes automatically propagate to both native and web apps.

### Modifying the AI Persona

The AI system prompt is stored in `packages/app/lib/content.ts` as `AI_SYSTEM_PROMPT`. Edit this constant to refine the AI's knowledge base and behavior.

### Creating New Shared Components

1. Create component in `packages/app/features/YourComponent.tsx`
2. Export it from `packages/app/index.ts`
3. Import and use in both Expo and Next.js apps

### State Management

The compliance tracking state is managed by Zustand in `packages/app/lib/store.ts`. It automatically persists to:

- **Web**: `localStorage`
- **Native**: `AsyncStorage`

## 🌐 Deployment

### Web (Next.js)

Deploy to Vercel:

```bash
cd apps/next
vercel
```

Remember to set the `GOOGLE_API_KEY` environment variable in your Vercel project settings.

### Mobile (Expo)

Build for iOS/Android using EAS:

```bash
cd apps/expo
eas build --platform ios
eas build --platform android
```

## 📚 Content Philosophy

This app is built on the integration of:

- **Biomechanical Science**: Evidence-based corrective exercise
- **Somatic Healing**: Conscious movement and pandiculation
- **Energetic Wisdom**: Chakra system and fascial connections
- **Metaphysical Understanding**: Body as expression of mind and spirit

The complete knowledge base is derived from extensive conversation with a Peak Somatic Guide persona, embodying world-class expertise in physical therapy, orthopedics, somatic healing, and metaphysical guidance.

## 🙏 Acknowledgments

Built with the official Tamagui starter template:

```bash
npx create-tamagui@latest
```

Template: "Free - Expo + Next in a production ready monorepo"

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# 🚀 Agent Implementation Handoff: Multi-Framework Integration

## 📋 YOUR MISSION

You are taking over a **sophisticated personal sovereignty platform** called **Somatic Alignment** that currently integrates:

- Human Design (with mock data)
- Astrology (via RapidAPI)
- MBTI/Jung (OEJTS assessment)
- Health metrics (HealthKit)
- Sovereign logging (somatic tracking)
- RAG system (Supabase pgvector + HuggingFace embeddings)
- AI attunements (Google Gemini 2.0 Flash with 605-line system prompt)

Your task is to **implement the INTEGRATION-MASTER-PLAN.md** which adds 20+ additional metaphysical frameworks (I Ching, Gene Keys, Enneagram, Ayurveda, Chinese Medicine, Chakras, Tarot, Numerology, Biorhythms, Jungian Archetypes, Hero's Journey, Kabbalah, Polyvagal, Reichian, Machiavellian, Stoicism, Sacred Geometry, etc.) with **NASA-level accuracy** and **AI-powered dynamic interpretation**.

---

## 🎯 CRITICAL ARCHITECTURAL PRINCIPLES

### 1. **AI-POWERED INTERPRETATIONS (NOT STATIC FILES)**

**CRITICAL DISTINCTION:**

- ❌ **WRONG:** Create static files like `gate-interpretations.ts` with hardcoded text
- ✅ **CORRECT:** Create **AI interpretation engines** that dynamically generate insights

**Example - How Human Design Gates Should Work:**

```typescript
// ❌ WRONG APPROACH - Static file
// packages/app/lib/hdkit/gate-interpretations.ts
export const gateInterpretations = {
  1: {
    name: 'The Creative',
    keywords: ['creativity', 'self-expression', 'individuality'],
    shadow: 'Entropy',
    gift: 'Freshness',
    siddhi: 'Beauty',
    description: 'Gate 1 is about...', // Static text
  },
}

// ✅ CORRECT APPROACH - AI interpretation engine
// packages/app/lib/hdkit/gate-interpreter.ts
import { callGeminiAPI } from '../ai/gemini-client'

const GATE_INTERPRETER_PROMPT = `
You are a master Human Design analyst with deep knowledge of:
- Ra Uru Hu's original teachings
- Gene Keys (Richard Rudd) shadow/gift/siddhi framework
- I Ching Wilhelm/Baynes translations
- Bodygraph mechanics and circuitry

When interpreting a gate, provide:
1. Core essence and evolutionary purpose
2. Shadow expression (low frequency)
3. Gift expression (mid frequency)  
4. Siddhi expression (high frequency)
5. How it expresses in defined vs undefined centers
6. Channel activations and keynotes
7. Correlation to I Ching hexagram
8. Planetary activation context

Be specific, practical, and integrate multiple layers of meaning.
`

export async function interpretGate(
  gateNumber: number,
  context: {
    isDesignActivation: boolean // Sun/Earth vs personality
    centerType: 'defined' | 'undefined'
    channelActivated?: boolean
    planetActivation?: string // e.g., "Sun", "Earth", "Moon"
    userQuestion?: string // Optional: user's specific question
  }
): Promise<GateInterpretation> {
  const userPrompt = `
Interpret Human Design Gate ${gateNumber} with the following context:
- Activation: ${context.isDesignActivation ? 'Design (unconscious)' : 'Personality (conscious)'}
- Center State: ${context.centerType}
- Channel Activated: ${context.channelActivated ? 'Yes' : 'No'}
- Planetary Activation: ${context.planetActivation || 'Unknown'}
${context.userQuestion ? `\nUser's Question: ${context.userQuestion}` : ''}

Provide a comprehensive interpretation that addresses this specific configuration.
`

  const response = await callGeminiAPI({
    systemPrompt: GATE_INTERPRETER_PROMPT,
    userMessage: userPrompt,
    temperature: 0.7, // Balance creativity with accuracy
    maxTokens: 2000,
  })

  return {
    gateNumber,
    interpretation: response.text,
    generatedAt: new Date().toISOString(),
    context,
  }
}
```

**Why AI Interpretation?**

- Dynamic: Adapts to user's specific configuration (defined/undefined, channels, etc.)
- Contextual: Can reference their other frameworks (astrology, MBTI, etc.)
- Evolving: Improves as AI models improve (no manual content updates)
- Deep: Can go infinitely deeper based on user questions
- Synthesized: Can cross-reference I Ching, Gene Keys, astrology in real-time

---

### 2. **DATABASE-FIRST ARCHITECTURE**

Before implementing ANY framework, you MUST:

1. **Read existing database setup:**
   - `database-setup.sql` - Core tables (sovereign_logs, chat_messages, journal_entries, sovereign_log_embeddings)
   - `database-migration-extended.sql` - Extended tables (user_progress, achievements, sovereign_path_data, cosmic_data_cache, astrology_data_cache, daily_attunements, vector_embeddings, health_metrics_history)
   - `database-add-match-embeddings.sql` - RPC function for RAG semantic search

2. **Design new tables for the framework**
   - Follow existing patterns (user_id foreign key, RLS policies, indexes)
   - Use JSONB for flexible nested data
   - Add `created_at` and `updated_at` timestamps
   - Enable RLS with proper policies

3. **Create new migration file: `database-integration-frameworks.sql`**
   - Add ALL new tables needed for 20+ frameworks
   - Follow naming convention: `[framework]_data` (e.g., `enneagram_data`, `biorhythm_data`)
   - Include proper indexes for performance
   - Add RLS policies for every table

4. **Update sync architecture**
   - Add sync functions in `packages/app/lib/supabase-sync-extended.ts`
   - Follow pattern: `sync[Framework]Data()` and `fetch[Framework]Data()`
   - Connect to Zustand stores for automatic state sync
   - Test with verification script

**Example Database Addition:**

```sql
-- database-integration-frameworks.sql

-- ============================================================
-- Enneagram Profile
-- ============================================================
CREATE TABLE public.enneagram_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core data
  type INTEGER NOT NULL CHECK (type >= 1 AND type <= 9),
  wing TEXT, -- e.g., "1w9", "1w2"
  instinct TEXT CHECK (instinct IN ('self-preservation', 'sexual', 'social')),
  tritype TEXT, -- e.g., "135" (head-heart-gut)

  -- Assessment data
  assessment_scores JSONB, -- All 9 type scores
  assessment_date TIMESTAMPTZ,

  -- Growth tracking
  integration_path INTEGER, -- Growth direction
  disintegration_path INTEGER, -- Stress direction
  current_state TEXT CHECK (current_state IN ('integration', 'balanced', 'disintegration')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_enneagram_user_id ON public.enneagram_data(user_id);
CREATE INDEX idx_enneagram_type ON public.enneagram_data(type);

-- RLS Policies
ALTER TABLE public.enneagram_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enneagram data"
  ON public.enneagram_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enneagram data"
  ON public.enneagram_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enneagram data"
  ON public.enneagram_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enneagram data"
  ON public.enneagram_data FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 3. **VERIFICATION & TESTING PROTOCOL**

For EVERY framework implementation, you MUST:

1. **Verify official documentation exists and is current**
   - Check npm package last updated date
   - Verify GitHub repo is maintained (commits in last 6 months)
   - Read official docs/API references
   - If docs are outdated or package abandoned, FLAG IT and ask for alternatives

2. **Test accuracy against professional sources**
   - Human Design: Compare against humandesigntools.com or mybodygraph.com
   - Astrology: Compare against astro.com or astrodienst.com
   - I Ching: Compare against iching-online.com or ichingfortune.com
   - Create test suite with known birth data and verify outputs match

3. **Validate cross-framework mappings**
   - HD Gate 1 = I Ching Hexagram 1 = Gene Key 1 (verify 1:1 mapping)
   - MBTI INTJ → Jungian Sage archetype → Enneagram 5/1/8 (verify correlations)
   - Chakras → HD Centers (verify 7 chakras map to 9 centers correctly)

4. **Performance testing**
   - Ephemeris calculations < 100ms
   - AI interpretation generation < 2s
   - Database queries < 50ms
   - Total daily synthesis < 5s

---

### 4. **AI INTERPRETATION ENGINES (PATTERN)**

Every framework that has interpretive content should follow this pattern:

```typescript
// packages/app/lib/ai/framework-interpreters/[framework]-interpreter.ts

import { callGeminiAPI } from '../gemini-client'

// Specialized system prompt for this framework
const SYSTEM_PROMPT = `
[Deep expertise prompt for this specific framework]
`

export async function interpret[Framework](
  data: [FrameworkData],
  context: {
    userBirthData?: BirthData
    otherFrameworks?: OtherFrameworkData[]
    userQuestion?: string
  }
): Promise<Interpretation> {

  // Build contextual prompt
  const userPrompt = `[Framework-specific interpretation request]`

  // Call AI with specialized prompt
  const response = await callGeminiAPI({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: userPrompt,
    temperature: 0.7
  })

  return {
    interpretation: response.text,
    framework: '[framework-name]',
    generatedAt: new Date().toISOString()
  }
}
```

**Frameworks that need AI interpreters:**

- Human Design gates/channels/crosses
- I Ching hexagrams
- Gene Keys shadows/gifts/siddhis
- Tarot cards
- Jungian archetypes
- Enneagram dynamics
- Hero's Journey stages
- Astrological transits
- Kabbalah Sephiroth
- Chakra states
- Polyvagal nervous system states
- Strategic intelligence (Machiavellian/Stoic)

**Frameworks that use pure calculation (no AI):**

- Swisseph planetary positions (pure astronomy)
- Numerology life path (pure math)
- Biorhythms (pure sine wave calculation)
- Geocoding (Google API)

---

### 5. **SUPABASE SYNC PATTERN (FOLLOW EXACTLY)**

Every new data type must be synced to Supabase following this exact pattern:

**Example: Enneagram Sync Functions**

```typescript
// packages/app/lib/supabase-sync-extended.ts

import { supabase } from './supabase'

// ============================================================
// ENNEAGRAM DATA SYNC
// ============================================================

export interface EnneagramData {
  type: number // 1-9
  wing?: string
  instinct?: 'self-preservation' | 'sexual' | 'social'
  tritype?: string
  assessmentScores?: Record<string, number>
  assessmentDate?: string
  integrationPath?: number
  disintegrationPath?: number
  currentState?: 'integration' | 'balanced' | 'disintegration'
}

/**
 * Sync enneagram data to Supabase
 */
export async function syncEnneagramData(
  userId: string,
  enneagramData: EnneagramData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('enneagram_data')
      .upsert({
        user_id: userId,
        type: enneagramData.type,
        wing: enneagramData.wing,
        instinct: enneagramData.instinct,
        tritype: enneagramData.tritype,
        assessment_scores: enneagramData.assessmentScores,
        assessment_date: enneagramData.assessmentDate,
        integration_path: enneagramData.integrationPath,
        disintegration_path: enneagramData.disintegrationPath,
        current_state: enneagramData.currentState,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[Sync] Enneagram sync failed:', error)
      return { success: false, error: error.message }
    }

    console.log('[Sync] Enneagram data synced successfully')
    return { success: true }
  } catch (err: any) {
    console.error('[Sync] Enneagram sync error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Fetch enneagram data from Supabase
 */
export async function fetchEnneagramData(userId: string): Promise<EnneagramData | null> {
  try {
    const { data, error } = await supabase
      .from('enneagram_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - not an error
        return null
      }
      console.error('[Sync] Enneagram fetch failed:', error)
      return null
    }

    if (!data) return null

    return {
      type: data.type,
      wing: data.wing,
      instinct: data.instinct,
      tritype: data.tritype,
      assessmentScores: data.assessment_scores,
      assessmentDate: data.assessment_date,
      integrationPath: data.integration_path,
      disintegrationPath: data.disintegration_path,
      currentState: data.current_state,
    }
  } catch (err) {
    console.error('[Sync] Enneagram fetch error:', err)
    return null
  }
}
```

**Then connect to Zustand store:**

```typescript
// packages/app/lib/store.ts

import { syncEnneagramData, fetchEnneagramData } from './supabase-sync-extended'

// Add to SovereignPathStore or create new store
interface SovereignPathStore {
  // ... existing fields

  // Enneagram
  enneagramData: EnneagramData | null
  setEnneagramData: (data: EnneagramData) => void
}

export const useSovereignPathStore = create<SovereignPathStore>()(
  persist(
    (set, get) => ({
      // ... existing state

      enneagramData: null,

      setEnneagramData: async (data: EnneagramData) => {
        set({ enneagramData: data })

        // Auto-sync to Supabase
        const { user } = useAuthStore.getState()
        if (user) {
          await syncEnneagramData(user.id, data)
        }
      },
    }),
    {
      name: 'sovereign-path-storage',
      storage: getStorage(), // Cross-platform persistence
    }
  )
)
```

---

### 6. **RAG VECTORIZATION STRATEGY**

Every framework's data must be vectorized for semantic search. Follow this pattern:

**Example: Vectorizing Enneagram Data**

```typescript
// packages/app/lib/rag/vectorize-enneagram.ts

import { generateEmbedding } from '../embeddings'
import { supabase } from '../supabase'

export async function vectorizeEnneagramData(
  userId: string,
  enneagramData: EnneagramData
): Promise<void> {
  // Create rich text representation
  const textContent = `
User's Enneagram Profile:
- Type: ${enneagramData.type}${enneagramData.wing ? ` with ${enneagramData.wing} wing` : ''}
- Core Fear: ${getCoreFear(enneagramData.type)}
- Core Desire: ${getCoreDesire(enneagramData.type)}
- Basic Proposition: ${getBasicProposition(enneagramData.type)}
- Instinctual Variant: ${enneagramData.instinct || 'Not assessed'}
- Integration Path: Moves toward ${enneagramData.integrationPath} in growth
- Disintegration Path: Moves toward ${enneagramData.disintegrationPath} in stress
- Current State: ${enneagramData.currentState || 'balanced'}

Key Patterns:
${getTypePatterns(enneagramData.type)}

Growth Edge:
${getGrowthEdge(enneagramData.type, enneagramData.currentState)}
`

  // Generate embedding
  const embeddingResult = await generateEmbedding(textContent)

  if ('error' in embeddingResult) {
    console.error('[RAG] Failed to generate enneagram embedding:', embeddingResult.error)
    return
  }

  // Store in vector_embeddings table
  await supabase.from('vector_embeddings').upsert({
    user_id: userId,
    content: textContent,
    embedding: embeddingResult.embedding,
    metadata: {
      type: 'enneagram',
      enneagram_type: enneagramData.type,
      wing: enneagramData.wing,
      instinct: enneagramData.instinct,
      current_state: enneagramData.currentState,
      generated_at: new Date().toISOString(),
    },
  })

  console.log('[RAG] Enneagram data vectorized successfully')
}

// Helper functions for rich context
function getCoreFear(type: number): string {
  const fears = {
    1: 'Being corrupt, evil, or defective',
    2: 'Being unworthy of love',
    3: 'Being worthless or without inherent value',
    // ... all 9 types
  }
  return fears[type] || 'Unknown'
}

// ... similar helpers for desire, proposition, patterns, growth edge
```

**When to vectorize:**

- Immediately after user completes assessment
- When data is updated
- During daily synthesis generation
- When user asks framework-specific questions

---

### 7. **ENHANCED AI SYSTEM PROMPT (MULTI-FRAMEWORK SYNTHESIS)**

The existing AI chat API (`apps/next/app/api/chat/route.ts`) needs enhancement to include all framework data.

**Current structure:**

```typescript
// apps/next/app/api/chat/route.ts

const multiSourceContext = `
=== USER'S COMPLETE ENERGETIC BLUEPRINT ===

BIRTH DATA: ...
HUMAN DESIGN: ...
HEALTH METRICS: ...
COSMIC DATA: ...
ASTROLOGY: ...
RECENT HISTORY (RAG): ...
`
```

**Enhanced structure:**

```typescript
// Build comprehensive framework context
const frameworkContext = await buildFrameworkContext(userId, message)

const enhancedSystemPrompt = `
${AI_SYSTEM_PROMPT} // Existing 605-line Peak Somatic Guide prompt

=== USER'S COMPLETE ENERGETIC BLUEPRINT ===

🧬 BIRTH DATA:
${frameworkContext.birthData}

🔷 HUMAN DESIGN:
${frameworkContext.humanDesign}

⭐ ASTROLOGY:
${frameworkContext.astrology}

☯️ I CHING / GENE KEYS:
${frameworkContext.iChingGeneKeys}

🧠 PSYCHOLOGY (MBTI/JUNGIAN/ENNEAGRAM):
${frameworkContext.psychology}

🌿 BODY INTELLIGENCE (AYURVEDA/TCM/CHAKRAS):
${frameworkContext.bodyIntelligence}

📈 CYCLES & RHYTHMS:
${frameworkContext.cyclesAndRhythms}

🎭 ARCHETYPAL JOURNEY:
${frameworkContext.archetypes}

⚔️ STRATEGIC INTELLIGENCE:
${frameworkContext.strategicIntelligence}

🔮 ESOTERIC SYSTEMS:
${frameworkContext.esotericSystems}

💪 HEALTH & SOMATIC:
${frameworkContext.healthMetrics}

📊 COSMIC ENVIRONMENT:
${frameworkContext.cosmicData}

📝 RECENT PATTERNS (RAG):
${frameworkContext.ragResults}

=== SYNTHESIS INSTRUCTIONS ===

When generating attunements, you MUST:

1. **Cross-Reference 3+ Frameworks**
   Example: "Your Projector strategy (HD) aligns with Enneagram 5's need for recognition of competence, and today's Mercury transit through Gate 7 activates your defined G Center, which correlates with your throat chakra—speak your truth."

2. **Identify Correlations**
   Where frameworks AGREE on the same insight
   Example: "Your undefined Solar Plexus (HD), Vata dosha imbalance (Ayurveda), and sympathetic nervous system activation (Polyvagal) all point to emotional amplification—ground with root chakra work."

3. **Identify Creative Tensions**
   Where frameworks suggest different approaches
   Example: "Your Manifestor strategy (HD) says initiate boldly, but your Enneagram 9 pattern seeks peace—this tension IS your growth edge. Today's Mars transit in Gate 51 (shock) offers the energy to initiate while honoring your need for harmony."

4. **Use AI-Generated Depth**
   Instead of surface-level keywords, generate DEEP interpretations:
   - Gene Keys: Explain shadow→gift transition pathway
   - I Ching: Reference changing lines and timing
   - Tarot: Integrate archetypal narrative
   - Hero's Journey: Contextualize current life stage

5. **Reference Current Transits**
   ALWAYS connect to what's happening NOW energetically

6. **Suggest Specific Somatic Practices**
   Based on their unique configuration:
   - HD undefined centers → specific grounding
   - Polyvagal state → ventral/dorsal practices
   - Dosha imbalance → specific foods/movements
   - Chakra blockage → targeted breathwork

7. **Honor Light & Shadow**
   Integrate spiritual wisdom (light) with strategic intelligence (shadow)
   Example: "Your Gene Key 36 shadow of turbulence can be navigated with Stoic amor fati while setting Machiavellian boundaries—you don't need to absorb others' chaos."

8. **Cite Your Synthesis**
   End with: "This synthesis draws from: [list 5-7 frameworks used]"

=== END SYNTHESIS INSTRUCTIONS ===
`
```

**Create helper function:**

```typescript
// apps/next/lib/framework-context-builder.ts

export async function buildFrameworkContext(
  userId: string,
  userMessage: string
): Promise<FrameworkContext> {
  // Fetch all framework data from Supabase or stores
  const [
    birthData,
    hdChart,
    astrology,
    enneagram,
    ayurveda,
    biorhythms,
    // ... all frameworks
  ] = await Promise.all([
    fetchBirthData(userId),
    fetchHumanDesignChart(userId),
    fetchAstrologyData(userId),
    fetchEnneagramData(userId),
    fetchAyurvedaProfile(userId),
    fetchBiorhythms(userId),
    // ... fetch all
  ])

  // Perform semantic search for relevant patterns
  const ragResults = await semanticSearchAcrossFrameworks(userMessage, userId)

  // Build rich text representations
  return {
    birthData: formatBirthDataContext(birthData),
    humanDesign: formatHDContext(hdChart),
    astrology: formatAstrologyContext(astrology),
    // ... format all frameworks
    ragResults: formatRAGResults(ragResults),
  }
}
```

---

## 📚 REFERENCE DOCUMENTS YOU HAVE

You've been provided with:

1. **INTEGRATION-MASTER-PLAN.md** - Complete 8-layer architecture with:
   - Layer 1: Astronomical foundation (swisseph, geocoding)
   - Layer 2: Core identity (HD, Astrology, MBTI)
   - Layer 3: Esoteric mapping (I Ching, Gene Keys, Kabbalah, Tarot, Numerology)
   - Layer 4: Body intelligence (Ayurveda, TCM, Chakras, Polyvagal, Reichian)
   - Layer 5: Archetypal psychology (Jungian, Enneagram, Hero's Journey)
   - Layer 6: Strategic intelligence (Machiavellian, Stoicism, Dark Psychology)
   - Layer 7: Energy & cycles (Biorhythms, Sacred Geometry, Vibrational)
   - Layer 8: Synthesis engine (RAG, cross-mapping, AI orchestration)

2. **AI Search Results** - NPM packages and libraries found:
   - `swisseph` - Swiss Ephemeris for planetary calculations
   - `hdkit` - Human Design calculations
   - `kerykeion` - Python astrology library (need JS wrapper or API)
   - `mdnm` - Esoteric calculations (I Ching, Kabbalah, Tarot, Numerology)
   - `biorhythm-calculator` - Biorhythm cycles
   - `@thanhpham99/numerology` - Numerology calculations
   - `i-ching` - I Ching hexagrams
   - Google Time Zone API - Historical timezone/DST verification
   - TimeZoneDB - IANA timezone data

3. **Existing Database Schema:**
   - `database-setup.sql` - Core tables
   - `database-migration-extended.sql` - Extended sync architecture
   - Pattern to follow for new tables

4. **Existing Code Architecture:**
   - `packages/app/lib/content.ts` - 605-line AI system prompt (DO NOT MODIFY - reference only)
   - `packages/app/lib/store.ts` - Zustand stores with cross-platform persistence
   - `packages/app/lib/supabase-sync-extended.ts` - Sync function patterns
   - `apps/next/app/api/chat/route.ts` - AI chat API with RAG integration
   - `packages/app/lib/hdkit/` - Existing Human Design implementation (needs enhancement)

---

## 🚦 IMPLEMENTATION WORKFLOW (FOLLOW THIS ORDER)

### PHASE 0: PREPARATION & VERIFICATION (DO FIRST)

1. **Read all existing database files**

   ```bash
   - Read: database-setup.sql
   - Read: database-migration-extended.sql
   - Read: database-add-match-embeddings.sql
   - Understand: Table structures, RLS policies, indexing patterns
   ```

2. **Verify all npm packages are current and maintained**
   For each package in the AI search results:
   - Check npm page for last publish date
   - Check GitHub repo for recent commits (last 6 months)
   - Read official documentation
   - If package is abandoned or outdated, FLAG IT and propose alternative
   - Document verified packages in: `VERIFIED-PACKAGES.md`

3. **Create database migration file**

   ```bash
   Create: database-integration-frameworks.sql
   Include:
   - All new tables for 20+ frameworks
   - Proper RLS policies
   - Indexes for performance
   - Follows existing naming patterns
   ```

4. **Test database migration locally**
   ```bash
   # Run in Supabase SQL Editor
   - Execute database-integration-frameworks.sql
   - Verify all tables created
   - Test RLS policies with different users
   - Document in: DATABASE-MIGRATION-VERIFICATION.md
   ```

### PHASE 1: LAYER 1 - ASTRONOMICAL FOUNDATION (WEEKS 1-2)

**Priority: CRITICAL - Everything depends on this**

#### Task 1.1: Swisseph Integration

```bash
1. Install: yarn workspace packages/app add swisseph
2. Verify package works (check for native dependencies)
3. Create: packages/app/lib/astronomy/swisseph-wrapper.ts
4. Create: packages/app/lib/astronomy/planetary-positions.ts
5. Create: packages/app/lib/astronomy/house-system.ts
6. Test against astro.com for 10 known birth dates
7. Document accuracy in test results
```

**Key Files:**

```typescript
// packages/app/lib/astronomy/swisseph-wrapper.ts
import swisseph from 'swisseph'

export interface PlanetaryPosition {
  planet: string
  longitude: number // 0-360 degrees
  latitude: number
  speed: number
  house: number // 1-12
}

export function calculatePlanetaryPositions(birthData: BirthData): PlanetaryPosition[] {
  // Use swisseph to calculate exact positions
  // Return: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn,
  //         Uranus, Neptune, Pluto, North Node, South Node
}

export function calculateHouses(
  birthData: BirthData,
  system: 'placidus' | 'koch' | 'equal' = 'placidus'
): number[] {
  // Return 12 house cusps in degrees
}
```

#### Task 1.2: Geocoding Integration

```bash
1. Sign up for Google Maps API key
2. Install: yarn workspace apps/next add @googlemaps/google-maps-services-js
3. Create: apps/next/app/api/geocode/route.ts
4. Create: packages/app/lib/geocoding/google-geocoding.ts
5. Test with 20 international addresses
6. Verify timezone detection accuracy
```

**API Route:**

```typescript
// apps/next/app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '../../../lib/geocoding/google-geocoding'

export async function POST(req: NextRequest) {
  const { address } = await req.json()

  const result = await geocodeAddress(address)

  return NextResponse.json(result)
}
```

#### Task 1.3: Historical Timezone Verification

```bash
1. Sign up for TimeZoneDB API key (or use Google Time Zone API)
2. Create: packages/app/lib/geocoding/timezone-validator.ts
3. Test DST accuracy for dates from 1900-2024
4. Document edge cases (e.g., before DST existed)
```

**Verification Test:**

```typescript
// __tests__/astronomy/timezone-accuracy.test.ts
test('Historical DST: NYC 1950-06-15 12:00', async () => {
  const result = await getHistoricalTimezone(
    40.7128,
    -74.006, // NYC
    '1950-06-15T12:00:00'
  )

  expect(result.timezoneId).toBe('America/New_York')
  expect(result.offset).toBe(-4) // EDT
  expect(result.isDST).toBe(true)
  expect(result.confidence).toBeGreaterThan(95)
})
```

### PHASE 2: LAYER 2 - ENHANCE CORE IDENTITY (WEEKS 3-4)

#### Task 2.1: Enhance Human Design with Swisseph

```bash
1. Read: packages/app/lib/hdkit/calculator.ts
2. Replace mock data with swisseph calculations
3. Create AI interpreter: packages/app/lib/ai/hd-gate-interpreter.ts
4. Create AI interpreter: packages/app/lib/ai/hd-channel-interpreter.ts
5. Create AI interpreter: packages/app/lib/ai/hd-cross-interpreter.ts
6. Test against humandesigntools.com
```

**AI Gate Interpreter:**

```typescript
// packages/app/lib/ai/hd-gate-interpreter.ts

const GATE_INTERPRETER_PROMPT = `
You are a master Human Design analyst trained by Ra Uru Hu.

You deeply understand:
- The 64 gates and their evolutionary purpose
- Gene Keys shadow/gift/siddhi framework by Richard Rudd
- I Ching hexagram correlations (Wilhelm/Baynes)
- Circuitry: Individual, Tribal, Collective
- Planetary activations and their meaning
- Defined vs undefined center expressions

When interpreting a gate, be specific, practical, and multi-layered.
Integrate I Ching wisdom and Gene Keys depth.
`

export async function interpretGate(
  gateNumber: number,
  context: GateContext
): Promise<GateInterpretation> {
  // Call Gemini API with specialized prompt
  // Return rich, contextual interpretation
}
```

#### Task 2.2: Enhance Astrology System

```bash
1. Decide: Use kerykeion (Python) as microservice OR find JS alternative
2. If Python: Create Next.js API route that calls Python subprocess
3. Create AI interpreter: packages/app/lib/ai/transit-interpreter.ts
4. Create AI interpreter: packages/app/lib/ai/aspect-interpreter.ts
5. Test natal charts against astro.com
```

#### Task 2.3: Enhance MBTI/Jungian System

```bash
1. Read: packages/app/lib/oejts/index.ts
2. Create: packages/app/lib/jungian/twelve-archetypes.ts
3. Create mapping: MBTI → Jungian archetype
4. Create: packages/app/lib/ai/archetype-interpreter.ts
5. Add cognitive function stack analysis
```

### PHASE 3: LAYER 3 - ESOTERIC MAPPING (WEEKS 5-6)

#### Task 3.1: I Ching Integration

```bash
1. Install: yarn workspace packages/app add i-ching
2. Create: packages/app/lib/i-ching/hexagram-generator.ts
3. Create: packages/app/lib/i-ching/hd-gate-mapping.ts
4. Create AI interpreter: packages/app/lib/ai/hexagram-interpreter.ts
5. Verify 1:1 mapping with HD gates (Hexagram 1 = Gate 1)
6. Add to database: i_ching_data table
7. Create sync functions: syncIChingData(), fetchIChingData()
8. Vectorize for RAG
```

#### Task 3.2: Gene Keys Database

```bash
1. Create: packages/app/lib/gene-keys/keys-database.ts
2. Manual data entry: All 64 keys with shadow/gift/siddhi
3. Source: Gene Keys book or genekeys.com (with permission)
4. Create AI interpreter: packages/app/lib/ai/gene-key-interpreter.ts
5. Map to HD gates (1:1 correspondence)
6. Add to database: gene_keys_data table
7. Vectorize for RAG
```

#### Task 3.3: Numerology

```bash
1. Install: yarn workspace packages/app add @thanhpham99/numerology
2. Verify package is maintained (check npm)
3. Create: packages/app/lib/numerology/calculator.ts
4. Calculate: Life Path, Destiny, Soul Urge, Personality
5. Add to database: numerology_data table
6. Vectorize for RAG
```

#### Task 3.4: Tarot System

```bash
1. Use mdnm package OR create custom deck data
2. Create: packages/app/lib/tarot/deck.ts (78 cards)
3. Create: packages/app/lib/tarot/daily-card.ts
4. Create AI interpreter: packages/app/lib/ai/tarot-interpreter.ts
5. Map Major Arcana to Hero's Journey stages
6. Map to Kabbalah paths
7. Add to database: tarot_data table
8. Vectorize for RAG
```

#### Task 3.5: Kabbalah Tree of Life

```bash
1. Use mdnm package
2. Create: packages/app/lib/kabbalah/tree-of-life.ts
3. Create AI interpreter: packages/app/lib/ai/sephiroth-interpreter.ts
4. Map user to dominant Sephira
5. Add to database: kabbalah_data table
6. Vectorize for RAG
```

### PHASE 4: LAYER 4 - BODY INTELLIGENCE (WEEKS 7-8)

#### Task 4.1: Ayurveda Assessment

```bash
1. Create: packages/app/lib/ayurveda/dosha-assessment.ts
2. Create assessment quiz (20-30 questions)
3. Calculate Vata/Pitta/Kapha percentages
4. Create AI interpreter: packages/app/lib/ai/dosha-interpreter.ts
5. Generate recommendations (foods, herbs, practices)
6. Add to database: ayurveda_data table
7. Vectorize for RAG
```

#### Task 4.2: Chinese Medicine

```bash
1. Create: packages/app/lib/chinese-medicine/five-elements.ts
2. Calculate dominant element from birth data
3. Create: packages/app/lib/chinese-medicine/organ-clock.ts
4. Map to Ayurvedic doshas
5. Add to database: tcm_data table
6. Vectorize for RAG
```

#### Task 4.3: Chakra System

```bash
1. Create: packages/app/lib/chakras/seven-chakras.ts
2. Create: packages/app/lib/chakras/hd-center-mapping.ts
3. Verify 7 chakras → 9 HD centers mapping
4. Analyze sovereign logs for blockage patterns
5. Create AI interpreter: packages/app/lib/ai/chakra-interpreter.ts
6. Add to database: chakra_data table
7. Vectorize for RAG
```

#### Task 4.4: Polyvagal Theory Enhancement

```bash
1. Create: packages/app/lib/polyvagal/state-detection.ts
2. Analyze sovereign logs for ventral/sympathetic/dorsal patterns
3. Create: packages/app/lib/polyvagal/interventions.ts
4. Map to Ayurvedic doshas (Vata=sympathetic, Kapha=dorsal)
5. Create AI interpreter: packages/app/lib/ai/polyvagal-interpreter.ts
6. Add to database: polyvagal_data table
7. Vectorize for RAG
```

#### Task 4.5: Reichian Character Structures

```bash
1. Create: packages/app/lib/reichian/character-structures.ts
2. Define 5 structures with armoring patterns
3. Detect from sovereign log patterns
4. Map to HD undefined centers
5. Create AI interpreter: packages/app/lib/ai/reichian-interpreter.ts
6. Add to database: reichian_data table
7. Vectorize for RAG
```

### PHASE 5: LAYER 5 - ARCHETYPAL PSYCHOLOGY (WEEKS 9-10)

#### Task 5.1: Jungian 12 Archetypes

```bash
1. Create: packages/app/lib/jungian/twelve-archetypes.ts
2. Map MBTI types to primary archetype
3. Create AI interpreter: packages/app/lib/ai/jungian-interpreter.ts
4. Track shadow work progression
5. Add to database: jungian_data table
6. Vectorize for RAG
```

#### Task 5.2: Enneagram System

```bash
1. Create: packages/app/lib/enneagram/nine-types.ts
2. Create assessment quiz
3. Calculate type, wing, instinct, tritype
4. Map to MBTI types
5. Create AI interpreter: packages/app/lib/ai/enneagram-interpreter.ts
6. Add to database: enneagram_data table
7. Vectorize for RAG
```

#### Task 5.3: Hero's Journey

```bash
1. Create: packages/app/lib/heros-journey/twelve-stages.ts
2. Map to astrology houses (1st House = Ordinary World, etc.)
3. Determine user's current stage from transits
4. Create AI interpreter: packages/app/lib/ai/heros-journey-interpreter.ts
5. Connect to Jungian individuation phases
6. Add to database: heros_journey_data table
7. Vectorize for RAG
```

### PHASE 6: LAYER 6 - STRATEGIC INTELLIGENCE (WEEKS 11-12)

#### Task 6.1: Machiavellian Awareness (Protection)

```bash
1. Create: packages/app/lib/strategic/forty-eight-laws.ts
2. Create: packages/app/lib/strategic/manipulation-detection.ts
3. Analyze sovereign logs for power dynamics patterns
4. Create AI interpreter: packages/app/lib/ai/strategic-interpreter.ts
5. Focus: Recognition and protection, NOT manipulation
6. Add to database: strategic_data table
7. Vectorize for RAG
```

#### Task 6.2: Stoicism Integration

```bash
1. Create: packages/app/lib/stoicism/four-virtues.ts
2. Create: packages/app/lib/stoicism/dichotomy-of-control.ts
3. Add to morning routine as reflection
4. Create AI interpreter: packages/app/lib/ai/stoic-interpreter.ts
5. Connect to polyvagal regulation
6. Add to database: stoicism_data table
7. Vectorize for RAG
```

### PHASE 7: LAYER 7 - ENERGY & CYCLES (WEEK 13)

#### Task 7.1: Biorhythms

```bash
1. Install: yarn workspace packages/app add biorhythm-calculator
2. Create: packages/app/lib/biorhythms/calculator.ts
3. Calculate daily physical/emotional/intellectual cycles
4. Connect to HD authorities for decision timing
5. Add to database: biorhythm_data table
6. Vectorize for RAG
```

#### Task 7.2: Sacred Geometry

```bash
1. Create: packages/app/lib/sacred-geometry/golden-ratio.ts
2. Optional: Body proportion analysis
3. Use in UI design (golden ratio spacing)
4. Create AI interpreter: packages/app/lib/ai/geometry-interpreter.ts
5. Add to database: sacred_geometry_data table
```

#### Task 7.3: Vibrational Systems

```bash
1. Create: packages/app/lib/vibration/solfeggio-frequencies.ts
2. Create: packages/app/lib/vibration/brainwave-states.ts
3. Map to polyvagal states
4. Suggest frequencies for somatic practices
5. Add to database: vibration_data table
```

### PHASE 8: LAYER 8 - SYNTHESIS ENGINE (WEEKS 14-16)

#### Task 8.1: RAG Vectorization Orchestrator

```bash
1. Create: packages/app/lib/rag/vectorization-orchestrator.ts
2. Implement: vectorizeUserProfile() - all frameworks at once
3. Create rich text representations for each framework
4. Generate embeddings with metadata tagging
5. Test semantic search across all frameworks
```

#### Task 8.2: Cross-Framework Mapping Engine

```bash
1. Create: packages/app/lib/synthesis/mapping-registry.ts
2. Build comprehensive mapping database:
   - HD Gate 1 → I Ching 1 → Gene Key 1
   - MBTI INTJ → Jungian Sage → Enneagram 5/1/8
   - Polyvagal dorsal → Kapha excess → Root chakra
3. Create: packages/app/lib/synthesis/correlation-detector.ts
4. Find patterns across systems automatically
```

#### Task 8.3: Enhanced AI System Prompt

```bash
1. Create: apps/next/lib/framework-context-builder.ts
2. Modify: apps/next/app/api/chat/route.ts
3. Build comprehensive context from all frameworks
4. Add synthesis instructions to system prompt
5. Test that AI cites 3+ frameworks per response
```

#### Task 8.4: Daily Synthesis Automation

```bash
1. Create: packages/app/lib/synthesis/daily-synthesis.ts
2. Create: apps/next/app/api/cron/daily-synthesis/route.ts
3. Calculate current transits
4. Check biorhythms
5. Analyze recent logs
6. Generate morning attunement
7. Vectorize and store in daily_syntheses table
```

---

## ✅ VERIFICATION CHECKLIST (COMPLETE AFTER EACH PHASE)

For each framework implementation, verify:

- [ ] Official documentation reviewed and current
- [ ] Database table created with RLS policies
- [ ] Sync functions created (sync + fetch)
- [ ] Connected to Zustand store with auto-sync
- [ ] AI interpreter created (if applicable)
- [ ] Accuracy tested against professional source
- [ ] RAG vectorization implemented
- [ ] Cross-framework mappings documented
- [ ] Performance tested (<100ms calculations, <2s AI)
- [ ] Test suite passing
- [ ] Documentation updated

---

## 🚨 CRITICAL ERRORS TO AVOID

1. **DO NOT create static interpretation files**
   - Use AI interpreters, not hardcoded text

2. **DO NOT skip database-first architecture**
   - Create tables BEFORE implementing features

3. **DO NOT assume package documentation is current**
   - Always verify npm publish date and GitHub activity

4. **DO NOT duplicate sync logic**
   - Follow exact pattern from supabase-sync-extended.ts

5. **DO NOT skip vectorization**
   - Every framework MUST be in RAG for AI synthesis

6. **DO NOT break existing functionality**
   - Test that current features still work after changes

7. **DO NOT use deprecated APIs**
   - Check for deprecation notices in package docs

8. **DO NOT hard-code API keys**
   - Use environment variables

9. **DO NOT skip cross-platform testing**
   - Test on web AND native (Expo Go)

10. **DO NOT merge without testing**
    - Run full test suite before marking phase complete

---

## 📊 SUCCESS METRICS

By the end of implementation, the system should:

1. **Accuracy:** 99%+ match with professional tools
2. **Depth:** AI cites average 5+ frameworks per attunement
3. **Performance:** <2s for daily synthesis generation
4. **Coverage:** All 20+ frameworks vectorized and searchable
5. **Integration:** All frameworks auto-sync to Supabase
6. **Sophistication:** AI synthesizes light + shadow aspects
7. **Reliability:** Zero database errors, proper RLS isolation
8. **Testability:** 95%+ test coverage on calculations

---

## 🎯 YOUR FIRST ACTIONS

When you receive this prompt:

1. **Acknowledge receipt and confirm understanding**
   - Summarize the 8-layer architecture
   - Confirm you understand AI interpretation vs static files
   - Confirm you understand database-first approach

2. **Verify all packages are current**
   - Create `VERIFIED-PACKAGES.md`
   - Check each package from AI search results
   - Flag any that are abandoned or outdated

3. **Read existing database schema**
   - Understand table structures
   - Understand RLS patterns
   - Understand sync function patterns

4. **Create database migration file**
   - `database-integration-frameworks.sql`
   - All 20+ framework tables
   - Proper RLS policies
   - Performance indexes

5. **Ask clarifying questions**
   - If anything is unclear about architecture
   - If you need guidance on specific frameworks
   - If you discover packages are outdated

Ready to build the most sophisticated personal sovereignty platform ever created? 🚀

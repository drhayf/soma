# AI Search Agent Prompt: Somatic Alignment Birth Data & Metaphysical Framework Integration

## Project Context

**Somatic Alignment** is a sophisticated personal sovereignty and somatic intelligence platform that combines:

- **Human Design bodygraph** calculations and analysis
- **MBTI/Jungian typology** (OEJTS assessment - 16 personalities framework)
- **Health metrics** tracking (HealthKit integration - sleep, steps, walking asymmetry)
- **Cosmic/astronomical data** (solar/lunar cycles, twilight periods via IP Geolocation Astronomy API)
- **Astrology** (natal charts, transits via AstrologyAPI)
- **Daily attunements** - AI-generated personalized insights using Google Gemini 2.0 Flash
- **Sovereign logging** - Pattern recognition in bodily sensations, urges, emotional states
- **RAG system** - Vector embeddings (HuggingFace BAAI/bge-small-en-v1.5) with Supabase pgvector
- **Kata system** - Personalized physical/mental/emotional practices
- **Archetype analysis** - Pattern synthesis from user's sovereign logs

**Tech Stack:**

- Turborepo monorepo with Expo (iOS native) + Next.js 14 (web)
- TypeScript, Tamagui UI, Zustand state management
- Supabase (PostgreSQL + pgvector for semantic search)
- Google Gemini AI (via Next.js API route)
- React Native 0.81.5 + Expo SDK 54

**Current AI Persona (605-line system prompt):**
"Peak Somatic Guide" - Expert in:

- Somatic experiencing & embodied cognition
- Human Design (types, strategies, authorities, profiles)
- Jungian psychology (shadow work, individuation, archetypes)
- Trauma-informed nervous system regulation
- Embodiment practices, body-based intelligence
- Pattern recognition across physical/emotional/mental domains

**Data Architecture:**

- 10 Supabase tables (user_progress, achievements, sovereign_path_data, cosmic_data_cache, astrology_data_cache, daily_attunements, vector_embeddings, health_metrics_history, sovereign_logs, sovereign_log_embeddings)
- 32 RLS policies for user data isolation
- 2 RPC functions for semantic search (match_sovereign_logs, match_embeddings)
- Cross-platform persistence (localStorage web, AsyncStorage native)
- Auto-sync to Supabase for RAG context

---

## Current Challenge

**Birth data collection is primitive:**

- Users must manually enter latitude/longitude coordinates
- No geocoding (address → coordinates conversion)
- No timezone auto-detection or DST verification
- Birth data stored but NOT vectorized for AI context
- AI doesn't reference user's Human Design type, astrological placements, or birth context in responses

**We need:**

1. Reliable birth data verification/validation APIs or SDKs
2. Geocoding with historical timezone accuracy (accounting for DST at birth time)
3. Integration with comprehensive metaphysical frameworks beyond current Human Design + Astrology

---

## Search Mission

Find the **most sophisticated, accurate, and comprehensive APIs/SDKs/frameworks** for:

### 1. Birth Data & Astronomical Calculations

- **Geocoding services** with historical timezone data (Google Maps? TimeAndDate.com? GeoNames?)
- **Swiss Ephemeris** implementations (for precise planetary positions)
- **Astronomical calculation libraries** accurate for any date/time/location in modern history
- Services that can verify birth data accuracy (e.g., "was this city using DST on this date?")

### 2. Metaphysical & Psychological Frameworks (APIs, Libraries, or Open Datasets)

**Priority frameworks to integrate:**

#### Jungian Psychology (Beyond Current Implementation)

- **Shadow work** assessment tools
- **Individuation** stage tracking
- **Anima/Animus** integration frameworks
- **Collective unconscious** archetypes (Hero, Sage, Innocent, Explorer, etc. - 12 Jungian archetypes)
- **Cognitive functions** (Ti, Te, Fi, Fe, Ni, Ne, Si, Se) - deeper than current MBTI

#### Esoteric & Ancient Wisdom Systems

- **I Ching** (Book of Changes) - hexagram calculations, line interpretations
- **Kabbalah** (Tree of Life, Sephiroth) - spiritual mapping
- **Tarot** (Major/Minor Arcana) - archetypal journey mapping
- **Enneagram** (9 types + wings + instincts + integration/disintegration) - personality depths
- **Gene Keys** (64 keys mapped to HD gates, shadows → gifts → siddhis)
- **Chakra systems** (7 traditional + extended systems)
- **Ayurveda** (Doshas: Vata, Pitta, Kapha + prakruti/vikruti)
- **Chinese Medicine** (5 Elements, meridians, organ clock)
- **Hermetic principles** (7 principles: Mentalism, Correspondence, Vibration, Polarity, Rhythm, Cause & Effect, Gender)

#### Strategic & Power Dynamics (The "Shadow" Intelligence)

- **Machiavellian frameworks** (48 Laws of Power, Art of War integration)
- **Dark psychology** (manipulation awareness, boundary recognition - NOT for manipulation, but for sovereignty protection)
- **Game theory** in relationships and power dynamics
- **Stoicism** (Marcus Aurelius, Epictetus, Seneca principles)
- **Rhetoric & persuasion** (Aristotelian modes: Ethos, Pathos, Logos)

#### Somatic & Body-Based Systems

- **Polyvagal theory** (ventral vagal, dorsal vagal, sympathetic states)
- **Somatic Experiencing** (trauma release, titration, pendulation)
- **Hakomi** (mindfulness-based somatic psychology)
- **Authentic Movement** (body-led practice)
- **Reichian character structures** (5 armoring patterns)

#### Energy & Vibrational Systems

- **Biorhythms** (physical, emotional, intellectual cycles)
- **Numerology** (Pythagorean, Chaldean, Life Path, Destiny numbers)
- **Sacred geometry** (Flower of Life, Metatron's Cube, golden ratio in biology)
- **Frequency/vibration** frameworks (Solfeggio frequencies, Schumann resonance)

#### Mythology & Archetypal Narratives

- **Hero's Journey** (Joseph Campbell's monomyth - 12 stages)
- **Greek mythology** archetypes (Gods/Goddesses as personality aspects)
- **Norse mythology** (Runes, Yggdrasil, 9 realms mapping)

---

## Specific Search Queries

### Search on: **GitHub**

- "swiss ephemeris javascript"
- "human design calculation library"
- "astrology calculation open source"
- "gene keys API"
- "enneagram assessment library"
- "I Ching hexagram generator"
- "jungian archetypes framework"
- "polyvagal theory implementation"
- "numerology calculation library"
- "biorhythm calculator"

### Search on: **Hugging Face**

- "personality assessment model"
- "psychological profiling NLP"
- "archetype classification"
- "embodiment tracking"
- "emotional pattern recognition"
- "jungian psychology AI"

### Search on: **Reddit** (r/humandesign, r/Jung, r/occult, r/astrology, r/Enneagram)

- "best human design calculation software"
- "accurate astrology API"
- "gene keys resources"
- "comprehensive personality framework integration"
- "birth data verification services"

### Search on: **NPM/PyPI**

- "swiss-ephemeris"
- "astro-seek"
- "human-design"
- "gene-keys"
- "enneagram"
- "i-ching"
- "numerology"
- "tarot"

### Search on: **API Marketplaces** (RapidAPI, APILayer, Apilayer)

- Astrology APIs (AstrologyAPI, Astro-Seek, AstroMatrix)
- Geocoding APIs (Google Maps, Mapbox, OpenCage)
- Timezone APIs (TimeZoneDB, Google Time Zone API)
- Numerology APIs
- Tarot APIs

### Search on: **Academic/Research**

- Jung Digital Library APIs
- Somatic research databases
- Polyvagal theory implementations
- Embodied cognition frameworks

---

## Evaluation Criteria

For each API/SDK/framework found, assess:

1. **Accuracy** - Is it based on proven algorithms/calculations? (e.g., Swiss Ephemeris for astronomy)
2. **Comprehensiveness** - Does it cover depth (not just surface-level)?
3. **API Availability** - REST API, SDK, or open-source library?
4. **Cost** - Free tier? Pricing for production use?
5. **Documentation** - Well-documented for integration?
6. **Maintenance** - Actively maintained? Community support?
7. **TypeScript/JavaScript Support** - Compatible with our stack?
8. **Privacy** - Can calculations happen client-side? Or must data leave device?
9. **Proven Results** - User testimonials, case studies, research backing?
10. **Integration Potential** - Can it work with our RAG system (vectorizable context)?

---

## Desired Output Format

For each framework/API found, provide:

```
### [Framework/API Name]

**Category:** [Astrology/Psychology/Energy/etc.]

**What it does:** [Brief description]

**Why it's relevant:** [How it enhances Somatic Alignment]

**Implementation:**
- API/SDK: [Link]
- Language: [JavaScript/Python/REST API]
- Cost: [Free/Paid/Open Source]
- Accuracy: [How reliable? Based on what?]

**Integration approach:**
- [How we'd vectorize this data for RAG]
- [How AI would reference it in attunements]
- [How it connects to existing HD/astrology/MBTI data]

**Example use case:**
"User with Projector HD type, Enneagram 4w5, Scorpio Sun, Kapha dosha receives daily attunement that synthesizes: 'Your Projector strategy to wait for recognition aligns with your 4w5's need for authenticity. Today's Scorpio sun transit intensifies your already deep emotional nature, while your Kapha dosha suggests grounding practices...' "

**Resources:**
- Repo/API: [Link]
- Documentation: [Link]
- Research/Proof: [Link to studies/testimonials]
```

---

## Bonus: Synthesis Opportunities

Look for frameworks that **naturally map to each other:**

- Human Design gates (1-64) ↔ I Ching hexagrams (1-64) ↔ Gene Keys (1-64)
- MBTI cognitive functions ↔ Jungian archetypes ↔ Enneagram types
- Chakras ↔ Human Design centers ↔ Reichian character structures
- Astrology houses (1-12) ↔ Hero's Journey stages (12) ↔ Jungian individuation phases
- Chinese Medicine elements ↔ Ayurvedic doshas ↔ Polyvagal states

These mapping could create a **multi-dimensional personality matrix** where everything cross-references and validates.

---

## Final Goal

Help us build a system where:

1. Birth data is verified with NASA-level astronomical accuracy
2. AI attunements synthesize 10+ metaphysical frameworks simultaneously
3. Every framework's data is vectorized and searchable in RAG
4. User sees patterns across ALL systems (e.g., "Your Projector strategy, Enneagram 5, Saturn return, and dorsal vagal state all point to a need for rest and discernment")
5. The system respects both "light" (spiritual/healing) and "shadow" (power dynamics/Machiavellian awareness) aspects of sovereignty

**We want the most sophisticated personal sovereignty intelligence system possible.**

Please prioritize:

- **Accuracy over simplicity** (Swiss Ephemeris > basic astrology calculators)
- **Depth over breadth** (Gene Keys 64 shadows/gifts/siddhis > surface astrology)
- **Proven frameworks** (thousands of years of wisdom OR modern research-backed)
- **APIs that can be integrated** (REST, JS/TS libraries, or scrapable data)

---

## Context for Your Search

This is not for entertainment or gimmicks. This is a **serious sovereignty tool** for people who:

- Track bodily sensations and urges with precision
- Understand their nervous system states
- Recognize manipulation and power dynamics
- Integrate shadow and light aspects
- Want to understand their design at the deepest levels
- Use ancient wisdom AND modern psychology
- Value both mysticism AND embodied pragmatism

**Think:** What would a system built by Carl Jung, Timothy Leary, Stanislav Grof, Buckminster Fuller, and Bruce Lee look like if they had modern AI and databases?

That's what we're building.

Search accordingly. 🔱

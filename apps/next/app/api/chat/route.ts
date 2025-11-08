/**
 * Next.js API Route for AI Chat with RAG (Retrieval-Augmented Generation)
 * Secure backend that calls Google Gemini with semantic search context from Supabase pgvector
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_SYSTEM_PROMPT } from 'app/lib/content'
import { generateEmbedding } from 'app/lib/embeddings'
import { semanticSearch } from '../../../lib/supabase'

// Initialize the Google Generative AI client
// Make sure to set GOOGLE_API_KEY in your .env or .env.local file
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      history,
      userProgress,
      recentHistory,
      humanDesignChart,
      healthMetrics,
      cosmicData,
      astrologyData,
      birthData,
    } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        {
          error:
            'Google API key is not configured. Please set GOOGLE_API_KEY in your environment variables.',
        },
        { status: 500 }
      )
    }

    console.log('[Chat API] Processing message with multi-source synthesis...')

    // Build contextual system prompt with user progress
    let contextualPrompt = AI_SYSTEM_PROMPT

    // RAG: Semantic search for relevant sovereign logs
    let ragContext = ''

    if (process.env.HF_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        console.log('[Chat API] Performing semantic search for user question...')

        // Embed the user's question
        const queryEmbeddingResult = await generateEmbedding(message, process.env.HF_API_KEY)

        if ('embedding' in queryEmbeddingResult) {
          // Search for similar content in vector database
          const searchResults = await semanticSearch(
            queryEmbeddingResult.embedding,
            0.7, // Match threshold (70% similarity minimum)
            5 // Top 5 results
          )

          if (searchResults.length > 0) {
            console.log(`[Chat API] Found ${searchResults.length} relevant logs`)

            // Build RAG context string
            ragContext = `

RELEVANT USER HISTORY (from semantic search):
${searchResults
  .map((result, idx) => {
    const type = result.metadata?.type || 'unknown'
    const timestamp = result.metadata?.timestamp || 'unknown'
    return `[${idx + 1}] (${type} - ${new Date(timestamp).toLocaleDateString()}) [Relevance: ${(result.similarity * 100).toFixed(1)}%]
${result.content}
`
  })
  .join('\n')}

CRITICAL SYNTHESIS INSTRUCTION:
The above history was retrieved via semantic similarity to the user's current question. Use this context to:
1. Identify recurring patterns or themes
2. Reference past experiences naturally (e.g., "I see you logged this before...")
3. Build on previous insights instead of repeating them
4. Detect contradictions or growth between past and present states
`
          } else {
            console.log('[Chat API] No relevant logs found (no matches above threshold)')
          }
        } else {
          console.warn('[Chat API] Failed to embed query:', queryEmbeddingResult.error)
        }
      } catch (ragError: any) {
        console.error('[Chat API] RAG error:', ragError)
        // Continue without RAG if it fails
      }
    }

    // STEP 2: Multi-Source Intelligence Synthesis
    let multiSourceContext = '\n\n=== CURRENT MULTI-DIMENSIONAL STATE ===\n'

    // Human Design Blueprint
    if (humanDesignChart) {
      multiSourceContext += `
📐 HUMAN DESIGN BLUEPRINT:
- Type: ${humanDesignChart.type}
- Profile: ${humanDesignChart.profile}
- Strategy: ${humanDesignChart.strategy}
- Authority: ${humanDesignChart.authority}
- Definition: ${humanDesignChart.definition}
- Incarnation Cross: ${humanDesignChart.incarnationCross || 'Unknown'}
- Defined Centers: ${humanDesignChart.definedCenters?.join(', ') || 'Unknown'}
- Open Centers: ${humanDesignChart.openCenters?.join(', ') || 'Unknown'}

CRITICAL: Reference their unique design when addressing physical patterns, energy levels, and decision-making.
Example: "As a ${humanDesignChart.type}, your ${humanDesignChart.strategy} is key to avoiding resistance in your physical body..."
`
    }

    // HealthKit Metrics (Vessel State)
    if (healthMetrics) {
      multiSourceContext += `
🏥 VESSEL METRICS (HealthKit):
- Sleep Duration: ${healthMetrics.sleepDuration || 'N/A'} hours
- Sleep Quality: ${healthMetrics.sleepQuality || 'N/A'}%
- Steps Today: ${healthMetrics.steps || 'N/A'}
- Active Energy: ${healthMetrics.activeEnergy || 'N/A'} kcal
- Resting Heart Rate: ${healthMetrics.restingHeartRate || 'N/A'} bpm
${
  healthMetrics.bodyAsymmetry
    ? `- Body Asymmetry: ${JSON.stringify(healthMetrics.bodyAsymmetry)}`
    : ''
}

CRITICAL: Correlate physical symptoms with vessel data. 
Example: "Your 4.5hr sleep with 65% quality (HealthKit) directly correlates with the brain fog you're experiencing..."
`
    }

    // Cosmic Cycles
    if (cosmicData?.astronomy) {
      const astro = cosmicData.astronomy
      multiSourceContext += `
🌙 COSMIC CYCLES (Current):
- Date: ${astro.date}
- Moon Phase: ${astro.moon_phase}
- Lunar Illumination: ${astro.moon_illumination_percentage}%
- Sunrise: ${astro.sunrise} | Sunset: ${astro.sunset}
- Day Length: ${astro.day_length}
${
  astro.morning
    ? `- Morning Golden Hour: ${astro.morning.golden_hour_begin} - ${astro.morning.golden_hour_end}`
    : ''
}

CRITICAL: Reference lunar cycles for energy work timing.
Example: "With the moon at ${astro.moon_illumination_percentage}% illumination (${astro.moon_phase}), this is optimal for..."
`
    }

    // Astrological Transits
    if (astrologyData) {
      multiSourceContext += `
⭐ ASTROLOGICAL TRANSITS:`

      if (astrologyData.natalChart) {
        multiSourceContext += `
  Natal Chart:
    - Sun: ${astrologyData.natalChart.sun_sign}
    - Moon: ${astrologyData.natalChart.moon_sign}
    - Ascendant: ${astrologyData.natalChart.ascendant}`
      }

      if (
        astrologyData.transits?.major_aspects &&
        astrologyData.transits.major_aspects.length > 0
      ) {
        multiSourceContext += `
  Major Aspects (Active Now):`
        astrologyData.transits.major_aspects.slice(0, 3).forEach((aspect: any) => {
          multiSourceContext += `
    - ${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (orb: ${aspect.orb}°)`
          if (aspect.interpretation) {
            multiSourceContext += `
      → ${aspect.interpretation}`
          }
        })
      }

      if (astrologyData.personalTrading) {
        multiSourceContext += `
  Energy Trading Insights:
    - Overall Rating: ${astrologyData.personalTrading.overall_rating}/10
    - Approach: ${astrologyData.personalTrading.recommended_approach}`

        if (astrologyData.personalTrading.lunar_cycle_influence) {
          multiSourceContext += `
    - Lunar Influence: ${astrologyData.personalTrading.lunar_cycle_influence.trading_advice}`
        }
      }

      multiSourceContext += `

CRITICAL: Correlate transits with physical/energetic leaks.
Example: "Today's Mars-Mercury square creates mental friction that can manifest as tension in your jaw or scattered focus..."
`
    }

    multiSourceContext += `\n=== END MULTI-DIMENSIONAL STATE ===

SYNTHESIS MANDATE:
When the user asks about physical sensations, energy levels, or patterns:
1. Cross-reference their Human Design (does this align with their Type/Authority?)
2. Check HealthKit data (is poor sleep or low activity contributing?)
3. Consider cosmic cycles (is the lunar phase affecting their energy?)
4. Analyze astrological transits (are planetary aspects creating pressure?)
5. Review sovereign logs (have they mentioned this before?)

Your responses must feel like you TRULY see the whole person - body, energy, cosmos, and history.
Do NOT list all data sources. Weave them naturally into your guidance.
`

    if (userProgress) {
      const { complianceStreak, lastCompletedDate, totalCompletions } = userProgress

      // Calculate days since last completion
      let daysSinceLastCompletion = -1
      if (lastCompletedDate) {
        const today = new Date()
        const lastDate = new Date(lastCompletedDate)
        const diffTime = Math.abs(today.getTime() - lastDate.getTime())
        daysSinceLastCompletion = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      contextualPrompt += `

📊 ROUTINE PROGRESS:
- Compliance Streak: ${complianceStreak} days
- Total Routines Completed: ${totalCompletions}
- Last Routine Completed: ${lastCompletedDate || 'Never'}
- Days Since Last Completion: ${daysSinceLastCompletion === -1 ? 'Never completed' : daysSinceLastCompletion}

PERSONALIZATION INSTRUCTIONS:
- Reference their streak and progress naturally in your responses
- Celebrate milestones (7 days, 14 days, 30 days, etc.)
- If streak is broken (daysSinceLastCompletion > 1), gently encourage without judgment
- Build on their consistency to offer deeper guidance
- For beginners (totalCompletions < 7), provide foundational explanations
- For experienced users (totalCompletions >= 30), offer advanced insights
`
    }

    // Prepend multi-source context first (highest priority)
    if (multiSourceContext && multiSourceContext.length > 100) {
      contextualPrompt = contextualPrompt + multiSourceContext
      console.log('[Chat API] ✅ Multi-source synthesis active (HD + Health + Cosmos + Astrology)')
    }

    // Then add RAG context (sovereign logs)
    if (ragContext) {
      contextualPrompt = contextualPrompt + ragContext
      console.log('[Chat API] ✅ RAG context active (semantic search)')
    }

    // Add recent conversation history for continuity
    if (recentHistory && recentHistory.length > 0) {
      contextualPrompt += `

RECENT CONVERSATION HISTORY (for context):
${recentHistory
  .map(
    (entry: any, idx: number) => `[${idx + 1}] User: ${entry.userMessage}\nAI: ${entry.aiResponse}`
  )
  .join('\n\n')}

Use this history to provide continuity - reference previous topics naturally and build on earlier discussions.
`
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Build the conversation history
    const chatHistory =
      history
        ?.filter((msg: any) => msg.role !== 'system')
        .map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })) || []

    // Start a chat session with the system prompt and history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Please embody the following persona and knowledge base:\n\n' + contextualPrompt,
            },
          ],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'I understand. I am now embodying the Peak Somatic Guide with complete integration of biomechanical, energetic, and metaphysical wisdom. I am ready to provide precise, authoritative guidance tailored to a 26-year-old African male correcting anterior pelvic tilt. How may I assist you today?',
            },
          ],
        },
        ...chatHistory,
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    })

    // Send the new message
    const result = await chat.sendMessage(message)
    const response = result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    )
  }
}

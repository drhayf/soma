/**
 * Vector Upsert API Route
 * Embeds content using Hugging Face and stores in Supabase pgvector
 * POST /api/vector/upsert
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from 'app/lib/embeddings'
import { upsertEmbedding } from '../../../../lib/supabase'

export const runtime = 'edge' // Use edge runtime for better performance

interface UpsertRequest {
  content: string
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.HF_API_KEY) {
      return NextResponse.json({ error: 'HF_API_KEY not configured' }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body: UpsertRequest = await request.json()
    const { content, metadata = {} } = body

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Add timestamp to metadata if not present
    const enrichedMetadata = {
      ...metadata,
      timestamp: metadata.timestamp || new Date().toISOString(),
    }

    // Step 1: Generate embedding using Hugging Face
    console.log('[Vector Upsert] Generating embedding for content length:', content.length)

    const embeddingResult = await generateEmbedding(content, process.env.HF_API_KEY)

    // Handle embedding errors
    if ('error' in embeddingResult) {
      console.error('[Vector Upsert] Embedding error:', embeddingResult)

      // Handle rate limiting with retry-after header
      if (embeddingResult.retryAfter) {
        return NextResponse.json(
          {
            error: embeddingResult.error,
            details: embeddingResult.details,
            retryAfter: embeddingResult.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': embeddingResult.retryAfter.toString(),
            },
          }
        )
      }

      return NextResponse.json(
        {
          error: embeddingResult.error,
          details: embeddingResult.details,
        },
        { status: 500 }
      )
    }

    // Step 2: Upsert to Supabase pgvector
    console.log('[Vector Upsert] Upserting to Supabase with metadata:', enrichedMetadata)

    const upsertResult = await upsertEmbedding(content, embeddingResult.embedding, enrichedMetadata)

    // Handle upsert errors
    if ('error' in upsertResult) {
      console.error('[Vector Upsert] Supabase error:', upsertResult)
      return NextResponse.json({ error: upsertResult.error }, { status: 500 })
    }

    // Success response
    console.log('[Vector Upsert] Success! ID:', upsertResult.id)

    return NextResponse.json({
      success: true,
      id: upsertResult.id,
      model: embeddingResult.model,
      dimensions: embeddingResult.dimensions,
      contentLength: content.length,
      metadata: enrichedMetadata,
    })
  } catch (error: any) {
    console.error('[Vector Upsert] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/vector/upsert',
    methods: ['POST'],
    description: 'Embeds content using Hugging Face and stores in Supabase pgvector',
    requiredEnv: ['HF_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    configured: {
      hfApiKey: !!process.env.HF_API_KEY,
      supabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  })
}

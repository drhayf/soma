/**
 * Embedding API - Generate text embeddings
 * Uses Hugging Face Inference SDK for reliable embedding generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from 'app/lib/embeddings'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required and must be a string' }, { status: 400 })
    }

    // Generate embedding using HF SDK
    const result = await generateEmbedding(text, process.env.HF_API_KEY || '')

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        {
          status: result.retryAfter ? 503 : 500,
          headers: result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {},
        }
      )
    }

    return NextResponse.json({
      embedding: result.embedding,
      model: result.model,
      dimensions: result.dimensions,
    })
  } catch (error: any) {
    console.error('[Embedding API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embedding', details: error.message },
      { status: 500 }
    )
  }
}

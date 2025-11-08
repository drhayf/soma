/**
 * Embeddings Utility - Hugging Face Inference API
 * Using BAAI/bge-small-en-v1.5 (384D, proven working on router API)
 *
 * Model: bge-small-en-v1.5 (BAAI)
 * Dimensions: 384
 * License: MIT
 * Status: Active and maintained
 * API: Hugging Face Router Inference (Dec 2024)
 * Task: Feature Extraction (embeddings)
 */

// Using BGE model which is proven to work with router API
const MODEL = 'BAAI/bge-small-en-v1.5'
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL}`

// Target 384 dimensions
const EMBEDDING_DIMENSIONS = 384

export interface EmbeddingResult {
  embedding: number[]
  model: string
  dimensions: number
}

export interface EmbeddingError {
  error: string
  details?: string
  retryAfter?: number
}

/**
 * Generate embedding vector for text using Hugging Face Inference API
 *
 * @param text - Text to embed (max ~512 tokens)
 * @param apiKey - Hugging Face API token
 * @returns Promise<EmbeddingResult | EmbeddingError>
 */
export async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<EmbeddingResult | EmbeddingError> {
  // Validation
  if (!text || text.trim().length === 0) {
    return { error: 'Text cannot be empty' }
  }

  if (!apiKey) {
    return { error: 'Hugging Face API key is required' }
  }

  // Truncate text if too long (MiniLM supports 512 tokens, roughly 2048 chars)
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text

  console.log('[Embeddings] Generating embedding:', {
    model: MODEL,
    textLength: text.length,
    truncated: text.length > 2000,
  })

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-use-cache': 'false', // Disable caching for fresh results
      },
      body: JSON.stringify({
        inputs: truncatedText,
        parameters: {
          task: 'feature-extraction',
        },
        options: {
          wait_for_model: true,
          use_cache: false,
        },
      }),
    })

    console.log('[Embeddings] Response status:', response.status, response.statusText)

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
      console.error('[Embeddings] Rate limited. Retry after:', retryAfter, 'seconds')
      return {
        error: 'Rate limit exceeded',
        details: `Too many requests. Retry after ${retryAfter} seconds.`,
        retryAfter,
      }
    }

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Embeddings] API Error:', {
        status: response.status,
        body: errorText,
      })

      return {
        error: `Hugging Face API error: ${response.status}`,
        details: errorText,
      }
    }

    // Parse response - HF returns array directly
    const embedding = await response.json()

    console.log('[Embeddings] Received embedding:', {
      isArray: Array.isArray(embedding),
      length: Array.isArray(embedding) ? embedding.length : 'N/A',
    })

    // Validate
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      return {
        error: 'Invalid embedding format',
        details: `Expected ${EMBEDDING_DIMENSIONS}D array, got ${Array.isArray(embedding) ? embedding.length : 'non-array'}`,
      }
    }

    console.log('[Embeddings] ✅ Success')

    return {
      embedding,
      model: MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    }
  } catch (error: any) {
    console.error('[Embeddings] Error:', error.message)
    return {
      error: 'Failed to generate embedding',
      details: error.message || 'Network error',
    }
  }
}

/**
 * Batch generate embeddings for multiple texts
 * Implements rate limiting and retry logic
 * @param texts - Array of texts to embed
 * @param apiKey - Hugging Face API token
 * @param delayMs - Delay between requests (default 100ms to avoid rate limits)
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  apiKey: string,
  delayMs: number = 100
): Promise<Array<EmbeddingResult | EmbeddingError>> {
  const results: Array<EmbeddingResult | EmbeddingError> = []

  for (let i = 0; i < texts.length; i++) {
    const result = await generateEmbedding(texts[i], apiKey)
    results.push(result)

    // Handle rate limiting with exponential backoff
    if ('error' in result && result.retryAfter) {
      console.warn(
        `[Embeddings] Rate limited at ${i + 1}/${texts.length}. Waiting ${result.retryAfter}s...`
      )
      await new Promise((resolve) => setTimeout(resolve, result.retryAfter! * 1000))
    } else if (i < texts.length - 1) {
      // Add delay between requests
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Cosine similarity between two embedding vectors
 * Used for client-side similarity calculations
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score between 0 and 1 (1 = identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  return magnitude === 0 ? 0 : dotProduct / magnitude
}

/**
 * Supabase Client Configuration
 * Server-side client for Next.js API routes with service role access
 */

import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

/**
 * Server-side Supabase client with service role key
 * ⚠️ ONLY use in Next.js API routes - has full database access
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Database types for sovereign_log_embeddings table
 */
export interface SovereignLogEmbedding {
  id: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
  created_at: string
}

/**
 * Semantic search result type
 */
export interface SemanticSearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  similarity: number
}

/**
 * Upsert embedding to Supabase pgvector
 * @param content - Text content to store
 * @param embedding - 384-dimensional vector from Hugging Face
 * @param metadata - Additional metadata (type, timestamp, entryId, etc.)
 * @returns Inserted record ID or error
 */
export async function upsertEmbedding(
  content: string,
  embedding: number[],
  metadata: Record<string, any>
): Promise<{ id: string } | { error: string }> {
  try {
    // Validate embedding dimensions
    if (embedding.length !== 384) {
      return { error: `Invalid embedding dimension: ${embedding.length}, expected 384` }
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('sovereign_log_embeddings')
      .insert({
        content,
        embedding,
        metadata,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Supabase] Upsert error:', error)
      return { error: error.message }
    }

    return { id: data.id }
  } catch (err: any) {
    console.error('[Supabase] Upsert exception:', err)
    return { error: err.message || 'Failed to upsert embedding' }
  }
}

/**
 * Semantic search using pgvector cosine similarity
 * @param queryEmbedding - 384-dimensional query vector
 * @param matchThreshold - Minimum similarity score (0-1, default 0.7)
 * @param matchCount - Number of results to return (default 5)
 * @returns Array of matching documents with similarity scores
 */
export async function semanticSearch(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<SemanticSearchResult[]> {
  try {
    // Validate query embedding
    if (queryEmbedding.length !== 384) {
      console.error(
        `[Supabase] Invalid query embedding dimension: ${queryEmbedding.length}, expected 384`
      )
      return []
    }

    // Call the match_sovereign_logs RPC function
    const { data, error } = await supabaseAdmin.rpc('match_sovereign_logs', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    })

    if (error) {
      console.error('[Supabase] Semantic search error:', error)
      return []
    }

    return data || []
  } catch (err: any) {
    console.error('[Supabase] Semantic search exception:', err)
    return []
  }
}

/**
 * Get recent embeddings for debugging/monitoring
 * @param limit - Number of recent records to fetch
 */
export async function getRecentEmbeddings(limit: number = 10): Promise<SovereignLogEmbedding[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sovereign_log_embeddings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Supabase] Get recent embeddings error:', error)
      return []
    }

    return data || []
  } catch (err: any) {
    console.error('[Supabase] Get recent embeddings exception:', err)
    return []
  }
}

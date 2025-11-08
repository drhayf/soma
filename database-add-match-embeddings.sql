-- ============================================================
-- ADD match_embeddings() RPC Function
-- Universal semantic search for vector_embeddings table
-- ============================================================
-- Run this in Supabase SQL Editor if match_embeddings is missing

-- Drop existing function if any
DROP FUNCTION IF EXISTS public.match_embeddings(vector(384), uuid, float, int);
DROP FUNCTION IF EXISTS public.match_embeddings(vector(384), float, int);

-- Create function (uses SECURITY INVOKER to respect RLS policies)
CREATE OR REPLACE FUNCTION public.match_embeddings(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vector_embeddings.id,
    vector_embeddings.user_id,
    vector_embeddings.content,
    1 - (vector_embeddings.embedding <=> query_embedding) AS similarity,
    vector_embeddings.metadata
  FROM vector_embeddings
  WHERE 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
    AND vector_embeddings.user_id = auth.uid()
  ORDER BY vector_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Verify function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'match_embeddings';

-- Expected result: 1 row showing match_embeddings | FUNCTION

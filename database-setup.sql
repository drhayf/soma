-- ============================================================
-- Somatic Alignment - Supabase Database Setup
-- 384D Vector Embeddings (BAAI BGE-small-en-v1.5)
-- Best available on free HF Inference API
-- ============================================================

-- ============================================================
-- STEP 1: CLEAN SLATE - Drop everything first
-- ============================================================

-- Drop tables first (CASCADE will drop all dependent objects: policies, indexes, foreign keys)
DROP TABLE IF EXISTS public.sovereign_log_embeddings CASCADE;
DROP TABLE IF EXISTS public.sovereign_logs CASCADE;

-- Drop RPC functions (both old and new versions)
DROP FUNCTION IF EXISTS match_sovereign_logs(vector, float, int, uuid);
DROP FUNCTION IF EXISTS match_sovereign_logs(vector(384), float, int, uuid);
DROP FUNCTION IF EXISTS public.match_sovereign_logs(vector(384), float, int);
DROP FUNCTION IF EXISTS public.match_sovereign_logs_simple(vector(384), float, int);

-- ============================================================
-- STEP 2: Enable pgvector extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- ============================================================
-- STEP 3: Create Tables
-- ============================================================

-- Main sovereign logs table (user-scoped with RLS)
CREATE TABLE public.sovereign_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings table (384D vectors from BGE-small-en-v1.5)
-- Linked to sovereign_logs for proper user isolation
CREATE TABLE public.sovereign_log_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.sovereign_logs(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Denormalized for standalone search
  embedding vector(384) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 4: Create Indexes
-- ============================================================

-- Indexes for sovereign_logs
CREATE INDEX idx_sovereign_logs_user_id 
  ON public.sovereign_logs(user_id);

CREATE INDEX idx_sovereign_logs_category 
  ON public.sovereign_logs(category);

CREATE INDEX idx_sovereign_logs_created_at 
  ON public.sovereign_logs(created_at DESC);

-- Indexes for sovereign_log_embeddings
CREATE INDEX idx_sovereign_log_embeddings_log_id 
  ON public.sovereign_log_embeddings(log_id);

-- CRITICAL: Vector similarity indexes
-- IVFFlat for fast approximate search (good for 1K-100K vectors)
CREATE INDEX idx_sovereign_log_embeddings_vector_ivfflat
  ON public.sovereign_log_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- HNSW for faster search (better recall, recommended by Supabase)
CREATE INDEX idx_sovereign_log_embeddings_vector_hnsw
  ON public.sovereign_log_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- STEP 5: Enable RLS & Create Policies
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE public.sovereign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sovereign_log_embeddings ENABLE ROW LEVEL SECURITY;

-- sovereign_logs policies
CREATE POLICY "Users can view their own logs"
ON public.sovereign_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
ON public.sovereign_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
ON public.sovereign_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
ON public.sovereign_logs FOR DELETE
USING (auth.uid() = user_id);

-- sovereign_log_embeddings policies
CREATE POLICY "Users can view their own embeddings"
ON public.sovereign_log_embeddings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sovereign_logs 
    WHERE sovereign_logs.id = sovereign_log_embeddings.log_id 
    AND sovereign_logs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own embeddings"
ON public.sovereign_log_embeddings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sovereign_logs 
    WHERE sovereign_logs.id = sovereign_log_embeddings.log_id 
    AND sovereign_logs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own embeddings"
ON public.sovereign_log_embeddings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sovereign_logs 
    WHERE sovereign_logs.id = sovereign_log_embeddings.log_id 
    AND sovereign_logs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own embeddings"
ON public.sovereign_log_embeddings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sovereign_logs 
    WHERE sovereign_logs.id = sovereign_log_embeddings.log_id 
    AND sovereign_logs.user_id = auth.uid()
  )
);

-- ============================================================
-- STEP 6: Create RPC Functions
-- Semantic similarity search using pgvector (384D)
-- ============================================================

-- Function 1: User-scoped search (for app with auth.uid())
CREATE OR REPLACE FUNCTION match_sovereign_logs(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  log_id uuid,
  content text,
  category text,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.log_id,
    e.content,
    l.category,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.metadata,
    e.created_at
  FROM sovereign_log_embeddings e
  JOIN sovereign_logs l ON e.log_id = l.id
  WHERE 
    (filter_user_id IS NULL OR l.user_id = filter_user_id)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function 2: Standalone embeddings search (for direct public.sovereign_log_embeddings queries)
-- This version works with the denormalized content/metadata in embeddings table
CREATE OR REPLACE FUNCTION public.match_sovereign_logs_simple(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.sovereign_log_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- ============================================================
-- STEP 7: Verification Queries
-- Run these to confirm setup is complete
-- ============================================================

-- Check pgvector extension
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'vector';

-- Check tables exist
SELECT tablename, schemaname 
FROM pg_tables 
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings')
AND schemaname = 'public';

-- Check indexes (should see both IVFFlat and HNSW)
SELECT 
  tablename, 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings')
AND schemaname = 'public';

-- Check policies exist (should see 8 total: 4 per table)
SELECT 
  tablename,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings')
ORDER BY tablename, policyname;

-- Check functions exist (should see both match_sovereign_logs functions)
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE 'match_sovereign_logs%'
ORDER BY routine_name;

-- Check if pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sovereign_logs', 'sovereign_log_embeddings');

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings');

-- Check RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings');

-- Check RPC function
SELECT proname, pronargs FROM pg_proc 
WHERE proname = 'match_sovereign_logs';

-- ============================================================
-- Sample Data (Optional - for testing)
-- ============================================================

-- Insert a test log (replace YOUR_USER_ID with actual auth.users.id)
/*
INSERT INTO sovereign_logs (user_id, content, category, metadata)
VALUES (
  'YOUR_USER_ID',
  'I felt deep resistance in my jaw during morning meditation. It released after 10 minutes of breathing.',
  'Physical',
  '{"duration_minutes": 10, "intensity": "medium"}'::jsonb
);

-- Insert a test embedding (requires actual 384D vector)
-- You would generate this via the generateEmbedding() function
INSERT INTO sovereign_log_embeddings (log_id, content, embedding, model)
VALUES (
  (SELECT id FROM sovereign_logs ORDER BY created_at DESC LIMIT 1),
  'I felt deep resistance in my jaw during morning meditation. It released after 10 minutes of breathing.',
  '[0.1, 0.2, ...]'::vector(384), -- Replace with actual 384D embedding
  'BAAI/bge-small-en-v1.5'
);
*/

-- ============================================================
-- SETUP COMPLETE ✅
-- ============================================================
-- 
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify with the verification queries above
-- 3. Test with: yarn test:supabase
-- 4. Start adding sovereign logs via the app!
--
-- ============================================================

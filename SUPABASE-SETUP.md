# Supabase Database Setup Guide

## Overview

This guide will help you set up the Supabase database for Somatic Alignment's RAG (Retrieval-Augmented Generation) system.

## Prerequisites

- Supabase project created at https://supabase.com
- Project URL and API keys saved in `apps/next/.env`
- Access to Supabase SQL Editor

## Quick Setup (5 minutes)

### Step 1: Access SQL Editor

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Database Setup

Copy the entire contents of `database-setup.sql` and paste into the SQL Editor, then click **Run**.

This will:

- ✅ Enable pgvector extension
- ✅ Create `sovereign_logs` table
- ✅ Create `sovereign_log_embeddings` table with 384D vectors
- ✅ Set up indexes for fast similarity search
- ✅ Configure Row Level Security (RLS) policies
- ✅ Create `match_sovereign_logs()` RPC function

### Step 3: Verify Setup

Run these verification queries in SQL Editor:

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Expected: 1 row showing vector extension

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sovereign_logs', 'sovereign_log_embeddings');
-- Expected: 2 rows

-- Check vector index
SELECT indexname FROM pg_indexes
WHERE indexname = 'idx_sovereign_log_embeddings_vector';
-- Expected: 1 row

-- Check RPC function
SELECT proname FROM pg_proc WHERE proname = 'match_sovereign_logs';
-- Expected: 1 row
```

### Step 4: Test Integration

Run the integration test from your local machine:

```bash
yarn test:supabase
```

Expected output:

```
✅ Embedding generated successfully
✅ Supabase connected successfully
✅ Sovereign log inserted
✅ Embedding stored successfully
✅ Similarity search successful
🎉 ALL TESTS PASSED!
```

## Database Schema

### Table: sovereign_logs

Stores user's sovereign log entries.

| Column     | Type        | Description               |
| ---------- | ----------- | ------------------------- |
| id         | UUID        | Primary key               |
| user_id    | UUID        | References auth.users(id) |
| content    | TEXT        | Log content               |
| category   | TEXT        | Physical/Emotional/etc    |
| metadata   | JSONB       | Additional metadata       |
| created_at | TIMESTAMPTZ | Creation timestamp        |
| updated_at | TIMESTAMPTZ | Last update timestamp     |

### Table: sovereign_log_embeddings

Stores 384D vector embeddings for semantic search.

| Column     | Type        | Description                         |
| ---------- | ----------- | ----------------------------------- |
| id         | UUID        | Primary key                         |
| log_id     | UUID        | References sovereign_logs(id)       |
| content    | TEXT        | Denormalized content for speed      |
| embedding  | vector(384) | 384-dimensional embedding vector    |
| model      | TEXT        | Model used (BAAI/bge-small-en-v1.5) |
| metadata   | JSONB       | Additional metadata                 |
| created_at | TIMESTAMPTZ | Creation timestamp                  |
| updated_at | TIMESTAMPTZ | Last update timestamp               |

### RPC Function: match_sovereign_logs

Performs semantic similarity search using pgvector.

**Parameters:**

- `query_embedding` (vector(384)): The embedding to search for
- `match_threshold` (float, default 0.5): Minimum similarity score (0-1)
- `match_count` (int, default 10): Maximum results to return
- `filter_user_id` (uuid, optional): Filter by user

**Returns:**

- `id`: Embedding ID
- `log_id`: Sovereign log ID
- `content`: Log content
- `category`: Log category
- `similarity`: Similarity score (0-1, higher is better)
- `metadata`: Additional metadata
- `created_at`: Timestamp

## Embedding Model

**Current Model:** `BAAI/bge-small-en-v1.5`

- **Dimensions:** 384
- **License:** MIT
- **Performance:** 62.17 MTEB average (SOTA for 384D)
- **Context:** 512 tokens
- **Why:** Best-in-class for 384D embeddings, +3% better than MiniLM

## Security (RLS Policies)

Row Level Security ensures users can only access their own data:

- ✅ Users can only SELECT their own logs and embeddings
- ✅ Users can only INSERT/UPDATE/DELETE their own data
- ✅ All queries automatically filtered by `auth.uid()`

## Performance

### Vector Index (IVFFlat)

The `idx_sovereign_log_embeddings_vector` index enables fast similarity search:

- **Algorithm:** IVFFlat (Inverted File Flat)
- **Lists:** 100 (optimal for 1K-100K vectors)
- **Distance:** Cosine similarity (`vector_cosine_ops`)
- **Speed:** ~1-5ms for similarity search on 10K vectors

### Recommended Index Tuning

| Vector Count | Lists | Probes |
| ------------ | ----- | ------ |
| 1K - 10K     | 100   | 10     |
| 10K - 100K   | 100   | 20     |
| 100K - 1M    | 500   | 50     |

Update lists count if you exceed 100K vectors:

```sql
DROP INDEX idx_sovereign_log_embeddings_vector;
CREATE INDEX idx_sovereign_log_embeddings_vector
ON sovereign_log_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 500);
```

## Troubleshooting

### "extension vector does not exist"

Solution: Run `CREATE EXTENSION vector;` in SQL Editor

### "Could not find the table 'public.sovereign_logs'"

Solution: Run the entire `database-setup.sql` script

### "relation sovereign_log_embeddings does not exist"

Solution: Ensure both tables are created, check with:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

### Slow similarity searches

Solution: Check if vector index exists:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'sovereign_log_embeddings';
```

If missing, recreate with the CREATE INDEX command from setup script.

### RLS policy errors

Solution: Verify policies exist:

```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('sovereign_logs', 'sovereign_log_embeddings');
```

## Next Steps

After database setup:

1. ✅ Run `yarn test:supabase` to verify everything works
2. 📝 Start adding sovereign logs via the app
3. 💬 Test AI chat to see RAG in action
4. 📊 Monitor performance in Supabase dashboard
5. 🚀 Deploy to production when ready

## Upgrade Path to 768D (Future)

When you're ready for better performance:

1. Follow `NOMIC-768D-UPGRADE-GUIDE.md`
2. Migrate to Nomic embeddings (768D)
3. Re-vectorize existing logs
4. Update schema and code

Benefits: +10% retrieval accuracy, better semantic understanding

## Support

- 📖 Supabase Docs: https://supabase.com/docs
- 🤖 HF Inference: https://huggingface.co/docs/inference-api
- 🔍 pgvector: https://github.com/pgvector/pgvector

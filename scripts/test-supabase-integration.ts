#!/usr/bin/env tsx
/**
 * Supabase + Embeddings Integration Test
 * Tests the complete RAG pipeline: Generate embedding → Store in Supabase → Retrieve via similarity search
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../packages/app/lib/embeddings'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from apps/next/.env
dotenv.config({ path: path.join(__dirname, '../apps/next/.env') })

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const HF_API_KEY = process.env.HF_API_KEY

console.log('\n🧪 Supabase + Embeddings Integration Test\n')
console.log('='.repeat(60))

// Validation
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment')
  process.exit(1)
}

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

if (!HF_API_KEY) {
  console.error('❌ HF_API_KEY not found in environment')
  process.exit(1)
}

console.log('✅ Environment variables loaded')
console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
console.log(`🔑 Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...`)
console.log(`🤗 HF API Key: ${HF_API_KEY.substring(0, 20)}...`)
console.log('='.repeat(60))

async function testEmbeddingGeneration() {
  console.log('\n📝 Step 1: Generate Test Embedding')
  console.log('-'.repeat(60))

  const testText = 'I felt resistance in my jaw during morning meditation'
  console.log(`Input text: "${testText}"`)

  const result = await generateEmbedding(testText, HF_API_KEY)

  if ('error' in result) {
    console.error('❌ Embedding generation failed:', result.error)
    console.error('Details:', result.details)
    return null
  }

  console.log('✅ Embedding generated successfully')
  console.log(`Model: ${result.model}`)
  console.log(`Dimensions: ${result.dimensions}`)
  console.log(
    `First 5 values: [${result.embedding
      .slice(0, 5)
      .map((n) => n.toFixed(4))
      .join(', ')}...]`
  )

  return result.embedding
}

async function testSupabaseConnection() {
  console.log('\n🔗 Step 2: Test Supabase Connection')
  console.log('-'.repeat(60))

  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

  // Test basic query
  const { data, error } = await supabase.from('sovereign_logs').select('id, created_at').limit(1)

  if (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return null
  }

  console.log('✅ Supabase connected successfully')
  console.log(`Found ${data?.length || 0} log(s) in database`)

  return supabase
}

async function testVectorStorage(supabase: any, embedding: number[]) {
  console.log('\n💾 Step 3: Test Vector Storage')
  console.log('-'.repeat(60))

  // Try to find or create test user
  let userId: string | null = null

  // First, try to find existing user
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const testUser = existingUsers?.users?.find(
    (u: any) => u.email === 'test@somatic-alignment.local'
  )

  if (testUser) {
    console.log('✅ Using existing test user:', testUser.id)
    userId = testUser.id
  } else {
    // Create new test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@somatic-alignment.local',
      password: 'test-password-12345',
      email_confirm: true,
    })

    if (authError) {
      console.error('❌ Failed to create test user:', authError.message)
      return null
    }

    console.log('✅ Test user created:', authData.user.id)
    userId = authData.user.id
  }

  if (!userId) {
    console.error('❌ Could not create or find test user')
    return null
  }

  const testLog = {
    user_id: userId,
    content: 'Test sovereign log - jaw resistance during meditation',
    category: 'Physical',
    metadata: { test: true, timestamp: new Date().toISOString() },
  }

  // Insert sovereign log (service role bypasses RLS)
  const { data: logData, error: logError } = await supabase
    .from('sovereign_logs')
    .insert(testLog)
    .select()
    .single()

  if (logError) {
    console.error('❌ Failed to insert sovereign log:', logError.message)
    console.error('Details:', logError)
    return null
  }

  console.log('✅ Sovereign log inserted:', logData.id)

  // Insert embedding
  const { data: embeddingData, error: embeddingError } = await supabase
    .from('sovereign_log_embeddings')
    .insert({
      log_id: logData.id,
      content: testLog.content,
      embedding,
      metadata: testLog.metadata,
    })
    .select()
    .single()

  if (embeddingError) {
    console.error('❌ Failed to insert embedding:', embeddingError.message)
    console.error('Details:', embeddingError)
    return null
  }

  console.log('✅ Embedding stored successfully:', embeddingData.id)

  return { logId: logData.id, embeddingId: embeddingData.id }
}

async function testSimilaritySearch(supabase: any, queryEmbedding: number[]) {
  console.log('\n🔍 Step 4: Test Similarity Search')
  console.log('-'.repeat(60))

  // Check if RPC function exists
  const { data, error } = await supabase.rpc('match_sovereign_logs', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5,
  })

  if (error) {
    console.error('❌ Similarity search failed:', error.message)
    console.error('This might mean the match_sovereign_logs RPC function is not created')
    return null
  }

  console.log('✅ Similarity search successful')
  console.log(`Found ${data.length} similar logs`)

  data.forEach((log: any, i: number) => {
    console.log(`\n${i + 1}. ${log.content}`)
    console.log(`   Similarity: ${(log.similarity * 100).toFixed(1)}%`)
    console.log(`   ID: ${log.id}`)
  })

  return data
}

async function cleanup(supabase: any, ids: any) {
  console.log('\n🧹 Step 5: Cleanup Test Data')
  console.log('-'.repeat(60))

  if (!ids) {
    console.log('⏭️  No test data to cleanup')
    return
  }

  // Delete embedding
  const { error: embError } = await supabase
    .from('sovereign_log_embeddings')
    .delete()
    .eq('id', ids.embeddingId)

  if (embError) {
    console.error('⚠️  Failed to delete test embedding:', embError.message)
  } else {
    console.log('✅ Test embedding deleted')
  }

  // Delete log
  const { error: logError } = await supabase.from('sovereign_logs').delete().eq('id', ids.logId)

  if (logError) {
    console.error('⚠️  Failed to delete test log:', logError.message)
  } else {
    console.log('✅ Test log deleted')
  }
}

async function runTests() {
  try {
    // Step 1: Generate embedding
    const embedding = await testEmbeddingGeneration()
    if (!embedding) {
      console.error('\n❌ TEST FAILED: Could not generate embedding')
      process.exit(1)
    }

    // Step 2: Connect to Supabase
    const supabase = await testSupabaseConnection()
    if (!supabase) {
      console.error('\n❌ TEST FAILED: Could not connect to Supabase')
      process.exit(1)
    }

    // Step 3: Store vector
    const ids = await testVectorStorage(supabase, embedding)
    if (!ids) {
      console.error('\n❌ TEST FAILED: Could not store vector in Supabase')
      process.exit(1)
    }

    // Step 4: Search vectors
    const results = await testSimilaritySearch(supabase, embedding)
    if (!results) {
      console.error('\n❌ TEST FAILED: Similarity search failed')
      console.log('\n💡 You may need to create the match_sovereign_logs RPC function in Supabase')
      await cleanup(supabase, ids)
      process.exit(1)
    }

    // Step 5: Cleanup
    await cleanup(supabase, ids)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log('='.repeat(60))
    console.log('\n✅ Embedding generation: Working')
    console.log('✅ Supabase connection: Working')
    console.log('✅ Vector storage: Working')
    console.log('✅ Similarity search: Working')
    console.log('\n🚀 Your RAG pipeline is fully operational!\n')
  } catch (error: any) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runTests()

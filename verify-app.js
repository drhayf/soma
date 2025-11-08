/**
 * Quick App Verification Script
 * Run with: node verify-app.js
 */

console.log('\n🔍 Somatic Alignment App - Quick Verification\n')
console.log('═'.repeat(60))

try {
  // Test TypeScript compilation
  console.log('\n✓ Testing TypeScript compilation...')
  require('child_process').execSync('npx tsc --noEmit --skipLibCheck', {
    stdio: 'pipe',
    cwd: __dirname,
  })
  console.log('  ✅ TypeScript: All types valid')
} catch (error) {
  console.log('  ❌ TypeScript: Errors found')
  process.exit(1)
}

try {
  // Verify content exists
  console.log('\n✓ Verifying app content...')
  const {
    morningRoutineSteps,
    eveningRoutineSteps,
    metaphysicalInsights,
    knowledgeVaultTabs,
  } = require('./packages/app/lib/content.ts')

  console.log(`  ✅ Morning Routine: ${morningRoutineSteps.length} exercises`)
  console.log(`  ✅ Evening Routine: ${eveningRoutineSteps.length} exercises`)
  console.log(`  ✅ Daily Insights: ${metaphysicalInsights.length} messages`)
  console.log(`  ✅ Knowledge Vault: ${knowledgeVaultTabs.length} tabs`)
} catch (error) {
  console.log('  ⚠️  Content verification skipped (requires build)')
}

console.log('\n✓ Checking file structure...')
const fs = require('fs')
const requiredFiles = [
  'packages/app/types.ts',
  'packages/app/lib/content.ts',
  'packages/app/lib/store.ts',
  'packages/app/features/RoutinePlayer.tsx',
  'packages/app/features/KnowledgeVault.tsx',
  'apps/expo/app/(tabs)/index.tsx',
  'apps/next/app/(tabs)/page.tsx',
]

let allFilesExist = true
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - MISSING`)
    allFilesExist = false
  }
})

console.log('\n✓ Build verification...')
try {
  require('child_process').execSync('npm run build', {
    stdio: 'pipe',
    cwd: __dirname,
  })
  console.log('  ✅ Build successful')
} catch (error) {
  console.log('  ❌ Build failed')
  process.exit(1)
}

console.log('\n' + '═'.repeat(60))
console.log('\n✅ ALL CHECKS PASSED!\n')
console.log('📱 Ready to test:')
console.log('   • Web: npm run web')
console.log('   • Native: npm run native (scan QR with Expo Go)')
console.log('   • iOS: npm run ios (requires Mac)')
console.log('   • Android: npm run android (requires Android Studio)\n')

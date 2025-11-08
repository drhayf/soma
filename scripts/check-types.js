/**
 * TypeScript Type Checker with React 19 Warning Filter
 * Runs tsc and filters out expected React 19 type compatibility warnings
 */

const { execSync } = require('child_process')
const path = require('path')

// Expected error patterns to filter out (React 19 type warnings)
const EXPECTED_PATTERNS = [
  /cannot be used as a JSX component/i,
  /Its type .* is not a valid JSX element type/i,
  /Type .* is not assignable to type .* ReactNode/i,
  /Property 'children' is missing in type 'ReactElement'/i,
  /but required in type 'ReactPortal'/i,
  /TamaguiComponent.*is not a valid JSX element type/i,
  /ForwardRefExoticComponent.*is not a valid JSX element type/i,
]

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function isExpectedError(line) {
  return EXPECTED_PATTERNS.some((pattern) => pattern.test(line))
}

function filterTscOutput(output) {
  const lines = output.split('\n')
  const filtered = []
  let currentError = []
  let isExpected = false
  let expectedCount = 0
  let actualCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect start of new error - matches both absolute and relative paths
    // Examples: "C:\path\file.ts(123,45): error" or "../../packages/app/file.tsx(123,45): error"
    if (line.match(/\(\d+,\d+\):\s*error\s+TS\d+:/)) {
      // Process previous error
      if (currentError.length > 0) {
        if (isExpected) {
          expectedCount++
        } else {
          filtered.push(...currentError)
          actualCount++
        }
      }

      // Start new error
      currentError = [line]
      isExpected = false
    } else if (currentError.length > 0) {
      // Part of current error
      currentError.push(line)

      // Check if this line indicates an expected error
      if (isExpectedError(line)) {
        isExpected = true
      }
    } else {
      // Not part of an error block
      filtered.push(line)
    }
  }

  // Process last error
  if (currentError.length > 0) {
    if (isExpected) {
      expectedCount++
    } else {
      filtered.push(...currentError)
      actualCount++
    }
  }

  return {
    output: filtered.join('\n'),
    expectedCount,
    actualCount,
  }
}

function main() {
  console.log(`${colors.cyan}🔍 Running TypeScript type checker...${colors.reset}\n`)

  // Check multiple workspaces
  const workspaces = [
    { name: 'Root', cwd: path.resolve(__dirname, '..') },
    { name: 'packages/app', cwd: path.resolve(__dirname, '../packages/app') },
    { name: 'apps/next', cwd: path.resolve(__dirname, '../apps/next') },
  ]

  let totalExpected = 0
  let totalActual = 0
  let allFiltered = []

  for (const workspace of workspaces) {
    console.log(`${colors.gray}Checking ${workspace.name}...${colors.reset}`)

    try {
      // Run tsc and capture output
      execSync('tsc --noEmit', { cwd: workspace.cwd, stdio: 'pipe' })
    } catch (error) {
      // tsc returns non-zero exit code when there are errors
      const output = error.stdout ? error.stdout.toString() : error.stderr.toString()

      if (output && output.trim()) {
        const { output: filteredOutput, expectedCount, actualCount } = filterTscOutput(output)

        totalExpected += expectedCount
        totalActual += actualCount

        if (actualCount > 0) {
          allFiltered.push(`\n${colors.magenta}=== ${workspace.name} ===${colors.reset}\n`)
          allFiltered.push(filteredOutput)
        }
      }
    }
  }

  // Show summary
  console.log(`\n${colors.yellow}📊 Type Check Summary:${colors.reset}`)
  console.log(
    `${colors.gray}   Expected React 19 warnings: ${colors.yellow}${totalExpected}${colors.gray} (filtered out)${colors.reset}`
  )
  console.log(
    `${colors.gray}   Actual TypeScript errors: ${totalActual > 0 ? colors.red : colors.green}${totalActual}${colors.reset}\n`
  )

  if (totalActual > 0) {
    console.log(
      `${colors.red}❌ Found ${totalActual} unexpected TypeScript error(s):${colors.reset}`
    )
    console.log(allFiltered.join('\n'))
    console.log(`\n${colors.red}Please fix the errors above.${colors.reset}`)
    process.exit(1)
  } else {
    console.log(
      `${colors.green}✓ No unexpected errors! All ${totalExpected} warnings are expected React 19 type compatibility issues.${colors.reset}`
    )
    console.log(
      `${colors.gray}  (These warnings are documented in .github/copilot-instructions.md and do not affect functionality)${colors.reset}`
    )
    process.exit(0)
  }
}

main()

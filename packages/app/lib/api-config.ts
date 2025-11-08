/**
 * Smart API Configuration
 * Automatically detects dev vs production and constructs correct URLs
 * Handles web and native platforms intelligently
 */

import { Platform } from 'react-native'

interface ApiConfig {
  baseUrl: string
  isDevelopment: boolean
  isNative: boolean
  devServerIp: string | null
}

/**
 * Get the Expo dev server IP from the environment
 * This works because Expo injects the dev server URL into the app
 */
function getExpoDevServerIp(): string | null {
  if (Platform.OS === 'web') return null

  try {
    // Method 1: Try Expo Constants (most reliable - always has current IP)
    // @ts-ignore - Expo Constants not in React Native types
    const Constants = require('expo-constants').default

    if (Constants?.expoConfig?.hostUri) {
      // expoConfig.hostUri format: "192.168.1.100:8081"
      const ip = Constants.expoConfig.hostUri.split(':')[0]
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log('[API Config] ✅ Dev server IP from expoConfig.hostUri:', ip)
        return ip
      }
    }

    if (Constants?.manifest?.debuggerHost) {
      // manifest.debuggerHost format: "192.168.1.100:8081"
      const ip = Constants.manifest.debuggerHost.split(':')[0]
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log('[API Config] ✅ Dev server IP from manifest.debuggerHost:', ip)
        return ip
      }
    }

    if (Constants?.manifest2?.extra?.expoGo?.debuggerHost) {
      // Newer Expo SDK format
      const ip = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0]
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log('[API Config] ✅ Dev server IP from manifest2:', ip)
        return ip
      }
    }

    // Method 2: Try to get from window.location (Expo provides this)
    if (typeof window !== 'undefined') {
      const location = (window as any).location
      if (
        location?.hostname &&
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1'
      ) {
        console.log('[API Config] ✅ Dev server IP from window.location:', location.hostname)
        return location.hostname
      }
    }

    console.warn('[API Config] ⚠️  Could not auto-detect dev server IP from Expo Constants')
  } catch (e) {
    console.warn('[API Config] ⚠️  Error detecting Expo dev server IP:', e)
  }

  return null
}

/**
 * Get the API configuration based on environment
 */
export function getApiConfig(): ApiConfig {
  const isNative = Platform.OS !== 'web'
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development'

  let baseUrl = ''

  if (isNative) {
    if (isDevelopment) {
      // Development: Use Expo dev server IP to reach Next.js on same machine
      const devServerIp = getExpoDevServerIp()

      if (devServerIp) {
        baseUrl = `http://${devServerIp}:3000`
        console.log('[API Config] Using dev server IP:', baseUrl)
      } else {
        // Fallback: localhost (works on iOS simulator only)
        baseUrl = 'http://localhost:3000'
        console.warn(
          '[API Config] Could not detect dev server IP. Using localhost (iOS simulator only).'
        )
        console.warn(
          '[API Config] For physical device: Update LOCAL_DEV_IP in app/lib/api-config.ts'
        )
      }
    } else {
      // Production: Use your deployed Vercel domain
      baseUrl = 'https://your-app.vercel.app' // TODO: Update with actual Vercel domain
    }
  } else {
    // Web platform
    if (isDevelopment) {
      // Development: Relative paths work fine
      baseUrl = ''
    } else {
      // Production: Also use relative paths (same domain)
      baseUrl = ''
    }
  }

  return {
    baseUrl,
    isDevelopment,
    isNative,
    devServerIp: isNative && isDevelopment ? getExpoDevServerIp() : null,
  }
}

/**
 * Build a full API URL for the given endpoint
 * @param endpoint - API endpoint (e.g., '/api/attunement')
 * @returns Full URL with correct base for current environment
 */
export function getApiUrl(endpoint: string): string {
  const config = getApiConfig()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const fullUrl = `${config.baseUrl}${cleanEndpoint}`

  // Only log in development for first few calls to avoid spam
  if (config.isDevelopment && Math.random() < 0.1) {
    console.log(`[API Config] ${endpoint} → ${fullUrl || `(relative) ${cleanEndpoint}`}`)
  }

  return fullUrl
}

/**
 * Diagnostic utility - Call this to debug API connectivity issues
 * Prints comprehensive network configuration info
 */
export function diagnoseApiConfig(): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 API CONFIGURATION DIAGNOSTICS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const config = getApiConfig()

  console.log('Platform:', Platform.OS)
  console.log('Environment:', config.isDevelopment ? 'Development' : 'Production')
  console.log('Is Native:', config.isNative)
  console.log('Base URL:', config.baseUrl || '(relative paths)')
  console.log('Dev Server IP (auto-detected):', config.devServerIp || 'N/A')
  console.log('Manual Override (LOCAL_DEV_IP):', LOCAL_DEV_IP || 'None (using auto-detection)')

  if (config.isNative && config.isDevelopment) {
    console.log('')
    console.log('📡 Network Configuration:')

    if (config.devServerIp) {
      console.log(`  ✅ Expo Dev Server: exp://${config.devServerIp}:8081`)
      console.log(`  ✅ Next.js Target: http://${config.devServerIp}:3000`)
      console.log('  ✅ Auto-detection working! IP will update when you switch networks.')
    } else if (LOCAL_DEV_IP) {
      console.log(`  🔧 Using manual IP: ${LOCAL_DEV_IP}`)
      console.log('  ⚠️  Remember to update this when switching networks!')
    } else {
      console.log('  ❌ No IP detected - using localhost fallback')
      console.log('  ❌ This will only work on iOS Simulator')
    }

    console.log('')
    console.log('🧪 Test API Endpoints:')
    console.log('  /api/attunement →', getApiUrl('/api/attunement'))
    console.log('  /api/chat →', getApiUrl('/api/chat'))
    console.log('  /api/cosmos →', getApiUrl('/api/cosmos'))
  } else if (!config.isNative) {
    console.log('')
    console.log('🌐 Web platform - using relative paths (same-origin requests)')
  } else {
    console.log('')
    console.log('🚀 Production mode - using Vercel domain')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Provide actionable troubleshooting
  if (config.isNative && config.isDevelopment && !config.devServerIp && !LOCAL_DEV_IP) {
    console.log('')
    console.log('⚠️  TROUBLESHOOTING STEPS:')
    console.log('1. Restart Expo dev server (yarn start in apps/expo)')
    console.log('2. Check Expo terminal for URL (should show exp://X.X.X.X:8081)')
    console.log('3. Ensure Next.js is running (yarn dev in apps/next)')
    console.log('4. Verify both servers are on same WiFi network')
    console.log('5. Check Windows Firewall allows Node.js on port 3000')
    console.log('6. If all else fails, set LOCAL_DEV_IP to your machine IP')
    console.log('')
  }
}

/**
 * Validate API connectivity with a test ping
 * Useful for debugging network issues
 */
export async function testApiConnectivity(): Promise<{
  success: boolean
  baseUrl: string
  error?: string
  latency?: number
}> {
  const baseUrl = getBaseUrl()
  const startTime = Date.now()

  try {
    // Try to ping a lightweight endpoint (health check)
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const latency = Date.now() - startTime

    if (response.ok) {
      console.log(`[API Config] ✅ Connectivity test passed (${latency}ms)`)
      return { success: true, baseUrl, latency }
    } else {
      const error = `HTTP ${response.status}: ${response.statusText}`
      console.warn(`[API Config] ⚠️  Connectivity test failed: ${error}`)
      return { success: false, baseUrl, error }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[API Config] ❌ Connectivity test failed: ${error}`)
    return { success: false, baseUrl, error }
  }
}

/**
 * Manual IP override for development (OPTIONAL - only if auto-detection fails)
 *
 * 🚀 RECOMMENDED: Leave this as NULL to use automatic detection
 *
 * Expo automatically provides the correct IP via Constants.expoConfig.hostUri
 * This means when you switch networks, it auto-updates without any code changes!
 *
 * ⚠️  Only set this manually if:
 * 1. Auto-detection is failing (check console for warnings)
 * 2. You're debugging a specific network configuration
 * 3. You're using a tunnel or proxy
 *
 * To find your current IP:
 * - Windows: Get-NetIPAddress -AddressFamily IPv4
 * - Mac/Linux: ifconfig | grep "inet "
 * - Or look at Expo dev server output: exp://X.X.X.X:8081
 */
export const LOCAL_DEV_IP: string | null = null // Let Expo auto-detect (recommended)

/**
 * Get the base URL with intelligent detection and validation
 * Provides detailed logging for debugging network issues
 */
export function getBaseUrl(): string {
  const isNative = Platform.OS !== 'web'
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development'

  if (!isNative) {
    return '' // Web always uses relative paths
  }

  if (!isDevelopment) {
    return 'https://your-app.vercel.app' // TODO: Update with actual Vercel domain
  }

  // Development on native: Intelligent IP detection with fallbacks

  // Priority 1: Manual override (if developer explicitly set it)
  if (LOCAL_DEV_IP) {
    const manualUrl = `http://${LOCAL_DEV_IP}:3000`
    console.log('[API Config] 🔧 Using manual dev IP override:', manualUrl)
    console.warn('[API Config] ⚠️  Consider removing LOCAL_DEV_IP to use auto-detection')
    return manualUrl
  }

  // Priority 2: Auto-detect from Expo (RECOMMENDED - handles network changes automatically)
  const autoIp = getExpoDevServerIp()
  if (autoIp) {
    const autoUrl = `http://${autoIp}:3000`
    console.log('[API Config] 🎯 Using auto-detected dev IP:', autoUrl)
    console.log('[API Config] ℹ️  This IP auto-updates when you switch networks!')
    return autoUrl
  }

  // Priority 3: Localhost fallback (iOS simulator only)
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.warn('[API Config] ⚠️  IP AUTO-DETECTION FAILED')
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.warn('[API Config] Using localhost fallback (iOS Simulator only)')
  console.warn('[API Config] This will NOT work on:')
  console.warn('[API Config]   • Physical iPhone/iPad')
  console.warn('[API Config]   • Android Emulator')
  console.warn('[API Config]   • Android Device')
  console.warn('')
  console.warn('[API Config] 🔧 To fix:')
  console.warn('[API Config]   1. Check your Expo dev server URL (e.g., exp://192.168.X.X:8081)')
  console.warn('[API Config]   2. Verify Next.js server is running on same machine')
  console.warn('[API Config]   3. Ensure both are on the same WiFi network')
  console.warn('[API Config]   4. If still failing, set LOCAL_DEV_IP in api-config.ts')
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return 'http://localhost:3000'
}

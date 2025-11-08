/**
 * Human Design Chart Calculator
 * Simplified TypeScript implementation for local calculation
 *
 * NOTE: This is a PLACEHOLDER implementation using deterministic mock data
 * based on birth date. In Phase 2, this will be replaced with actual
 * astronomical ephemeris calculations or an API call to a proper HD service.
 *
 * For production, consider:
 * - Swiss Ephemeris integration
 * - Professional HD API (e.g., MyBodyGraph API)
 * - Full hdkit port with ephemeris data
 */

import type {
  BirthData,
  HumanDesignChart,
  PersonalityDesign,
  PlanetPosition,
  ChartCalculationOptions,
} from './types'

/**
 * Generate a deterministic "mock" chart based on birth date
 * This ensures consistent results for development and testing
 *
 * In production, replace this with real astronomical calculations
 */
export function calculateHumanDesignChart(options: ChartCalculationOptions): HumanDesignChart {
  const { birthData, useMockData = true } = options

  if (!useMockData) {
    throw new Error(
      'Real astronomical calculations not yet implemented. Set useMockData: true for development.'
    )
  }

  // Create deterministic seed from birth date
  const dateHash = hashBirthDate(birthData.date)

  // Generate mock personality and design activations
  const personality = generateMockActivations(dateHash)
  const design = generateMockActivations(dateHash + 88) // Offset for design

  // Calculate type based on activated centers
  const centers = calculateCenters(personality, design)
  const type = determineType(centers)
  const strategy = getStrategyForType(type)
  const authority = determineAuthority(centers, type)

  // Mock profile calculation
  const profile = generateProfile(dateHash)

  // Calculate activated gates and channels
  const gates = extractActivatedGates(personality, design)
  const channels = calculateChannels(gates)

  // Determine definition
  const definition = determineDefinition(channels, centers)

  // Mock incarnation cross
  const incarnationCross = generateIncarnationCross(personality)

  return {
    personality,
    design,
    type,
    strategy,
    authority,
    profile,
    definition,
    centers,
    channels,
    gates,
    incarnationCross,
  }
}

/**
 * Hash birth date to create deterministic seed
 */
function hashBirthDate(date: string): number {
  const d = new Date(date)
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  return (d.getFullYear() % 100) * 1000 + dayOfYear
}

/**
 * Generate mock planet activations
 */
function generateMockActivations(seed: number): PersonalityDesign {
  const planets: Array<keyof PersonalityDesign> = [
    'sun',
    'earth',
    'northNode',
    'southNode',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
  ]

  const activations: any = {}

  planets.forEach((planet, index) => {
    const planetSeed = seed + index * 17
    activations[planet] = {
      gate: (planetSeed % 64) + 1, // Gates 1-64
      line: (planetSeed % 6) + 1, // Lines 1-6
      color: (planetSeed % 6) + 1,
      tone: (planetSeed % 6) + 1,
      base: (planetSeed % 5) + 1,
    }
  })

  return activations
}

/**
 * Calculate which centers are defined based on activations
 */
function calculateCenters(personality: PersonalityDesign, design: PersonalityDesign) {
  // Simplified: Random centers for mock data
  const allPositions = [...Object.values(personality), ...Object.values(design)]
  const gateCount = allPositions.length

  return {
    head: gateCount % 2 === 0,
    ajna: gateCount % 3 === 0,
    throat: gateCount % 5 === 0,
    g: gateCount % 7 === 0,
    will: gateCount % 11 === 0,
    sacral: gateCount % 13 === 0,
    spleen: gateCount % 17 === 0,
    solar: gateCount % 19 === 0,
    root: gateCount % 23 === 0,
  }
}

/**
 * Determine Human Design type based on center definitions
 */
function determineType(centers: HumanDesignChart['centers']): HumanDesignChart['type'] {
  if (centers.sacral && centers.throat) return 'Manifesting Generator'
  if (centers.sacral) return 'Generator'
  if (!centers.sacral && !centers.g && !centers.solar) return 'Reflector'
  if (!centers.sacral && (centers.g || centers.throat)) return 'Projector'
  return 'Manifestor'
}

/**
 * Get strategy for type
 */
function getStrategyForType(type: HumanDesignChart['type']): string {
  const strategies = {
    Manifestor: 'To Inform',
    Generator: 'To Respond',
    'Manifesting Generator': 'To Respond (and Inform before Acting)',
    Projector: 'To Wait for Invitation',
    Reflector: 'To Wait a Lunar Cycle',
  }
  return strategies[type]
}

/**
 * Determine inner authority
 */
function determineAuthority(
  centers: HumanDesignChart['centers'],
  type: HumanDesignChart['type']
): string {
  if (centers.solar) return 'Emotional - Solar Plexus'
  if (centers.sacral && type !== 'Projector') return 'Sacral'
  if (centers.spleen) return 'Splenic'
  if (centers.will) return 'Ego/Heart'
  if (centers.g) return 'Self-Projected'
  if (type === 'Projector') return 'Mental Projector'
  return 'Lunar - Wait 28 Days'
}

/**
 * Generate profile from seed
 */
function generateProfile(seed: number): string {
  const lines = [(seed % 6) + 1, ((seed * 7) % 6) + 1]
  return `${lines[0]}/${lines[1]}`
}

/**
 * Extract all activated gates from personality and design
 */
function extractActivatedGates(
  personality: PersonalityDesign,
  design: PersonalityDesign
): number[] {
  const gates = new Set<number>()

  Object.values(personality).forEach((pos) => gates.add(pos.gate))
  Object.values(design).forEach((pos) => gates.add(pos.gate))

  return Array.from(gates).sort((a, b) => a - b)
}

/**
 * Calculate channels (simplified - mock data)
 * Real implementation would map gates to channels
 */
function calculateChannels(gates: number[]): number[] {
  // Mock: Create channel numbers from pairs of gates
  const channels: number[] = []
  for (let i = 0; i < gates.length - 1; i += 2) {
    channels.push(gates[i] || 0)
  }
  return channels
}

/**
 * Determine definition type based on channels and centers
 */
function determineDefinition(
  channels: number[],
  centers: HumanDesignChart['centers']
): HumanDesignChart['definition'] {
  const definedCenters = Object.values(centers).filter(Boolean).length

  if (definedCenters === 0) return 'None'
  if (channels.length <= 3) return 'Single'
  if (channels.length <= 6) return 'Split'
  if (channels.length <= 9) return 'Triple Split'
  return 'Quadruple Split'
}

/**
 * Generate incarnation cross from sun/earth gates
 */
function generateIncarnationCross(personality: PersonalityDesign): string {
  const sunGate = personality.sun.gate
  const earthGate = personality.earth.gate
  return `Right Angle Cross of ${sunGate}/${earthGate}`
}

/**
 * Validate birth data
 */
export function validateBirthData(birthData: BirthData): { valid: boolean; error?: string } {
  if (!birthData.date || !birthData.time) {
    return { valid: false, error: 'Date and time are required' }
  }

  const dateTest = new Date(birthData.date)
  if (Number.isNaN(dateTest.getTime())) {
    return { valid: false, error: 'Invalid date format' }
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(birthData.time)) {
    return { valid: false, error: 'Time must be in HH:MM format (24-hour)' }
  }

  if (!birthData.location.latitude || !birthData.location.longitude) {
    return { valid: false, error: 'Location coordinates are required' }
  }

  return { valid: true }
}

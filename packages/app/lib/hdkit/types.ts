/**
 * Human Design Chart Data Types
 * Based on hdkit by Jonah Dempcy (MIT License)
 */

export interface BirthData {
  date: string // ISO date string
  time: string // HH:MM format (24-hour)
  location: {
    latitude: number
    longitude: number
    timezone: string // IANA timezone (e.g., "America/New_York")
  }
}

export interface PlanetPosition {
  gate: number // 1-64
  line: number // 1-6
  color: number
  tone: number
  base: number
}

export interface PersonalityDesign {
  sun: PlanetPosition
  earth: PlanetPosition
  northNode: PlanetPosition
  southNode: PlanetPosition
  moon: PlanetPosition
  mercury: PlanetPosition
  venus: PlanetPosition
  mars: PlanetPosition
  jupiter: PlanetPosition
  saturn: PlanetPosition
  uranus: PlanetPosition
  neptune: PlanetPosition
  pluto: PlanetPosition
}

export interface HumanDesignChart {
  personality: PersonalityDesign
  design: PersonalityDesign
  type: 'Manifestor' | 'Generator' | 'Manifesting Generator' | 'Projector' | 'Reflector'
  strategy: string
  authority: string
  profile: string
  definition: 'None' | 'Single' | 'Split' | 'Triple Split' | 'Quadruple Split'
  centers: {
    head: boolean
    ajna: boolean
    throat: boolean
    g: boolean // Identity/G Center
    will: boolean // Ego/Heart
    sacral: boolean
    spleen: boolean
    solar: boolean // Solar Plexus
    root: boolean
  }
  channels: number[] // List of activated channel numbers
  gates: number[] // List of all activated gates
  incarnationCross: string
}

export interface ChartCalculationOptions {
  birthData: BirthData
  useMockData?: boolean // For development without astronomical calculations
}

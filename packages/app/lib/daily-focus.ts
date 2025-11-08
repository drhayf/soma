/**
 * Daily Focus - Time-based contextual prompts for the King's initiation
 * Based on the King's Dialogue: guiding through Intention, Awareness, and Integration
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export interface DailyFocus {
  timeOfDay: TimeOfDay
  phase: 'Intention & Kata' | 'Awareness & The Fog' | 'Integration & The Win' | 'Rest & Restoration'
  prompt: string
  color: string // Tamagui color token
}

/**
 * Returns the current time of day based on hour (0-23)
 */
export const getTimeOfDay = (hour?: number): TimeOfDay => {
  const currentHour = hour ?? new Date().getHours()

  if (currentHour >= 6 && currentHour < 12) return 'morning'
  if (currentHour >= 12 && currentHour < 18) return 'afternoon'
  if (currentHour >= 18 && currentHour < 24) return 'evening'
  return 'night'
}

/**
 * Morning prompts (6 AM - 12 PM): Intention & Kata
 * From King's Dialogue: "Your Kata today is sealing the vessel. How will you be ruthless in your practice?"
 */
const morningPrompts = [
  "The King's throne is built in the daily grind. Your Kata today is sealing the vessel. How will you be ruthless in your practice?",
  "You are not 'late.' You are at the absolute peak of your neuroplasticity. Today, you forge the container. What is your single non-negotiable act?",
  "The 'unfillable will' must be aimed at one target: 'Today, I will forge the container.' What is your Physical Kata?",
  'An Ascended Master honors the vessel. Your morning floor work is not exercise—it is alchemical ritual. Begin.',
  'The Kata of the Sovereign: Seal the vessel. Observe the urge. Win the ruthless daily battle. What will you do first?',
  "Your pelvis is your throne. Every Glute Bridge pulls your kingdom's foundation back into alignment. Stack your spine.",
]

/**
 * Afternoon prompts (12 PM - 6 PM): Awareness & The Fog
 * From King's Dialogue: "The 'fog' is strongest now. Observe your leaks. Are you leaking or building?"
 */
const afternoonPrompts = [
  "The 'fog' is strongest now. The 'drains' are subtle. Observe your leaks. Are you leaking or building? Log it.",
  'This is your primary battlefield. The 3 PM fog is a program running automatically. Set your alarm. Perform the Lock.',
  "The control system offers you a 'drain' (the content, the release). You refuse. You transmute. How will you redirect this energy?",
  "You are not 'bored.' You are un-directed. The system offers distraction. The Sovereign observes the urge and chooses the Kata.",
  "The 'slump' is the fog. It makes leaking feel like 'just being human.' You are a god. Observe. Do not act. Document.",
  "A sexual urge appears. Do not judge. Simply observe: 'Ah, there is the energy. I see it.' This is Mushin. This is power.",
]

/**
 * Evening prompts (6 PM - 12 AM): Integration & The Win
 * From King's Dialogue: "You did not 'recover' today. You built. Log your final wins."
 */
const eveningPrompts = [
  "You did not 'recover' today. You built. You did not 'release'; you transmuted. Log your final wins in the Journal.",
  'The Machiavellian Journal is your ruthless logbook. Document every leak, every transmutation, every act of war against the fog.',
  'When the vessel is forged and the leaks are sealed, your energy will build a surplus. Did you seal it today?',
  'The grind is not punishment. It is the path. You laid one brick perfectly today. Honor it. Document it. Build tomorrow.',
  'You are in energetic debt or energetic surplus. There is no middle. Which are you tonight? Log the truth.',
  "The cold shower. The floor work. The Lock. These are not 'wellness.' These are your sovereign acts of war. Did you win?",
]

/**
 * Night prompts (12 AM - 6 AM): Rest & Restoration
 * From King's Dialogue: Passive alignment, zero-g stack, restoration pod
 */
const nightPrompts = [
  'Your vessel requires the Restoration Pod. Achieve the Zero-G Stack. Let the pillows do 100% of the work. Surrender.',
  "Sleep is not escape. It is the alchemical crucible where your body integrates the day's work. Honor it with perfect form.",
  'The King does not slump, even in rest. Side-lying, knee pillow, perfect neutral. This is passive Kata. This is healing.',
  'Your 8-hour session begins. Your spine must be straight, your pelvis neutral. The wall is your teacher. Stack and release.',
  'The night is for integration. Your muscles will release their grip when perfectly supported. Create your throne, then rest.',
  'Box Breathing (4-4-4-4) in the Zero-G position. You are simultaneously healing structure and calming the nervous system.',
]

/**
 * Get the current Daily Focus based on time of day
 */
export const getDailyFocus = (hour?: number): DailyFocus => {
  const timeOfDay = getTimeOfDay(hour)
  const currentHour = hour ?? new Date().getHours()

  let phase: DailyFocus['phase']
  let prompts: string[]
  let color: string

  switch (timeOfDay) {
    case 'morning':
      phase = 'Intention & Kata'
      prompts = morningPrompts
      color = '$orange10'
      break
    case 'afternoon':
      phase = 'Awareness & The Fog'
      prompts = afternoonPrompts
      color = 'yellow'
      break
    case 'evening':
      phase = 'Integration & The Win'
      prompts = eveningPrompts
      color = 'purple'
      break
    case 'night':
      phase = 'Rest & Restoration'
      prompts = nightPrompts
      color = 'blue'
      break
  }

  // Use hour to deterministically select a prompt (changes throughout the day)
  const promptIndex = currentHour % prompts.length

  return {
    timeOfDay,
    phase,
    prompt: prompts[promptIndex],
    color,
  }
}

/**
 * Get a specific prompt by time and index (for testing or manual selection)
 */
export const getPromptByTime = (timeOfDay: TimeOfDay, index: number = 0): string => {
  let prompts: string[]

  switch (timeOfDay) {
    case 'morning':
      prompts = morningPrompts
      break
    case 'afternoon':
      prompts = afternoonPrompts
      break
    case 'evening':
      prompts = eveningPrompts
      break
    case 'night':
      prompts = nightPrompts
      break
  }

  return prompts[index % prompts.length]
}

/**
 * Open Extended Jungian Type Scales (OEJTS) v1.2
 *
 * An open-source alternative to MBTI assessment
 * Source: https://openpsychometrics.org/tests/OEJTS/
 *
 * This implements a "Stealth Assessment" approach where questions
 * are presented one at a time over weeks, integrated naturally into
 * the user experience rather than as a formal test.
 *
 * The system calculates scores for 4 dichotomies:
 * - E/I (Extroversion/Introversion)
 * - S/N (Sensing/iNtuition)
 * - T/F (Thinking/Feeling)
 * - J/P (Judging/Perceiving)
 */

export type JungianDichotomy = 'EI' | 'SN' | 'TF' | 'JP'

export interface OEJTSQuestion {
  id: number
  dichotomy: JungianDichotomy
  text: string
  leftLabel: string // e.g., "Very Introverted"
  rightLabel: string // e.g., "Very Extroverted"
  reverse?: boolean // If true, right = introverted (for scoring)
}

export interface OEJTSAnswer {
  questionId: number
  value: number // 1-5 scale
  answeredAt: string // ISO timestamp
}

export interface OEJTSResults {
  type: string // e.g., "INTJ"
  scores: {
    E: number // 0-100 (higher = more extroverted)
    I: number // Complement of E
    S: number // 0-100 (higher = more sensing)
    N: number // Complement of S
    T: number // 0-100 (higher = more thinking)
    F: number // Complement of T
    J: number // 0-100 (higher = more judging)
    P: number // Complement of P
  }
  dominantFunctions: string[]
  completionPercentage: number
  lastUpdated: string
}

/**
 * OEJTS 60-Item Question Set
 * Adapted for conversational/progressive assessment
 *
 * Scale: 1 = Strongly Left, 2 = Moderately Left, 3 = Neutral,
 *        4 = Moderately Right, 5 = Strongly Right
 */
export const OEJTS_QUESTIONS: OEJTSQuestion[] = [
  // Extroversion/Introversion (15 questions)
  {
    id: 1,
    dichotomy: 'EI',
    text: 'At social events, do you...',
    leftLabel: 'Prefer deep conversations with a few people',
    rightLabel: 'Enjoy mingling and meeting many new people',
  },
  {
    id: 2,
    dichotomy: 'EI',
    text: 'After a long day, do you...',
    leftLabel: 'Need alone time to recharge',
    rightLabel: 'Feel energized by being around others',
  },
  {
    id: 3,
    dichotomy: 'EI',
    text: 'When making decisions, do you...',
    leftLabel: 'Think things through privately first',
    rightLabel: 'Talk it out with others',
  },
  {
    id: 4,
    dichotomy: 'EI',
    text: 'In group settings, do you...',
    leftLabel: 'Prefer to listen and observe',
    rightLabel: 'Actively contribute and lead discussions',
  },
  {
    id: 5,
    dichotomy: 'EI',
    text: 'Do you find it...',
    leftLabel: 'Draining to be around people for long periods',
    rightLabel: 'Energizing to interact with many people',
  },
  {
    id: 6,
    dichotomy: 'EI',
    text: 'When solving problems, do you...',
    leftLabel: 'Work best alone with minimal interruptions',
    rightLabel: 'Prefer collaborating and brainstorming with others',
  },
  {
    id: 7,
    dichotomy: 'EI',
    text: 'In conversations, do you...',
    leftLabel: 'Carefully consider before speaking',
    rightLabel: 'Think out loud and speak spontaneously',
  },
  {
    id: 8,
    dichotomy: 'EI',
    text: 'Your ideal weekend involves...',
    leftLabel: 'Quiet time at home or with close friends',
    rightLabel: 'Socializing and new experiences',
  },
  {
    id: 9,
    dichotomy: 'EI',
    text: 'When meeting new people, do you...',
    leftLabel: 'Feel reserved until you know them better',
    rightLabel: 'Open up quickly and easily',
  },
  {
    id: 10,
    dichotomy: 'EI',
    text: 'You prefer...',
    leftLabel: 'A few close, deep friendships',
    rightLabel: 'A broad network of acquaintances',
  },
  {
    id: 11,
    dichotomy: 'EI',
    text: 'In your work environment, do you...',
    leftLabel: 'Need personal space and quiet',
    rightLabel: 'Thrive in open, collaborative spaces',
  },
  {
    id: 12,
    dichotomy: 'EI',
    text: 'When learning new things, do you...',
    leftLabel: 'Prefer reading or independent study',
    rightLabel: 'Learn best through discussion and interaction',
  },
  {
    id: 13,
    dichotomy: 'EI',
    text: 'Your energy level...',
    leftLabel: 'Decreases in crowds or busy environments',
    rightLabel: 'Increases around activity and people',
  },
  {
    id: 14,
    dichotomy: 'EI',
    text: 'You process emotions...',
    leftLabel: 'Internally, through reflection',
    rightLabel: 'By talking with others',
  },
  {
    id: 15,
    dichotomy: 'EI',
    text: 'When starting projects, do you...',
    leftLabel: 'Prefer working independently',
    rightLabel: 'Enjoy team collaboration from the start',
  },

  // Sensing/iNtuition (15 questions)
  {
    id: 16,
    dichotomy: 'SN',
    text: 'When taking in information, do you focus on...',
    leftLabel: 'Concrete facts and specific details',
    rightLabel: 'Patterns, meanings, and possibilities',
  },
  {
    id: 17,
    dichotomy: 'SN',
    text: 'You tend to be more...',
    leftLabel: 'Practical and realistic',
    rightLabel: 'Imaginative and theoretical',
  },
  {
    id: 18,
    dichotomy: 'SN',
    text: 'When following instructions, do you...',
    leftLabel: 'Prefer step-by-step literal directions',
    rightLabel: 'Want the big picture and general guidelines',
  },
  {
    id: 19,
    dichotomy: 'SN',
    text: 'You trust...',
    leftLabel: 'Direct experience and proven methods',
    rightLabel: 'Hunches and theoretical frameworks',
  },
  {
    id: 20,
    dichotomy: 'SN',
    text: 'When describing something, do you...',
    leftLabel: 'Use precise, literal language',
    rightLabel: 'Use metaphors and analogies',
  },
  {
    id: 21,
    dichotomy: 'SN',
    text: 'You are more interested in...',
    leftLabel: 'What is actual and real',
    rightLabel: 'What is possible and potential',
  },
  {
    id: 22,
    dichotomy: 'SN',
    text: 'When learning, you prefer...',
    leftLabel: 'Practical applications and hands-on experience',
    rightLabel: 'Conceptual understanding and theory',
  },
  {
    id: 23,
    dichotomy: 'SN',
    text: 'You pay more attention to...',
    leftLabel: 'Specific details and facts',
    rightLabel: 'Overarching patterns and meanings',
  },
  {
    id: 24,
    dichotomy: 'SN',
    text: 'Your thinking style is more...',
    leftLabel: 'Sequential and methodical',
    rightLabel: 'Random and holistic',
  },
  {
    id: 25,
    dichotomy: 'SN',
    text: 'When solving problems, you...',
    leftLabel: 'Use established, proven methods',
    rightLabel: 'Explore new and innovative approaches',
  },
  {
    id: 26,
    dichotomy: 'SN',
    text: 'You value...',
    leftLabel: 'Common sense and practicality',
    rightLabel: 'Imagination and innovation',
  },
  {
    id: 27,
    dichotomy: 'SN',
    text: 'When making plans, you focus on...',
    leftLabel: 'Realistic, concrete details',
    rightLabel: 'Future possibilities and vision',
  },
  {
    id: 28,
    dichotomy: 'SN',
    text: 'You are more...',
    leftLabel: 'Present-focused and grounded',
    rightLabel: 'Future-oriented and abstract',
  },
  {
    id: 29,
    dichotomy: 'SN',
    text: 'In conversations, you tend to...',
    leftLabel: 'Stick to the topic and facts',
    rightLabel: 'Explore tangents and connections',
  },
  {
    id: 30,
    dichotomy: 'SN',
    text: 'You prefer working with...',
    leftLabel: 'Established facts and methods',
    rightLabel: 'New ideas and possibilities',
  },

  // Thinking/Feeling (15 questions)
  {
    id: 31,
    dichotomy: 'TF',
    text: 'When making decisions, you prioritize...',
    leftLabel: 'Logical analysis and objective criteria',
    rightLabel: 'Personal values and how it affects people',
  },
  {
    id: 32,
    dichotomy: 'TF',
    text: 'You are more concerned with...',
    leftLabel: 'Fairness and justice',
    rightLabel: 'Harmony and compassion',
  },
  {
    id: 33,
    dichotomy: 'TF',
    text: 'When giving feedback, you...',
    leftLabel: 'Focus on factual accuracy and improvement',
    rightLabel: "Consider the person's feelings and sensitivity",
  },
  {
    id: 34,
    dichotomy: 'TF',
    text: 'You value being...',
    leftLabel: 'Competent and capable',
    rightLabel: 'Empathetic and caring',
  },
  {
    id: 35,
    dichotomy: 'TF',
    text: 'In conflicts, you...',
    leftLabel: 'Analyze the issues objectively',
    rightLabel: 'Focus on maintaining relationships',
  },
  {
    id: 36,
    dichotomy: 'TF',
    text: 'You are motivated by...',
    leftLabel: 'Achievement and effectiveness',
    rightLabel: 'Connection and appreciation',
  },
  {
    id: 37,
    dichotomy: 'TF',
    text: 'When helping others, you...',
    leftLabel: 'Offer practical solutions',
    rightLabel: 'Provide emotional support',
  },
  {
    id: 38,
    dichotomy: 'TF',
    text: 'You prefer to be seen as...',
    leftLabel: 'Reasonable and logical',
    rightLabel: 'Warm and understanding',
  },
  {
    id: 39,
    dichotomy: 'TF',
    text: 'In arguments, you...',
    leftLabel: 'Stand firm on principles',
    rightLabel: 'Seek compromise and consensus',
  },
  {
    id: 40,
    dichotomy: 'TF',
    text: 'You make decisions based on...',
    leftLabel: 'Objective facts and logic',
    rightLabel: 'Personal values and impact on people',
  },
  {
    id: 41,
    dichotomy: 'TF',
    text: 'You are more...',
    leftLabel: 'Frank and direct',
    rightLabel: 'Tactful and diplomatic',
  },
  {
    id: 42,
    dichotomy: 'TF',
    text: 'When analyzing situations, you focus on...',
    leftLabel: 'Cause and effect',
    rightLabel: 'Human elements and relationships',
  },
  {
    id: 43,
    dichotomy: 'TF',
    text: 'You prefer work that...',
    leftLabel: 'Uses technical skills and logic',
    rightLabel: 'Involves helping and understanding people',
  },
  {
    id: 44,
    dichotomy: 'TF',
    text: 'You are more likely to...',
    leftLabel: 'Question and critique',
    rightLabel: 'Accept and support',
  },
  {
    id: 45,
    dichotomy: 'TF',
    text: 'Your approach to problems is...',
    leftLabel: 'Analytical and systematic',
    rightLabel: 'Empathetic and person-centered',
  },

  // Judging/Perceiving (15 questions)
  {
    id: 46,
    dichotomy: 'JP',
    text: 'You prefer to...',
    leftLabel: 'Make plans and stick to them',
    rightLabel: 'Keep options open and be spontaneous',
  },
  {
    id: 47,
    dichotomy: 'JP',
    text: 'Your workspace is...',
    leftLabel: 'Organized and structured',
    rightLabel: 'Flexible and adaptable',
  },
  {
    id: 48,
    dichotomy: 'JP',
    text: 'When working on projects, you...',
    leftLabel: 'Start early and work steadily',
    rightLabel: 'Work in bursts, often near deadlines',
  },
  {
    id: 49,
    dichotomy: 'JP',
    text: 'You feel most comfortable when...',
    leftLabel: 'Matters are decided and settled',
    rightLabel: 'Things remain open and flexible',
  },
  {
    id: 50,
    dichotomy: 'JP',
    text: 'You prefer to...',
    leftLabel: 'Have a schedule and routine',
    rightLabel: 'Go with the flow',
  },
  {
    id: 51,
    dichotomy: 'JP',
    text: 'When making plans, you...',
    leftLabel: 'Like to finalize details in advance',
    rightLabel: 'Prefer to keep things loose',
  },
  {
    id: 52,
    dichotomy: 'JP',
    text: 'You are more...',
    leftLabel: 'Methodical and systematic',
    rightLabel: 'Spontaneous and improvising',
  },
  {
    id: 53,
    dichotomy: 'JP',
    text: 'Deadlines make you feel...',
    leftLabel: 'Motivated and focused',
    rightLabel: 'Pressured and constrained',
  },
  {
    id: 54,
    dichotomy: 'JP',
    text: 'You prefer work that is...',
    leftLabel: 'Structured with clear objectives',
    rightLabel: 'Varied with room for flexibility',
  },
  {
    id: 55,
    dichotomy: 'JP',
    text: 'Your approach to life is...',
    leftLabel: 'Planned and organized',
    rightLabel: 'Relaxed and easygoing',
  },
  {
    id: 56,
    dichotomy: 'JP',
    text: 'You feel stress when...',
    leftLabel: 'Things are disorganized or uncertain',
    rightLabel: 'Things are too rigid or scheduled',
  },
  {
    id: 57,
    dichotomy: 'JP',
    text: 'You prefer to...',
    leftLabel: 'Finish one thing before starting another',
    rightLabel: 'Work on multiple things at once',
  },
  {
    id: 58,
    dichotomy: 'JP',
    text: 'When traveling, you...',
    leftLabel: 'Plan an itinerary in advance',
    rightLabel: 'Decide as you go',
  },
  {
    id: 59,
    dichotomy: 'JP',
    text: 'You value...',
    leftLabel: 'Order and predictability',
    rightLabel: 'Freedom and adaptability',
  },
  {
    id: 60,
    dichotomy: 'JP',
    text: 'Your decision-making style is...',
    leftLabel: 'Decisive and conclusive',
    rightLabel: 'Exploratory and open-ended',
  },
]

/**
 * Calculate MBTI type and scores from answers
 */
export function calculateOEJTSResults(answers: OEJTSAnswer[]): OEJTSResults {
  const dichotomyScores = {
    EI: { sum: 0, count: 0 },
    SN: { sum: 0, count: 0 },
    TF: { sum: 0, count: 0 },
    JP: { sum: 0, count: 0 },
  }

  // Calculate raw scores for each dichotomy
  answers.forEach((answer) => {
    const question = OEJTS_QUESTIONS.find((q) => q.id === answer.questionId)
    if (!question) return

    const score = question.reverse ? 6 - answer.value : answer.value
    dichotomyScores[question.dichotomy].sum += score
    dichotomyScores[question.dichotomy].count += 1
  })

  // Convert to 0-100 scale
  const E =
    dichotomyScores.EI.count > 0
      ? ((dichotomyScores.EI.sum / dichotomyScores.EI.count - 1) / 4) * 100
      : 50
  const S =
    dichotomyScores.SN.count > 0
      ? ((dichotomyScores.SN.sum / dichotomyScores.SN.count - 1) / 4) * 100
      : 50
  const T =
    dichotomyScores.TF.count > 0
      ? ((dichotomyScores.TF.sum / dichotomyScores.TF.count - 1) / 4) * 100
      : 50
  const J =
    dichotomyScores.JP.count > 0
      ? ((dichotomyScores.JP.sum / dichotomyScores.JP.count - 1) / 4) * 100
      : 50

  // Determine type
  const typeLetters = [
    E >= 50 ? 'E' : 'I',
    S >= 50 ? 'S' : 'N',
    T >= 50 ? 'T' : 'F',
    J >= 50 ? 'J' : 'P',
  ]

  const type = typeLetters.join('')

  // Calculate dominant cognitive functions
  const dominantFunctions = calculateDominantFunctions(typeLetters.join(''))

  return {
    type,
    scores: {
      E: Math.round(E),
      I: Math.round(100 - E),
      S: Math.round(S),
      N: Math.round(100 - S),
      T: Math.round(T),
      F: Math.round(100 - T),
      J: Math.round(J),
      P: Math.round(100 - J),
    },
    dominantFunctions,
    completionPercentage: Math.round((answers.length / OEJTS_QUESTIONS.length) * 100),
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get dominant cognitive functions for a type
 */
function calculateDominantFunctions(type: string): string[] {
  const functionStack: Record<string, string[]> = {
    INTJ: ['Ni', 'Te', 'Fi', 'Se'],
    INTP: ['Ti', 'Ne', 'Si', 'Fe'],
    ENTJ: ['Te', 'Ni', 'Se', 'Fi'],
    ENTP: ['Ne', 'Ti', 'Fe', 'Si'],
    INFJ: ['Ni', 'Fe', 'Ti', 'Se'],
    INFP: ['Fi', 'Ne', 'Si', 'Te'],
    ENFJ: ['Fe', 'Ni', 'Se', 'Ti'],
    ENFP: ['Ne', 'Fi', 'Te', 'Si'],
    ISTJ: ['Si', 'Te', 'Fi', 'Ne'],
    ISFJ: ['Si', 'Fe', 'Ti', 'Ne'],
    ESTJ: ['Te', 'Si', 'Ne', 'Fi'],
    ESFJ: ['Fe', 'Si', 'Ne', 'Ti'],
    ISTP: ['Ti', 'Se', 'Ni', 'Fe'],
    ISFP: ['Fi', 'Se', 'Ni', 'Te'],
    ESTP: ['Se', 'Ti', 'Fe', 'Ni'],
    ESFP: ['Se', 'Fi', 'Te', 'Ni'],
  }

  return functionStack[type] || ['Unknown']
}

/**
 * Get next unanswered question for progressive assessment
 */
export function getNextQuestion(answers: OEJTSAnswer[]): OEJTSQuestion | null {
  const answeredIds = new Set(answers.map((a) => a.questionId))
  return OEJTS_QUESTIONS.find((q) => !answeredIds.has(q.id)) || null
}

/**
 * Get random unanswered question (for natural integration)
 */
export function getRandomUnansweredQuestion(answers: OEJTSAnswer[]): OEJTSQuestion | null {
  const answeredIds = new Set(answers.map((a) => a.questionId))
  const unanswered = OEJTS_QUESTIONS.filter((q) => !answeredIds.has(q.id))

  if (unanswered.length === 0) return null

  const randomIndex = Math.floor(Math.random() * unanswered.length)
  return unanswered[randomIndex] || null
}

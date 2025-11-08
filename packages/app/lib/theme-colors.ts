/**
 * Theme-aware semantic color mappings
 *
 * Maps semantic intent to proper Tamagui theme tokens that work in both light/dark modes.
 * Replaces hardcoded literal colors like "blue", "green", "red" with theme tokens.
 *
 * Usage:
 * ❌ WRONG: <Card backgroundColor="blue" />
 * ✅ CORRECT: <Card backgroundColor={semanticColors.info.background} />
 */

export const semanticColors = {
  // Primary/Brand colors
  primary: {
    background: '$blue4',
    backgroundHover: '$blue5',
    backgroundActive: '$blue6',
    border: '$blue7',
    borderHover: '$blue8',
    text: '$blue11',
    textContrast: '$blue12',
  },

  // Success states (green)
  success: {
    background: '$green4',
    backgroundHover: '$green5',
    backgroundActive: '$green6',
    border: '$green7',
    borderHover: '$green8',
    text: '$green11',
    textContrast: '$green12',
  },

  // Warning states (yellow/orange)
  warning: {
    background: '$yellow4',
    backgroundHover: '$yellow5',
    backgroundActive: '$yellow6',
    border: '$yellow7',
    borderHover: '$yellow8',
    text: '$yellow11',
    textContrast: '$yellow12',
  },

  // Error/Danger states (red)
  error: {
    background: '$red4',
    backgroundHover: '$red5',
    backgroundActive: '$red6',
    border: '$red7',
    borderHover: '$red8',
    text: '$red11',
    textContrast: '$red12',
  },

  // Info states (blue)
  info: {
    background: '$blue4',
    backgroundHover: '$blue5',
    backgroundActive: '$blue6',
    border: '$blue7',
    borderHover: '$blue8',
    text: '$blue11',
    textContrast: '$blue12',
  },

  // Neutral states (gray)
  neutral: {
    background: '$gray4',
    backgroundHover: '$gray5',
    backgroundActive: '$gray6',
    border: '$gray7',
    borderHover: '$gray8',
    text: '$gray11',
    textContrast: '$gray12',
  },
} as const

/**
 * Icon colors that work in both light and dark themes
 */
export const iconColors = {
  primary: '$blue10',
  success: '$green10',
  warning: '$yellow10',
  error: '$red10',
  info: '$blue10',
  neutral: '$gray10',
  muted: '$gray9',
} as const

/**
 * Status indicator colors (for dots, badges, etc.)
 */
export const statusColors = {
  online: '$green9',
  offline: '$red9',
  away: '$yellow9',
  busy: '$orange9',
} as const

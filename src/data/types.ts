// Content data model — spec Section 5.5.
// These interfaces are the contract every *.content.ts file fulfils.

export type PlanetId = 'ai' | 'webdev' | 'dsa' | 'cybersecurity'

export interface PlanetMeta {
  id: PlanetId
  name: string
  tagline: string
  colors: { base: string; glow: string; accent: string; highlight: string }
  orbit: { radiusAU: number; periodSeconds: number; inclinationDeg: number }
}

export interface ConceptCard {
  id: string
  title: string
  summary: string // 1–2 sentences, plain language
  icon?: string
}

export interface QuizItem {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface QuizAttempt {
  selectedIndex: number
  correct: boolean
  attemptedAt: string
}

export interface FactAsteroid {
  id: string
  fact: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  /** human-readable condition, evaluated in store logic, e.g. "complete 3 quizzes on this planet" */
  unlockCondition: string
}

export interface PlanetContent {
  meta: PlanetMeta
  concepts: ConceptCard[]
  quizzes: QuizItem[]
  facts: FactAsteroid[]
  achievements: Achievement[]
}

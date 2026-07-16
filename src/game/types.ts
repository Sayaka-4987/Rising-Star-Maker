export const statIds = ['technical', 'curiosity', 'independence', 'social', 'creativity', 'ambition', 'chaos'] as const
export type StatId = (typeof statIds)[number]
export type Stats = Record<StatId, number>

export const counterIds = ['bugsFixed', 'docsRead', 'questionsAsked', 'demosGiven', 'socialEscapes', 'sideProjects', 'incidentsObserved', 'scopeCreep'] as const
export type CounterId = (typeof counterIds)[number]
export type Counters = Record<CounterId, number>

export type GenderId = 'male' | 'female' | 'nonbinary'
export type CategoryId = 'work' | 'learning' | 'social' | 'danger'
export type OutcomeId = 'criticalFailure' | 'failure' | 'success' | 'criticalSuccess'
export type GamePhase = 'reveal' | 'planning' | 'results' | 'report' | 'ending'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface InternProfile {
  name: string
  gender: GenderId
  pronoun: string
  portraitId: string
  observationKey: string
}

export interface Activity {
  id: string
  category: CategoryId
  labelKey: string
  descriptionKey: string
  icon: string
  statDeltas: Partial<Stats>
}

export interface EventTemplate {
  id: string
  activityId: string
  outcome: OutcomeId
  textKeys: string[]
  weight: number
  statDeltas?: Partial<Stats>
  counterDeltas?: Partial<Counters>
  tags?: string[]
  highlight?: boolean
}

export interface Trait {
  id: string
  nameKey: string
  descriptionKey: string
  priority: number
}

export interface Ending {
  id: string
  nameKey: string
  descriptionKey: string
  summaryKeys: [string, string]
  asciiKey: string
  rarity: Rarity
  priority: number
  requiredTraits?: string[]
  statWeights: Partial<Stats>
  activityWeights?: Record<string, number>
  counterWeights?: Partial<Counters>
  traitBonuses?: Record<string, number>
}

export interface EventResult {
  eventId: string
  activityId: string
  textKey: string
  text: string
  outcome: OutcomeId
  tags: string[]
  highlight: boolean
  unlockedTraitId?: string
}

export interface GameState {
  schemaVersion: 2
  seed: number
  rngState: number
  phase: GamePhase
  week: number
  profile: InternProfile
  stats: Stats
  traits: string[]
  counters: Counters
  activityCounts: Record<string, number>
  selectedActivityIds: string[]
  pendingResults: EventResult[]
  resultIndex: number
  eventHistory: EventResult[]
  endingId?: string
  updatedAt: string
}

export interface HumanDex {
  schemaVersion: 1
  discoveredTraitIds: string[]
  discoveredEndingIds: string[]
  gamesCompleted: number
}

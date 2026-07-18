export const statIds = ['technical', 'curiosity', 'independence', 'social', 'creativity', 'ambition', 'chaos'] as const
export type StatId = (typeof statIds)[number]
export type Stats = Record<StatId, number>

export const counterIds = ['bugsFixed', 'docsRead', 'questionsAsked', 'demosGiven', 'socialEscapes', 'sideProjects', 'incidentsObserved', 'scopeCreep'] as const
export type CounterId = (typeof counterIds)[number]
export type Counters = Record<CounterId, number>

export const evidenceIds = [
  'engineering',
  'reliability',
  'research',
  'productSense',
  'customerFacing',
  'communication',
  'community',
  'ownership',
  'resilience',
  'incidentResponse',
  'leadership',
  'aviation',
  'gaming',
  'robotics',
  'music',
  'anime',
  'fitness',
  'photography',
  'finance',
  'volunteering',
  'foodCulture',
] as const
export type EvidenceId = (typeof evidenceIds)[number]
export type EvidenceTotals = Record<EvidenceId, number>

export const riskIds = ['rework', 'lateHelp', 'unsafeAction', 'unclearCommunication', 'scopeCreep'] as const
export type RiskId = (typeof riskIds)[number]
export type RiskTotals = Record<RiskId, number>

export type GenderId = 'male' | 'female' | 'nonbinary'
export type CategoryId = 'work' | 'learning' | 'social' | 'danger'
export type OutcomeId = 'criticalFailure' | 'failure' | 'success' | 'criticalSuccess'
export type GamePhase = 'reveal' | 'action' | 'feedback'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type SituationKind = 'common' | 'opportunity' | 'trouble' | 'rare'
export type SituationHint = 'opportunity' | 'risk' | 'related'

export interface InternProfile {
  nameKey: string
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
  primaryEvidence: EvidenceId
  secondaryEvidence?: EvidenceId
}

export interface WeeklySituation {
  id: string
  titleKey: string
  descriptionKey: string
  kind: SituationKind
  minimumWeek: number
  maximumPerGame?: number
  cooldownWeeks: number
  weight: number
  opportunityActivityIds: string[]
  riskActivityIds: string[]
  relatedActivityIds: string[]
  evidenceTags: EvidenceId[]
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
  hintKey: string
  asciiKey: string
  rarity: Rarity
  priority: number
  requiredTraits?: string[]
  statWeights: Partial<Stats>
  activityWeights?: Record<string, number>
  counterWeights?: Partial<Counters>
  traitBonuses?: Record<string, number>
  minimumEvidence?: Partial<EvidenceTotals>
  evidenceWeights?: Partial<EvidenceTotals>
  minimumActivities?: Record<string, number>
  requiredSituationIds?: string[]
  situationWeights?: Record<string, number>
}

export interface EventResult {
  eventId: string
  activityId: string
  textKey: string
  text: string
  outcome: OutcomeId
  tags: string[]
  highlight: boolean
  week: number
  situationHint?: SituationHint
  evidenceDeltas?: Partial<EvidenceTotals>
  unlockedTraitId?: string
}

export interface EvidenceLedger {
  totals: EvidenceTotals
  weeklyDeltas: Array<Partial<EvidenceTotals>>
  risks: RiskTotals
  weeklyRisks: Array<Partial<RiskTotals>>
}

export interface GameState {
  schemaVersion: 4
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
  pendingAchievementIds: string[]
  resultIndex: number
  eventHistory: EventResult[]
  unlockedAchievementIds: string[]
  currentSituationId: string
  weeklyMysteryActivityIds: string[]
  situationHistory: string[]
  rareSituationCount: number
  evidence: EvidenceLedger
  traitProgress: Record<string, number>
  endingId?: string
  endingRevealed?: boolean
  updatedAt: string
}

export interface HumanDex {
  schemaVersion: number
  discoveredTraitIds: string[]
  discoveredEndingIds: string[]
  discoveredAchievementIds: string[]
  gamesCompleted: number
}

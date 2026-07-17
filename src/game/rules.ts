import { getLocale, t } from '../content/text'
import { activities, endings, events, observationKeys, profileNameKeys, traits, weeklySituations } from '../data/gameData'
import { nextRandom, pickOne, randomInt, weightedPick } from './rng'
import { counterIds, evidenceIds, riskIds, statIds, type Activity, type Counters, type Ending, type EvidenceId, type EvidenceTotals, type EventResult, type GameState, type GenderId, type OutcomeId, type RiskId, type RiskTotals, type SituationHint, type Stats, type WeeklySituation } from './types'

const genderOptions: Array<{ id: GenderId; pronoun: string }> = [
  { id: 'male', pronoun: '他' },
  { id: 'female', pronoun: '她' },
  { id: 'nonbinary', pronoun: 'ta' },
]

export const achievementIds = [
  'delivery_convoy',
  'quite_hungry',
  'friday_grind_king',
  'dont_touch_production',
  'route_planning_master',
  'fix_bug_grinder',
  'crud_hero',
  'test_marathon',
  'docs_master',
  'duo_ranked',
  'tech_standup_show',
  'release_gatekeeper',
  'counseling_room',
  'demo_perpetual',
  'incident_growth',
  'cloud_native_pro',
  'friday_hackathon_resident',
  'grand_slam',
  'team_wipe',
  'comeback_reversal',
  'chaos_lord',
  'cyber_zen',
  'scope_inflation',
  'social_ceiling',
  'ten_thousand_whys',
  'solo_king',
  'trait_hoarder',
  'question_barrage',
  'bug_street_sweeper',
  'internship_survivor',
] as const

const TRAIT_CONFIRMATION_WEEKS = 3
const TRAIT_PROGRESS_DECAY = 1

export function createNewGame(seed: number): GameState {
  let rngState = seed >>> 0 || 0x9e3779b9
  let nameKey: string
  ;[nameKey, rngState] = pickOne(rngState, profileNameKeys)
  const name = t(nameKey)
  let gender: { id: GenderId; pronoun: string }
  ;[gender, rngState] = pickOne(rngState, genderOptions)
  let portraitIndex: number
  ;[portraitIndex, rngState] = randomInt(rngState, 1, 6)
  let observationKey: string
  ;[observationKey, rngState] = pickOne(rngState, observationKeys)

  const stats = {} as Stats
  for (const id of statIds) {
    ;[stats[id], rngState] = randomInt(rngState, 35, 65)
  }
  normalizeInitialStats(stats)

  return {
    schemaVersion: 4,
    seed,
    rngState,
    phase: 'reveal',
    week: 1,
    profile: { nameKey, name, gender: gender.id, pronoun: gender.pronoun, portraitId: `portrait.${portraitIndex}`, observationKey },
    stats,
    traits: [],
    counters: Object.fromEntries(counterIds.map(id => [id, 0])) as Counters,
    activityCounts: Object.fromEntries(activities.map(activity => [activity.id, 0])),
    selectedActivityIds: [],
    pendingResults: [],
    pendingAchievementIds: [],
    resultIndex: 0,
    eventHistory: [],
    unlockedAchievementIds: [],
    currentSituationId: '',
    situationHistory: [],
    rareSituationCount: 0,
    evidence: {
      totals: zeroEvidence(),
      weeklyDeltas: [],
      risks: zeroRisks(),
      weeklyRisks: [],
    },
    traitProgress: {},
    endingRevealed: false,
    updatedAt: new Date().toISOString(),
  }
}

export function toggleActivity(game: GameState, activityId: string): GameState {
  if (game.phase !== 'action') return game
  const selected = game.selectedActivityIds.length < 3
    ? [...game.selectedActivityIds, activityId]
    : game.selectedActivityIds
  return { ...game, selectedActivityIds: selected }
}

export function removeSelectedActivity(game: GameState, index: number): GameState {
  if (game.phase !== 'action' || index < 0 || index >= game.selectedActivityIds.length) return game
  return { ...game, selectedActivityIds: game.selectedActivityIds.filter((_, selectedIndex) => selectedIndex !== index) }
}

export function resolveSelectedWeek(game: GameState): GameState {
  if (game.phase !== 'action' || game.selectedActivityIds.length !== 3) return game
  const scheduledActivityIds = [...game.selectedActivityIds]
  let working: GameState = {
    ...game,
    stats: { ...game.stats },
    counters: { ...game.counters },
    activityCounts: { ...game.activityCounts },
    traits: [...game.traits],
    eventHistory: [...game.eventHistory],
    evidence: {
      totals: { ...game.evidence.totals },
      weeklyDeltas: [...game.evidence.weeklyDeltas],
      risks: { ...game.evidence.risks },
      weeklyRisks: [...game.evidence.weeklyRisks],
    },
    traitProgress: { ...game.traitProgress },
  }
  const pendingResults: EventResult[] = []
  const weeklyEvidence: Partial<EvidenceTotals> = {}
  const weeklyRisks: Partial<RiskTotals> = {}
  const situation = situationById(game.currentSituationId)

  for (const activityId of game.selectedActivityIds) {
    const activity = activities.find(item => item.id === activityId)
    if (!activity) continue
    applyDeltas(working.stats, activity.statDeltas)
    const previousCount = working.activityCounts[activityId] ?? 0
    working.activityCounts[activityId] = previousCount + 1
    applyDeltas(working.stats, { chaos: repetitionChaosDelta(previousCount) })

    let outcome: OutcomeId
    const situationHint = hintForActivity(situation, activityId)
    ;[outcome, working.rngState] = determineOutcome(working, activity, situationHint)
    const event = events.find(candidate => candidate.activityId === activityId && candidate.outcome === outcome)
    if (!event) throw new Error(`Missing ${outcome} event for ${activityId}`)
    let textKey
    ;[textKey, working.rngState] = pickOne(working.rngState, event.textKeys)
    applyDeltas(working.stats, event.statDeltas)
    applyDeltas(working.counters, event.counterDeltas)

    const evidenceDeltas = evidenceForResult(working, activity, outcome, situation, situationHint, weeklyEvidence)
    applyEvidence(working.evidence.totals, weeklyEvidence, evidenceDeltas)
    applyRisks(working.evidence.risks, weeklyRisks, riskDeltas(activityId, outcome, event.counterDeltas?.scopeCreep ?? 0))

    const text = formatForIntern(textKey, working)
    const result: EventResult = {
      eventId: event.id,
      activityId,
      textKey,
      text,
      outcome,
      tags: event.tags ?? [],
      highlight: event.highlight ?? false,
      week: game.week,
      situationHint,
      evidenceDeltas,
    }
    pendingResults.push(result)
    working.eventHistory.push(result)
  }

  const unlockedTraitId = progressTraitsAndUnlock(working)
  if (unlockedTraitId && pendingResults.length > 0) pendingResults[pendingResults.length - 1]!.unlockedTraitId = unlockedTraitId

  working.evidence.weeklyDeltas[game.week - 1] = weeklyEvidence
  working.evidence.weeklyRisks[game.week - 1] = weeklyRisks
  const pendingAchievementIds = unlockAchievements(working, scheduledActivityIds)
  const unlockedAchievementIds = [...new Set([...working.unlockedAchievementIds, ...pendingAchievementIds])]
  const endingId = game.week === 24 ? chooseEnding(working).id : undefined
  return {
    ...working,
    phase: 'feedback',
    pendingResults,
    pendingAchievementIds,
    unlockedAchievementIds,
    resultIndex: 0,
    selectedActivityIds: [],
    endingId,
    endingRevealed: false,
  }
}

export function advanceFromFeedback(game: GameState): GameState {
  if (game.phase !== 'feedback' || game.week === 24) return game
  return prepareSituation({ ...game, phase: 'action', week: game.week + 1, pendingResults: [], pendingAchievementIds: [], resultIndex: 0 })
}

export function revealComplete(game: GameState): GameState {
  return game.phase === 'reveal' ? prepareSituation({ ...game, phase: 'action' }) : game
}

export function ensureCurrentSituation(game: GameState): GameState {
  return game.phase === 'action' && !game.currentSituationId ? prepareSituation(game) : game
}

export function scoreEnding(game: GameState, ending: Ending, ignoreRequirements = false): number {
  if (!ignoreRequirements && ending.requiredTraits?.some(id => !game.traits.includes(id))) return Number.NEGATIVE_INFINITY
  if (!ignoreRequirements && Object.entries(ending.minimumEvidence ?? {}).some(([id, minimum]) => game.evidence.totals[id as EvidenceId] < (minimum ?? 0))) return Number.NEGATIVE_INFINITY
  if (!ignoreRequirements && Object.entries(ending.minimumActivities ?? {}).some(([id, minimum]) => (game.activityCounts[id] ?? 0) < minimum)) return Number.NEGATIVE_INFINITY
  if (!ignoreRequirements && ending.requiredSituationIds?.some(id => !game.situationHistory.includes(id))) return Number.NEGATIVE_INFINITY
  let score = 0
  for (const [id, weight] of Object.entries(ending.statWeights)) score += game.stats[id as keyof Stats] * (weight ?? 0)
  for (const [id, weight] of Object.entries(ending.activityWeights ?? {})) score += (game.activityCounts[id] ?? 0) * weight
  for (const [id, weight] of Object.entries(ending.counterWeights ?? {})) score += game.counters[id as keyof Counters] * (weight ?? 0)
  for (const [id, bonus] of Object.entries(ending.traitBonuses ?? {})) if (game.traits.includes(id)) score += bonus
  for (const [id, weight] of Object.entries(ending.evidenceWeights ?? {})) score += game.evidence.totals[id as EvidenceId] * (weight ?? 0)
  for (const [id, weight] of Object.entries(ending.situationWeights ?? {})) score += game.situationHistory.filter(situationId => situationId === id).length * weight
  return score
}

export function chooseEnding(game: GameState): Ending {
  const noReturnOffer = endings.find(ending => ending.id === 'no_return_offer')
  const lateBurden = failureBurden(game, 8)
  if (noReturnOffer && lateBurden >= 10) return noReturnOffer
  const internshipExtended = endings.find(ending => ending.id === 'internship_extended')
  const earlyBurden = failureBurden(game) - lateBurden
  if (internshipExtended && earlyBurden >= 18 && lateBurden >= 7 && lateBurden < 10 && recentPositiveEvidence(game) >= 12) return internshipExtended
  const eligible = endings.filter(ending => !['no_return_offer', 'internship_extended'].includes(ending.id) && Number.isFinite(scoreEnding(game, ending)))
  if (eligible.length === 0) return endings.find(ending => ending.id === 'software') as Ending
  return rankEndings(game, eligible)[0] as Ending
}

export function predictedEndings(game: GameState): Ending[] {
  const eligible = endings.filter(ending => ending.id !== 'no_return_offer' && ending.id !== 'internship_extended' && Number.isFinite(scoreEnding(game, ending)))
  return rankEndings(game, eligible).slice(0, 3)
}

export function nearbyEndings(game: GameState): Ending[] {
  const eligible = endings.filter(ending => ending.id !== game.endingId && !['no_return_offer', 'internship_extended'].includes(ending.id) && scoreEnding(game, ending) > Number.NEGATIVE_INFINITY)
  return rankEndings(game, eligible).slice(0, 2)
}

export function reportLines(game: GameState): string[] {
  const lines = topEvidence(game, 2).map(id => formatForIntern(`report.evidence.${id}`, game))
  return lines.length > 0 ? lines : [formatForIntern('report.quiet', game)]
}

export function reportAttentionLines(game: GameState): string[] {
  const recentRisks = sumRisks(game.evidence.weeklyRisks.slice(Math.max(0, game.week - 4), game.week))
  const risk = Object.entries(recentRisks).sort((a, b) => b[1] - a[1]).find(([, value]) => (value ?? 0) > 0)?.[0] as RiskId | undefined
  return risk ? [formatForIntern(`report.risk.${risk}`, game)] : [formatForIntern('report.risk.none', game)]
}

export function reportTrendLines(game: GameState): string[] {
  const recent = sumEvidence(game.evidence.weeklyDeltas.slice(Math.max(0, game.week - 4), game.week))
  const previous = sumEvidence(game.evidence.weeklyDeltas.slice(Math.max(0, game.week - 8), Math.max(0, game.week - 4)))
  if (Object.values(recent).every(value => (value ?? 0) === 0)) return [formatForIntern('report.trend.none', game)]
  const id = evidenceIds.reduce((best, candidate) => (recent[candidate] ?? 0) > (recent[best] ?? 0) ? candidate : best, evidenceIds[0])
  const key = (recent[id] ?? 0) > (previous[id] ?? 0) ? 'report.trend.growing' : 'report.trend.steady'
  return [t(key, { ...internVariables(game), evidence: t(`evidence.${id}`) })]
}

export function strongestEvidence(game: GameState, limit = 5): EvidenceId[] {
  return topEvidence(game, limit)
}

export function formatForIntern(key: string, game: GameState, extra: Record<string, string | number> = {}): string {
  return t(key, { ...internVariables(game), ...extra })
}

export function activityById(id: string): Activity | undefined {
  return activities.find(activity => activity.id === id)
}

export function situationById(id: string): WeeklySituation | undefined {
  return weeklySituations.find(situation => situation.id === id)
}

export function hintForActivity(situation: WeeklySituation | undefined, activityId: string): SituationHint | undefined {
  if (!situation) return undefined
  if (situation.opportunityActivityIds.includes(activityId)) return 'opportunity'
  if (situation.riskActivityIds.includes(activityId)) return 'risk'
  if (situation.relatedActivityIds.includes(activityId)) return 'related'
  return undefined
}

function prepareSituation(game: GameState): GameState {
  const cutoff = Math.max(0, game.situationHistory.length - 8)
  const coolingDown = new Set(game.situationHistory.slice(cutoff))
  const available = weeklySituations.filter(situation => {
    if (situation.minimumWeek > game.week || coolingDown.has(situation.id)) return false
    if (situation.kind === 'rare' && game.rareSituationCount >= 3) return false
    if (situation.maximumPerGame !== undefined) {
      const appearances = game.situationHistory.filter(id => id === situation.id).length
      if (appearances >= situation.maximumPerGame) return false
    }
    return true
  })
  const candidates = available.length > 0 ? available : weeklySituations.filter(situation => situation.minimumWeek <= game.week && (situation.kind !== 'rare' || game.rareSituationCount < 3))
  const kinds = [
    { kind: 'common' as const, weight: 45 },
    { kind: 'opportunity' as const, weight: 25 },
    { kind: 'trouble' as const, weight: 20 },
    { kind: 'rare' as const, weight: game.week >= 5 && game.rareSituationCount < 3 ? 10 : 0 },
  ].filter(item => item.weight > 0 && candidates.some(candidate => candidate.kind === item.kind))
  let selectedKind: (typeof kinds)[number]
  let rngState: number
  ;[selectedKind, rngState] = weightedPick(game.rngState, kinds)
  const kindCandidates = candidates.filter(candidate => candidate.kind === selectedKind.kind)
  let selected: WeeklySituation
  ;[selected, rngState] = weightedPick(rngState, kindCandidates)
  return {
    ...game,
    rngState,
    currentSituationId: selected.id,
    situationHistory: [...game.situationHistory, selected.id],
    rareSituationCount: game.rareSituationCount + (selected.kind === 'rare' ? 1 : 0),
  }
}

function evidenceForResult(
  game: GameState,
  activity: Activity,
  outcome: OutcomeId,
  situation: WeeklySituation | undefined,
  situationHint: SituationHint | undefined,
  weeklyEvidence: Partial<EvidenceTotals>,
): Partial<EvidenceTotals> {
  const deltas: Partial<EvidenceTotals> = {}
  const add = (id: EvidenceId, amount: number) => {
    const room = Math.max(0, 4 - (weeklyEvidence[id] ?? 0) - (deltas[id] ?? 0))
    deltas[id] = (deltas[id] ?? 0) + Math.min(room, amount)
  }
  if (outcome === 'success') add(activity.primaryEvidence, 1)
  if (outcome === 'criticalSuccess') {
    add(activity.primaryEvidence, 2)
    if (activity.secondaryEvidence) add(activity.secondaryEvidence, 1)
  }
  const positive = outcome === 'success' || outcome === 'criticalSuccess'
  if (positive && situationHint === 'related') situation?.evidenceTags.forEach(id => add(id, 1))
  if (outcome === 'criticalSuccess' && situationHint === 'opportunity') situation?.evidenceTags.forEach(id => add(id, 1))
  const recovered = positive && game.eventHistory.some(event => event.activityId === activity.id && event.week >= game.week - 4 && (event.outcome === 'failure' || event.outcome === 'criticalFailure'))
  if (recovered) add('resilience', 1)
  return Object.fromEntries(Object.entries(deltas).filter(([, value]) => (value ?? 0) > 0)) as Partial<EvidenceTotals>
}

function applyEvidence(totals: EvidenceTotals, weekly: Partial<EvidenceTotals>, deltas: Partial<EvidenceTotals>): void {
  for (const [rawId, amount] of Object.entries(deltas)) {
    const id = rawId as EvidenceId
    const value = amount ?? 0
    totals[id] = Math.min(100, totals[id] + value)
    weekly[id] = (weekly[id] ?? 0) + value
  }
}

function riskDeltas(activityId: string, outcome: OutcomeId, scopeCreep: number): Partial<RiskTotals> {
  const deltas: Partial<RiskTotals> = {}
  if (outcome === 'failure') deltas.rework = 1
  if (outcome === 'criticalFailure') deltas.rework = 2
  if (outcome === 'criticalFailure' && activityId === 'mentor_1on1') deltas.lateHelp = 1
  if (outcome === 'criticalFailure' && ['production_incident', 'touch_kubernetes', 'friday_project'].includes(activityId)) deltas.unsafeAction = 1
  if (outcome === 'criticalFailure' && ['pair_programming', 'tech_talk', 'team_lunch', 'demo'].includes(activityId)) deltas.unclearCommunication = 1
  if (scopeCreep > 0) deltas.scopeCreep = scopeCreep
  return deltas
}

function applyRisks(target: RiskTotals, weekly: Partial<RiskTotals>, deltas: Partial<RiskTotals>): void {
  for (const [rawId, amount] of Object.entries(deltas)) {
    const id = rawId as RiskId
    target[id] += amount ?? 0
    weekly[id] = (weekly[id] ?? 0) + (amount ?? 0)
  }
}

function zeroEvidence(): EvidenceTotals {
  return Object.fromEntries(evidenceIds.map(id => [id, 0])) as EvidenceTotals
}

function zeroRisks(): RiskTotals {
  return Object.fromEntries(riskIds.map(id => [id, 0])) as RiskTotals
}

function sumEvidence(deltas: Array<Partial<EvidenceTotals>>): Partial<EvidenceTotals> {
  const total: Partial<EvidenceTotals> = {}
  for (const delta of deltas) for (const [rawId, value] of Object.entries(delta ?? {})) {
    const id = rawId as EvidenceId
    total[id] = (total[id] ?? 0) + (value ?? 0)
  }
  return total
}

function sumRisks(deltas: Array<Partial<RiskTotals>>): Partial<RiskTotals> {
  const total: Partial<RiskTotals> = {}
  for (const delta of deltas) for (const [rawId, value] of Object.entries(delta ?? {})) {
    const id = rawId as RiskId
    total[id] = (total[id] ?? 0) + (value ?? 0)
  }
  return total
}

function topEvidence(game: GameState, limit: number): EvidenceId[] {
  return [...evidenceIds]
    .filter(id => game.evidence.totals[id] > 0)
    .sort((a, b) => game.evidence.totals[b] - game.evidence.totals[a] || a.localeCompare(b))
    .slice(0, limit)
}

function internVariables(game: GameState): Record<string, string> {
  const pronoun = getLocale() === 'en-US' ? 'they' : game.profile.pronoun
  return { name: localizedProfileName(game.profile), pronoun }
}

function normalizeInitialStats(stats: Stats): void {
  const total = statIds.reduce((sum, id) => sum + stats[id], 0)
  if (total >= 330 && total <= 370) return
  const ratio = 350 / total
  for (const id of statIds) stats[id] = Math.round(stats[id] * ratio)
  let difference = 350 - statIds.reduce((sum, id) => sum + stats[id], 0)
  let index = 0
  while (difference !== 0) {
    const id = statIds[index % statIds.length] as keyof Stats
    stats[id] += Math.sign(difference)
    difference -= Math.sign(difference)
    index += 1
  }
}

function applyDeltas<T extends Record<string, number>>(target: T, deltas?: Partial<T>): void {
  if (!deltas) return
  for (const [id, delta] of Object.entries(deltas)) {
    const key = id as keyof T
    target[key] = Math.max(0, Math.min(100, (target[key] ?? 0) + (delta ?? 0))) as T[keyof T]
  }
}

export function localizedProfileName(profile: GameState['profile']): string {
  if (profile.nameKey) return t(profile.nameKey)
  return profile.name
}

function determineOutcome(game: GameState, activity: Activity, situationHint?: SituationHint): [OutcomeId, number] {
  const relevantStats = Object.keys(activity.statDeltas).filter(id => id !== 'chaos' && (activity.statDeltas[id as keyof Stats] ?? 0) > 0) as Array<keyof Stats>
  const aptitude = relevantStats.reduce((sum, id) => sum + game.stats[id], 0) / Math.max(1, relevantStats.length)
  const [random, nextState] = nextRandom(game.rngState)
  let criticalFailureChance = clamp(0.08 - (aptitude - 50) * 0.001, 0.03, 0.12)
  let failureChance = clamp(0.27 - (aptitude - 50) * 0.002, 0.15, 0.35)
  let criticalSuccessChance = clamp(0.12 + (aptitude - 50) * 0.003, 0.08, 0.3)
  if (situationHint === 'opportunity') {
    failureChance = Math.max(0.1, failureChance - 0.05)
    criticalSuccessChance = Math.min(0.35, criticalSuccessChance + 0.05)
  } else if (situationHint === 'risk') {
    criticalFailureChance = Math.max(0.02, criticalFailureChance + 0.03)
    failureChance = Math.min(0.45, failureChance + 0.08)
  }
  if (random < criticalFailureChance) return ['criticalFailure', nextState]
  if (random < criticalFailureChance + failureChance) return ['failure', nextState]
  if (random < 1 - criticalSuccessChance) return ['success', nextState]
  return ['criticalSuccess', nextState]
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function repetitionChaosDelta(previousCount: number): number {
  if (previousCount >= 10) return 2
  if (previousCount >= 5) return 1
  return 0
}

function failureBurden(game: GameState, weeks?: number): number {
  const events = weeks === undefined ? game.eventHistory : game.eventHistory.filter(event => event.week > game.week - weeks)
  return events.reduce((total, event) => {
    if (event.outcome === 'criticalFailure') return total + 2
    if (event.outcome === 'failure') return total + 1
    return total
  }, 0)
}

function recentPositiveEvidence(game: GameState): number {
  return game.evidence.weeklyDeltas
    .slice(Math.max(0, game.week - 8), game.week)
    .reduce((total, week) => total + Object.values(week ?? {}).reduce((sum, value) => sum + (value ?? 0), 0), 0)
}

function rankEndings(game: GameState, candidates: Ending[]): Ending[] {
  if (candidates.length === 0) return []
  const byBaseScore = [...candidates].sort((left, right) => scoreEnding(game, right) - scoreEnding(game, left) || right.priority - left.priority || left.id.localeCompare(right.id))
  const highest = scoreEnding(game, byBaseScore[0] as Ending)
  const closeThreshold = Math.max(3, Math.abs(highest) * 0.03)
  const close = byBaseScore.filter(ending => highest - scoreEnding(game, ending) <= closeThreshold)
  const resolved = close.sort((left, right) => adjustedEndingScore(game, right) - adjustedEndingScore(game, left) || right.priority - left.priority || left.id.localeCompare(right.id))
  return [...resolved, ...byBaseScore.filter(ending => !close.includes(ending))]
}

function adjustedEndingScore(game: GameState, ending: Ending): number {
  let hash = game.seed ^ 0x9e3779b9
  for (const character of ending.id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return scoreEnding(game, ending) + ((hash >>> 0) % 501) / 100
}

function progressTraitsAndUnlock(game: GameState): string | undefined {
  const progress = { ...game.traitProgress }
  for (const trait of traits) {
    if (game.traits.includes(trait.id)) {
      delete progress[trait.id]
      continue
    }
    const current = progress[trait.id] ?? 0
    if (traitCondition(trait.id, game)) {
      progress[trait.id] = Math.min(TRAIT_CONFIRMATION_WEEKS, current + 1)
    } else {
      const decayed = Math.max(0, current - TRAIT_PROGRESS_DECAY)
      if (decayed > 0) progress[trait.id] = decayed
      else delete progress[trait.id]
    }
  }

  game.traitProgress = progress
  const unlocked = [...traits]
    .filter(trait => !game.traits.includes(trait.id) && (progress[trait.id] ?? 0) >= TRAIT_CONFIRMATION_WEEKS)
    .sort((a, b) => b.priority - a.priority)[0]
  if (!unlocked) return undefined
  game.traits.push(unlocked.id)
  delete game.traitProgress[unlocked.id]
  return unlocked.id
}

function unlockAchievements(game: GameState, scheduledActivityIds: string[]): string[] {
  const newlyUnlocked: string[] = []
  const has = (id: string): boolean => game.unlockedAchievementIds.includes(id) || newlyUnlocked.includes(id)
  const unlock = (id: (typeof achievementIds)[number]): void => {
    if (!has(id)) newlyUnlocked.push(id)
  }
  const counts = game.activityCounts as Record<string, number> & { team_lunch: number; friday_project: number }
  const count = (activityId: string): number => counts[activityId] ?? 0
  const thisWeekResults = game.pendingResults

  if (count('team_lunch') >= 4) unlock('delivery_convoy')
  if (scheduledActivityIds.every(id => id === 'team_lunch')) unlock('quite_hungry')
  if (count('friday_project') >= 6) unlock('friday_grind_king')
  if (game.eventHistory.some(event => event.activityId === 'production_incident' && event.outcome === 'criticalFailure')) unlock('dont_touch_production')
  if (game.eventHistory.filter(event => event.tags.includes('aviation')).length >= 4) unlock('route_planning_master')

  if (count('fix_bug') >= 8) unlock('fix_bug_grinder')
  if (count('build_feature') >= 8) unlock('crud_hero')
  if (count('write_tests') >= 8) unlock('test_marathon')
  if (count('read_docs') >= 8) unlock('docs_master')
  if (count('pair_programming') >= 8) unlock('duo_ranked')
  if (count('tech_talk') >= 8) unlock('tech_standup_show')
  if (count('fix_bug') >= 6 && count('write_tests') >= 6) unlock('release_gatekeeper')
  if (count('mentor_1on1') >= 8) unlock('counseling_room')
  if (count('demo') >= 8) unlock('demo_perpetual')
  if (count('production_incident') >= 8) unlock('incident_growth')
  if (count('touch_kubernetes') >= 8) unlock('cloud_native_pro')
  if (count('friday_project') >= 10) unlock('friday_hackathon_resident')

  if (thisWeekResults.length === 3 && thisWeekResults.every(result => result.outcome === 'criticalSuccess')) unlock('grand_slam')
  if (thisWeekResults.length === 3 && thisWeekResults.every(result => result.outcome === 'failure' || result.outcome === 'criticalFailure')) unlock('team_wipe')

  if (game.eventHistory.some(event => {
    if (event.outcome !== 'success' && event.outcome !== 'criticalSuccess') return false
    return game.eventHistory.some(previous => previous.activityId === event.activityId && previous.week >= event.week - 4 && previous.week < event.week && previous.outcome === 'criticalFailure')
  })) unlock('comeback_reversal')

  if (game.stats.chaos >= 90) unlock('chaos_lord')
  if (game.week >= 12 && game.stats.chaos <= 15) unlock('cyber_zen')
  if (game.evidence.risks.scopeCreep >= 10) unlock('scope_inflation')
  if (game.stats.social >= 85) unlock('social_ceiling')
  if (game.stats.curiosity >= 85) unlock('ten_thousand_whys')
  if (game.stats.independence >= 85) unlock('solo_king')
  if (game.traits.length >= 8) unlock('trait_hoarder')
  if (game.counters.questionsAsked >= 20) unlock('question_barrage')
  if (game.counters.bugsFixed >= 20) unlock('bug_street_sweeper')
  if (game.week === 24) unlock('internship_survivor')

  return newlyUnlocked
}

function traitCondition(id: string, game: GameState): boolean {
  const count = (activityId: string) => game.activityCounts[activityId] ?? 0
  const socialCount = count('team_lunch') + count('mentor_1on1') + count('demo')
  const meetingCount = count('tech_talk') + count('team_lunch') + count('demo')
  const aviationEvents = game.eventHistory.filter(event => event.tags.includes('aviation'))
  switch (id) {
    case 'curious': return game.stats.curiosity >= 65
    case 'bug_hunter': return count('fix_bug') >= 5 && game.stats.technical >= 60
    case 'doc_goblin': return count('read_docs') >= 5 && game.stats.curiosity >= 60
    case 'test_guardian': return count('write_tests') >= 5 && game.stats.technical >= 60
    case 'coffee_powered': return game.week >= 8 && socialCount >= 6
    case 'meeting_goblin': return meetingCount >= 10 && game.stats.social >= 65
    case 'architecture_brain': return game.stats.technical >= 75 && game.stats.curiosity >= 70 && ['bug_hunter', 'doc_goblin'].some(trait => game.traits.includes(trait))
    case 'open_source_addict': return count('friday_project') >= 5 && game.stats.creativity >= 65
    case 'startup_dreamer': return count('friday_project') >= 6 && game.stats.ambition >= 65 && game.stats.chaos >= 55
    case 'kubernetes_believer': return count('touch_kubernetes') >= 5 && game.stats.curiosity >= 65
    case 'aviation_nerd': return aviationEvents.length >= 3 && new Set(aviationEvents.map(event => event.activityId)).size >= 2
    case 'chaotic_good': return game.stats.chaos >= 75 && game.traits.length >= 4
    default: return false
  }
}

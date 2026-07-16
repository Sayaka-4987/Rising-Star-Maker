import { t } from '../content/text'
import { activities, endings, events, observationKeys, profileNameKeys, traits } from '../data/gameData'
import { nextRandom, pickOne, randomInt } from './rng'
import { counterIds, statIds, type Activity, type Counters, type Ending, type EventResult, type GameState, type GenderId, type OutcomeId, type Stats } from './types'

const genderOptions: Array<{ id: GenderId; pronoun: string }> = [
  { id: 'male', pronoun: '他' },
  { id: 'female', pronoun: '她' },
  { id: 'nonbinary', pronoun: 'ta' },
]

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
    schemaVersion: 2,
    seed,
    rngState,
    phase: 'reveal',
    week: 1,
    profile: { name, gender: gender.id, pronoun: gender.pronoun, portraitId: `portrait.${portraitIndex}`, observationKey },
    stats,
    traits: [],
    counters: Object.fromEntries(counterIds.map(id => [id, 0])) as Counters,
    activityCounts: Object.fromEntries(activities.map(activity => [activity.id, 0])),
    selectedActivityIds: [],
    pendingResults: [],
    resultIndex: 0,
    eventHistory: [],
    updatedAt: new Date().toISOString(),
  }
}

export function toggleActivity(game: GameState, activityId: string): GameState {
  if (game.phase !== 'planning') return game
  const selected = game.selectedActivityIds.length < 3
    ? [...game.selectedActivityIds, activityId]
    : game.selectedActivityIds
  return { ...game, selectedActivityIds: selected }
}

export function removeSelectedActivity(game: GameState, index: number): GameState {
  if (game.phase !== 'planning' || index < 0 || index >= game.selectedActivityIds.length) return game
  return { ...game, selectedActivityIds: game.selectedActivityIds.filter((_, selectedIndex) => selectedIndex !== index) }
}

export function resolveSelectedWeek(game: GameState): GameState {
  if (game.phase !== 'planning' || game.selectedActivityIds.length !== 3) return game
  let working: GameState = { ...game, stats: { ...game.stats }, counters: { ...game.counters }, activityCounts: { ...game.activityCounts }, traits: [...game.traits], eventHistory: [...game.eventHistory] }
  const pendingResults: EventResult[] = []

  for (const activityId of game.selectedActivityIds) {
    const activity = activities.find(item => item.id === activityId)
    if (!activity) continue
    applyDeltas(working.stats, activity.statDeltas)
    const previousCount = working.activityCounts[activityId] ?? 0
    working.activityCounts[activityId] = previousCount + 1
    applyDeltas(working.stats, { chaos: repetitionChaosDelta(previousCount) })

    let outcome: OutcomeId
    ;[outcome, working.rngState] = determineOutcome(working, activity)
    const event = events.find(candidate => candidate.activityId === activityId && candidate.outcome === outcome)
    if (!event) throw new Error(`Missing ${outcome} event for ${activityId}`)
    let textKey
    ;[textKey, working.rngState] = pickOne(working.rngState, event.textKeys)
    applyDeltas(working.stats, event.statDeltas)
    applyDeltas(working.counters, event.counterDeltas)

    const unlockedTraitId = findNextTrait(working)
    if (unlockedTraitId) working.traits.push(unlockedTraitId)
    const text = formatForIntern(textKey, working)
    const result: EventResult = {
      eventId: event.id,
      activityId,
      textKey,
      text,
      outcome,
      tags: event.tags ?? [],
      highlight: event.highlight ?? false,
      unlockedTraitId,
    }
    pendingResults.push(result)
    working.eventHistory.push(result)
  }

  return { ...working, phase: 'results', pendingResults, resultIndex: 0, selectedActivityIds: [] }
}

export function advanceFromResult(game: GameState): GameState {
  if (game.phase !== 'results') return game
  if (game.resultIndex < game.pendingResults.length - 1) return { ...game, resultIndex: game.resultIndex + 1 }
  if (game.week === 24) {
    const ending = chooseEnding(game)
    return { ...game, phase: 'ending', endingId: ending.id, pendingResults: [] }
  }
  if (game.week % 4 === 0) return { ...game, phase: 'report', pendingResults: [] }
  return nextWeek(game)
}

export function advanceFromReport(game: GameState): GameState {
  return game.phase === 'report' ? nextWeek(game) : game
}

export function revealComplete(game: GameState): GameState {
  return game.phase === 'reveal' ? { ...game, phase: 'planning' } : game
}

export function scoreEnding(game: GameState, ending: Ending, ignoreRequirements = false): number {
  if (!ignoreRequirements && ending.requiredTraits?.some(id => !game.traits.includes(id))) return Number.NEGATIVE_INFINITY
  let score = 0
  for (const [id, weight] of Object.entries(ending.statWeights)) score += game.stats[id as keyof Stats] * (weight ?? 0)
  for (const [id, weight] of Object.entries(ending.activityWeights ?? {})) score += (game.activityCounts[id] ?? 0) * weight
  for (const [id, weight] of Object.entries(ending.counterWeights ?? {})) score += game.counters[id as keyof Counters] * (weight ?? 0)
  for (const [id, bonus] of Object.entries(ending.traitBonuses ?? {})) if (game.traits.includes(id)) score += bonus
  return score
}

export function chooseEnding(game: GameState): Ending {
  const noReturnOffer = endings.find(ending => ending.id === 'no_return_offer')
  if (noReturnOffer && failureBurden(game) >= 36) return noReturnOffer
  return [...endings].sort((left, right) => {
    const scoreDelta = scoreEnding(game, right) - scoreEnding(game, left)
    return scoreDelta || right.priority - left.priority || left.id.localeCompare(right.id)
  })[0] as Ending
}

export function predictedEndings(game: GameState): Ending[] {
  const eligible = endings.filter(ending => ending.id !== 'no_return_offer' && !ending.requiredTraits?.some(id => !game.traits.includes(id)))
  return [...eligible].sort((a, b) => scoreEnding(game, b) - scoreEnding(game, a) || b.priority - a.priority).slice(0, 3)
}

export function reportLines(game: GameState): string[] {
  const variables = internVariables(game)
  const options: Array<[number, string, number]> = [
    [game.counters.questionsAsked, 'report.questions', game.counters.questionsAsked],
    [game.counters.docsRead, 'report.docs', game.counters.docsRead],
    [game.counters.bugsFixed, 'report.bugs', game.counters.bugsFixed],
    [game.counters.demosGiven, 'report.demos', game.counters.demosGiven],
    [game.counters.sideProjects, 'report.projects', game.counters.sideProjects],
    [game.counters.incidentsObserved, 'report.incidents', game.counters.incidentsObserved],
    [game.counters.socialEscapes, 'report.social', game.counters.socialEscapes],
  ]
  const lines = options
    .filter(([value]) => value > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map(([, key, count]) => t(key, { ...variables, count }))
  return lines.length > 0 ? lines : [t('report.quiet', variables)]
}

export function formatForIntern(key: string, game: GameState, extra: Record<string, string | number> = {}): string {
  return t(key, { ...internVariables(game), ...extra })
}

export function activityById(id: string): Activity | undefined {
  return activities.find(activity => activity.id === id)
}

function nextWeek(game: GameState): GameState {
  return { ...game, phase: 'planning', week: game.week + 1, pendingResults: [], resultIndex: 0 }
}

function internVariables(game: GameState): Record<string, string> {
  return { name: game.profile.name, pronoun: game.profile.pronoun }
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

function determineOutcome(game: GameState, activity: Activity): [OutcomeId, number] {
  const relevantStats = Object.keys(activity.statDeltas).filter(id => id !== 'chaos' && (activity.statDeltas[id as keyof Stats] ?? 0) > 0) as Array<keyof Stats>
  const aptitude = relevantStats.reduce((sum, id) => sum + game.stats[id], 0) / Math.max(1, relevantStats.length)
  const [random, nextState] = nextRandom(game.rngState)
  const criticalFailureChance = clamp(0.08 - (aptitude - 50) * 0.001, 0.03, 0.12)
  const failureChance = clamp(0.27 - (aptitude - 50) * 0.002, 0.15, 0.35)
  const criticalSuccessChance = clamp(0.12 + (aptitude - 50) * 0.003, 0.08, 0.3)
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

function failureBurden(game: GameState): number {
  return game.eventHistory.reduce((total, event) => {
    if (event.outcome === 'criticalFailure') return total + 2
    if (event.outcome === 'failure') return total + 1
    return total
  }, 0) + game.counters.scopeCreep
}

function findNextTrait(game: GameState): string | undefined {
  return [...traits]
    .filter(trait => !game.traits.includes(trait.id) && traitCondition(trait.id, game))
    .sort((a, b) => b.priority - a.priority)[0]?.id
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

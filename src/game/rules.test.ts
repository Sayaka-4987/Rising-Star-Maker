import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, getAvailableLocales, getLocale, registerLocale, setLocale, t } from '../content/text'
import { endings } from '../data/gameData'
import { validateContent } from '../data/validate'
import { TOTAL_WEEKS, scaleLegacyWeek } from './config'
import { advanceFromFeedback, chooseEnding, createNewGame, removeSelectedActivity, resolveSelectedWeek, revealComplete, scoreEnding, toggleActivity } from './rules'
import { counterIds, evidenceIds, statIds, type Ending, type GameState } from './types'

const schedules = [
  ['fix_bug', 'read_docs', 'pair_programming'],
  ['build_feature', 'team_lunch', 'friday_project'],
  ['write_tests', 'demo', 'touch_kubernetes'],
  ['mentor_1on1', 'tech_talk', 'production_incident'],
]

function play(seed: number, schedule: string[][] = schedules): GameState {
  let game = revealComplete(createNewGame(seed))
  while (!game.endingId) {
    if (game.phase === 'action') {
      for (const activity of schedule[(game.week - 1) % schedule.length] as string[]) game = toggleActivity(game, activity)
      game = resolveSelectedWeek(game)
    } else if (game.phase === 'feedback') {
      game = advanceFromFeedback(game)
    }
  }
  return game
}

function gameForEnding(ending: Ending): GameState {
  const game = createNewGame(4987)
  const stats = Object.fromEntries(statIds.map(id => [id, ending.statWeights[id] ? 100 : 0])) as GameState['stats']
  const counters = Object.fromEntries(counterIds.map(id => [id, ending.counterWeights?.[id] ? TOTAL_WEEKS : 0])) as GameState['counters']
  const evidence = Object.fromEntries(evidenceIds.map(id => [id, ending.evidenceWeights?.[id] || ending.minimumEvidence?.[id] ? 100 : 0])) as GameState['evidence']['totals']
  const weightedActivities = Object.keys(ending.activityWeights ?? {})
  const activityCounts = Object.fromEntries([...new Set([...weightedActivities, ...Object.keys(ending.minimumActivities ?? {})])].map(id => [id, Math.max(TOTAL_WEEKS, ending.minimumActivities?.[id] ?? 0)]))
  return {
    ...game,
    week: TOTAL_WEEKS,
    stats,
    counters,
    traits: [...(ending.requiredTraits ?? [])],
    activityCounts,
    weeklyMysteryActivityIds: [],
    situationHistory: [...new Set([...(ending.requiredSituationIds ?? []), ...Object.keys(ending.situationWeights ?? {})])],
    evidence: { ...game.evidence, totals: evidence },
  }
}

describe('game content', () => {
  it('has complete and internally consistent MVP content', () => {
    expect(validateContent()).toEqual([])
  })

  it('can register another locale and falls back to Chinese for missing keys', () => {
    registerLocale('test', { 'button.new': 'New intern' })
    expect(setLocale('test')).toBe(true)
    expect(t('button.new')).toBe('New intern')
    expect(t('button.continue')).toBe('继续观察')
    expect(getAvailableLocales()).toContain('test')
    expect(setLocale(DEFAULT_LOCALE)).toBe(true)
    expect(getLocale()).toBe(DEFAULT_LOCALE)
  })
})

describe('game rules', () => {
  it('creates all supported gender identities and uses ta for nonbinary interns', () => {
    const games = Array.from({ length: 100 }, (_, seed) => createNewGame(seed + 1))
    expect(new Set(games.map(game => game.profile.gender))).toEqual(new Set(['male', 'female', 'nonbinary']))
    expect(games.filter(game => game.profile.gender === 'nonbinary').every(game => game.profile.pronoun === 'ta')).toBe(true)
  })

  it('finishes a complete 12-week game', () => {
    const game = play(4987)
    expect(game.week).toBe(TOTAL_WEEKS)
    expect(game.eventHistory).toHaveLength(TOTAL_WEEKS * 3)
    expect(game.situationHistory).toHaveLength(TOTAL_WEEKS)
    expect(game.endingId).toBeTruthy()
  })

  it('draws deterministic weekly situations with cooldown and a rare cap', () => {
    const first = play(20260716)
    const second = play(20260716)
    expect(second.situationHistory).toEqual(first.situationHistory)
    expect(first.rareSituationCount).toBeLessThanOrEqual(3)
    for (let index = 0; index < first.situationHistory.length; index += 1) {
      expect(first.situationHistory.slice(Math.max(0, index - scaleLegacyWeek(8)), index)).not.toContain(first.situationHistory[index])
    }
  })

  it('records evidence from successful work and caps one dimension at four per week', () => {
    const game = play(4987, [['write_tests', 'write_tests', 'write_tests']])
    expect(game.evidence.totals.reliability).toBeGreaterThan(0)
    expect(game.evidence.weeklyDeltas.every(delta => (delta.reliability ?? 0) <= 4)).toBe(true)
  })

  it('allows repeated activities and removes only the selected slot', () => {
    let game = revealComplete(createNewGame(4987))
    game = toggleActivity(game, 'fix_bug')
    game = toggleActivity(game, 'fix_bug')
    game = toggleActivity(game, 'read_docs')
    expect(game.selectedActivityIds).toEqual(['fix_bug', 'fix_bug', 'read_docs'])
    game = removeSelectedActivity(game, 0)
    expect(game.selectedActivityIds).toEqual(['fix_bug', 'read_docs'])
  })

  it('adds chaos when the same activity is scheduled too often', () => {
    let game = revealComplete(createNewGame(4987))
    game = { ...game, activityCounts: { ...game.activityCounts, fix_bug: 5 }, stats: { ...game.stats, chaos: 40 } }
    game = toggleActivity(game, 'fix_bug')
    game = toggleActivity(game, 'fix_bug')
    game = toggleActivity(game, 'fix_bug')
    game = resolveSelectedWeek(game)
    expect(game.stats.chaos).toBeGreaterThanOrEqual(43)
  })

  it('withholds the return offer after too many failures', () => {
    const game = play(4987)
    const failedHistory = game.eventHistory.map((event, index) => ({ ...event, outcome: index >= scaleLegacyWeek(24) ? 'criticalFailure' as const : event.outcome }))
    expect(chooseEnding({ ...game, eventHistory: failedHistory }).id).toBe('no_return_offer')
  })

  it('does not deny an offer solely for early failures that were later corrected', () => {
    const game = play(4987)
    const failedHistory = game.eventHistory.map((event, index) => ({ ...event, outcome: index < scaleLegacyWeek(20) ? 'criticalFailure' as const : 'success' as const }))
    expect(chooseEnding({ ...game, eventHistory: failedHistory }).id).not.toBe('no_return_offer')
  })

  it('does not let no-return-offer override a qualified interest ending', () => {
    const indieEnding = endings.find(ending => ending.id === 'indie_game_creator') as Ending
    const game = gameForEnding(indieEnding)
    const eventHistory = Array.from({ length: 7 }, (_, index) => ({
      eventId: 'friday_project',
      activityId: 'friday_project',
      textKey: '',
      text: '',
      outcome: 'failure' as const,
      tags: ['gaming'],
      highlight: false,
      week: 9 + Math.floor(index / 2),
    }))
    expect(chooseEnding({ ...game, eventHistory }).id).toBe('indie_game_creator')
  })

  it('extends an internship after a difficult start and measurable late recovery', () => {
    const game = play(4987)
    const eventHistory = game.eventHistory.map((event, index) => ({
      ...event,
      outcome: index < scaleLegacyWeek(14)
        ? 'criticalFailure' as const
        : index >= scaleLegacyWeek(48) && index < scaleLegacyWeek(55)
          ? 'failure' as const
          : 'success' as const,
    }))
    const weeklyDeltas = game.evidence.weeklyDeltas.map((delta, index) => index >= scaleLegacyWeek(16) ? { ...delta, engineering: 2 } : delta)
    expect(chooseEnding({ ...game, eventHistory, evidence: { ...game.evidence, weeklyDeltas } }).id).toBe('internship_extended')
  })

  it('is deterministic for the same seed and choices', () => {
    const first = play(20260716)
    const second = play(20260716)
    expect(second.eventHistory).toEqual(first.eventHistory)
    expect(second.traits).toEqual(first.traits)
    expect(second.endingId).toBe(first.endingId)
  })

  it('can produce all four activity outcomes', () => {
    const outcomes = new Set(Array.from({ length: 200 }, (_, seed) => play(seed + 1)).flatMap(game => game.eventHistory.map(event => event.outcome)))
    expect(outcomes).toEqual(new Set(['criticalFailure', 'failure', 'success', 'criticalSuccess']))
  })

  it('keeps all four outcomes meaningful across 1000 games', () => {
    const counts = { criticalFailure: 0, failure: 0, success: 0, criticalSuccess: 0 }
    for (let seed = 1; seed <= 1000; seed += 1) {
      for (const event of play(seed).eventHistory) counts[event.outcome] += 1
    }
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    expect(counts.criticalFailure / total).toBeGreaterThan(0.02)
    expect(counts.failure / total).toBeGreaterThan(0.1)
    expect(counts.success / total).toBeGreaterThan(0.35)
    expect(counts.criticalSuccess / total).toBeGreaterThan(0.05)
  })

  it('keeps no-return-offer outcomes uncommon under a balanced schedule', () => {
    const noOfferCount = Array.from({ length: 1000 }, (_, seed) => play(seed + 1).endingId)
      .filter(endingId => endingId === 'no_return_offer').length
    expect(noOfferCount).toBeGreaterThan(5)
    expect(noOfferCount).toBeLessThan(200)
  })

  it('keeps every career ending signature satisfiable and able to win its focused state', () => {
    const careerEndings = endings.filter(ending => !['no_return_offer', 'internship_extended', 'left_for_better_offer'].includes(ending.id))
    expect(careerEndings).toHaveLength(37)
    const rarityRank: Record<Ending['rarity'], number> = { common: 1, rare: 2, epic: 3, legendary: 4 }
    for (const ending of careerEndings) {
      const game = gameForEnding(ending)
      expect(Number.isFinite(scoreEnding(game, ending)), ending.id).toBe(true)
      const eligible = careerEndings.filter(candidate => Number.isFinite(scoreEnding(game, candidate)))
      const selected = chooseEnding(game)
      const highestEligibleRarity = Math.max(...eligible.map(candidate => rarityRank[candidate.rarity]))
      expect(rarityRank[selected.rarity], ending.id).toBe(highestEligibleRarity)
    }
  })

  it('produces varied endings from natural focused schedules', () => {
    const focusedSchedules = [
      ['fix_bug', 'write_tests', 'production_incident'],
      ['build_feature', 'demo', 'team_lunch'],
      ['read_docs', 'tech_talk', 'pair_programming'],
      ['fix_bug', 'read_docs', 'write_tests'],
      ['friday_project', 'build_feature', 'read_docs'],
      ['friday_project', 'mentor_1on1', 'demo'],
      ['friday_project', 'build_feature', 'team_lunch'],
      ['build_feature', 'read_docs', 'team_lunch'],
      ['touch_kubernetes', 'production_incident', 'friday_project'],
    ]
    const endingIds = new Set<string>()
    for (const schedule of focusedSchedules) {
      for (let seed = 1; seed <= 300; seed += 1) {
        const endingId = play(seed, [schedule]).endingId
        if (endingId !== 'no_return_offer') endingIds.add(endingId ?? '')
      }
    }
    expect(endingIds.size).toBeGreaterThanOrEqual(10)
    expect([...endingIds].every(id => endings.some(ending => ending.id === id))).toBe(true)
  })

  it('keeps the 10000-game multi-strategy distribution diverse', () => {
    const strategies = [
      ['fix_bug', 'build_feature', 'write_tests'],
      ['build_feature', 'build_feature', 'demo'],
      ['fix_bug', 'fix_bug', 'production_incident'],
      ['build_feature', 'demo', 'write_tests'],
      ['write_tests', 'write_tests', 'fix_bug'],
      ['read_docs', 'write_tests', 'production_incident'],
      ['read_docs', 'read_docs', 'write_tests'],
      ['production_incident', 'production_incident', 'write_tests'],
      ['touch_kubernetes', 'touch_kubernetes', 'production_incident'],
      ['write_tests', 'touch_kubernetes', 'fix_bug'],
      ['read_docs', 'build_feature', 'write_tests'],
      ['read_docs', 'read_docs', 'mentor_1on1'],
      ['read_docs', 'build_feature', 'tech_talk'],
      ['read_docs', 'read_docs', 'tech_talk'],
      ['build_feature', 'mentor_1on1', 'demo'],
      ['mentor_1on1', 'pair_programming', 'team_lunch'],
      ['demo', 'read_docs', 'production_incident'],
      ['demo', 'demo', 'team_lunch'],
      ['tech_talk', 'tech_talk', 'read_docs'],
      ['fix_bug', 'production_incident', 'demo'],
      ['mentor_1on1', 'demo', 'team_lunch'],
      ['read_docs', 'read_docs', 'tech_talk'],
      ['pair_programming', 'pair_programming', 'tech_talk'],
      ['friday_project', 'friday_project', 'read_docs'],
      ['friday_project', 'friday_project', 'build_feature'],
      ['friday_project', 'friday_project', 'friday_project'],
      ['fix_bug', 'read_docs', 'pair_programming'],
      ['friday_project', 'team_lunch', 'read_docs'],
    ]
    const counts = new Map<string, number>()
    for (let seed = 1; seed <= 10000; seed += 1) {
      const endingId = play(seed, [strategies[(seed - 1) % strategies.length] as string[]]).endingId as string
      counts.set(endingId, (counts.get(endingId) ?? 0) + 1)
    }
    const noOfferRate = (counts.get('no_return_offer') ?? 0) / 10000
    const extensionRate = (counts.get('internship_extended') ?? 0) / 10000
    const earlyLeaveRate = (counts.get('left_for_better_offer') ?? 0) / 10000
    const largestPositiveShare = Math.max(...[...counts.entries()].filter(([id]) => !['no_return_offer', 'internship_extended', 'left_for_better_offer'].includes(id)).map(([, count]) => count / 10000))
    expect(counts.size).toBeGreaterThanOrEqual(20)
    expect(noOfferRate).toBeGreaterThan(0.02)
    expect(noOfferRate).toBeLessThan(0.12)
    expect(extensionRate).toBeLessThan(0.15)
    expect(earlyLeaveRate).toBeGreaterThan(0.05)
    expect(earlyLeaveRate).toBeLessThan(0.15)
    expect(largestPositiveShare).toBeLessThan(0.33)
  }, 30000)

  it('never exposes hidden stats in event text', () => {
    const game = play(77)
    expect(game.eventHistory.every(event => !/[+-]\d/.test(event.text))).toBe(true)
  })
})

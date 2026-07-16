import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, getAvailableLocales, getLocale, registerLocale, setLocale, t } from '../content/text'
import { validateContent } from '../data/validate'
import { advanceFromReport, advanceFromResult, chooseEnding, createNewGame, removeSelectedActivity, resolveSelectedWeek, revealComplete, toggleActivity } from './rules'
import type { GameState } from './types'

const schedules = [
  ['fix_bug', 'read_docs', 'pair_programming'],
  ['build_feature', 'team_lunch', 'friday_project'],
  ['write_tests', 'demo', 'touch_kubernetes'],
  ['mentor_1on1', 'tech_talk', 'production_incident'],
]

function play(seed: number, schedule: string[][] = schedules): GameState {
  let game = revealComplete(createNewGame(seed))
  while (game.phase !== 'ending') {
    if (game.phase === 'planning') {
      for (const activity of schedule[(game.week - 1) % schedule.length] as string[]) game = toggleActivity(game, activity)
      game = resolveSelectedWeek(game)
    } else if (game.phase === 'results') {
      game = advanceFromResult(game)
    } else if (game.phase === 'report') {
      game = advanceFromReport(game)
    }
  }
  return game
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

  it('finishes a complete 24-week game', () => {
    const game = play(4987)
    expect(game.week).toBe(24)
    expect(game.eventHistory).toHaveLength(72)
    expect(game.endingId).toBeTruthy()
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
    const failedHistory = game.eventHistory.map((event, index) => ({ ...event, outcome: index < 20 ? 'criticalFailure' as const : event.outcome }))
    expect(chooseEnding({ ...game, eventHistory: failedHistory }).id).toBe('no_return_offer')
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

  it('keeps every positive ending reachable', () => {
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
    expect(endingIds).toEqual(new Set(['software', 'product', 'research', 'technical_sales', 'developer_relations', 'staff', 'open_source', 'founder', 'flight', 'kubernetes']))
  })

  it('never exposes hidden stats in event text', () => {
    const game = play(77)
    expect(game.eventHistory.every(event => !/[+-]\d/.test(event.text))).toBe(true)
  })
})

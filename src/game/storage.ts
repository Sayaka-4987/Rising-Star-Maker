import { evidenceIds, riskIds, type EvidenceTotals, type GameState, type HumanDex, type RiskTotals } from './types'

const SAVE_KEY = 'rising-star-maker.save.v2'
const LEGACY_SAVE_KEY = 'rising-star-maker.save.v1'
const DEX_KEY = 'rising-star-maker.dex.v1'

export function loadGame(): GameState | null {
  const value = read<unknown>(SAVE_KEY, candidate => typeof candidate === 'object' && candidate !== null)
  if (!value) return null
  if ((value as GameState).schemaVersion === 3) {
    const game = value as GameState
    return { ...game, evidence: { ...game.evidence, weeklyRisks: game.evidence.weeklyRisks ?? [] } }
  }
  if ((value as { schemaVersion?: number }).schemaVersion === 2) return migrateV2(value as LegacyGameState)
  return null
}

export function saveGame(game: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, updatedAt: new Date().toISOString() }))
}

export function clearGame(): void {
  localStorage.removeItem(SAVE_KEY)
  localStorage.removeItem(LEGACY_SAVE_KEY)
}

export function emptyDex(): HumanDex {
  return { schemaVersion: 1, discoveredTraitIds: [], discoveredEndingIds: [], gamesCompleted: 0 }
}

export function loadDex(): HumanDex {
  return read<HumanDex>(DEX_KEY, value => value.schemaVersion === 1 && Array.isArray(value.discoveredTraitIds)) ?? emptyDex()
}

export function saveDex(dex: HumanDex): void {
  localStorage.setItem(DEX_KEY, JSON.stringify(dex))
}

export function clearAllData(): void {
  localStorage.removeItem(SAVE_KEY)
  localStorage.removeItem(LEGACY_SAVE_KEY)
  localStorage.removeItem(DEX_KEY)
}

function read<T>(key: string, validate: (value: T) => boolean): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const value = JSON.parse(raw) as T
    return validate(value) ? value : null
  } catch {
    return null
  }
}

type LegacyGameState = Omit<GameState, 'schemaVersion' | 'phase' | 'currentSituationId' | 'situationHistory' | 'rareSituationCount' | 'evidence' | 'eventHistory'> & {
  schemaVersion: 2
  phase: 'reveal' | 'planning' | 'results' | 'report' | 'ending'
  eventHistory: Array<Omit<GameState['eventHistory'][number], 'week' | 'situationHint' | 'evidenceDeltas'>>
}

function migrateV2(legacy: LegacyGameState): GameState {
  const wasReport = legacy.phase === 'report'
  const phase: GameState['phase'] = legacy.phase === 'reveal'
    ? 'reveal'
    : legacy.phase === 'results' || legacy.phase === 'ending'
      ? 'feedback'
      : 'action'
  const week = wasReport ? Math.min(24, legacy.week + 1) : legacy.week
  return {
    ...legacy,
    schemaVersion: 3,
    phase,
    week,
    eventHistory: legacy.eventHistory.map((event, index) => ({ ...event, week: Math.floor(index / 3) + 1 })),
    currentSituationId: '',
    situationHistory: [],
    rareSituationCount: 0,
    evidence: {
      totals: Object.fromEntries(evidenceIds.map(id => [id, 0])) as EvidenceTotals,
      weeklyDeltas: [],
      risks: Object.fromEntries(riskIds.map(id => [id, 0])) as RiskTotals,
      weeklyRisks: [],
    },
  }
}

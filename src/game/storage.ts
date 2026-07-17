import { evidenceIds, riskIds, type EvidenceTotals, type GameState, type HumanDex, type RiskTotals } from './types'

const SAVE_KEY = 'rising-star-maker.save.v2'
const LEGACY_SAVE_KEY = 'rising-star-maker.save.v1'
const DEX_KEY = 'rising-star-maker.dex.v1'

export function loadGame(): GameState | null {
  const value = read<unknown>(SAVE_KEY, candidate => typeof candidate === 'object' && candidate !== null)
  if (!value) return null
  if ((value as GameState).schemaVersion === 4) {
    const game = value as GameState
    return {
      ...game,
      endingId: game.endingId === 'developer_relations' ? 'technical_community' : game.endingId,
      evidence: { ...game.evidence, weeklyRisks: game.evidence.weeklyRisks ?? [] },
    }
  }
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
  const dex = read<HumanDex>(DEX_KEY, value => value.schemaVersion === 1 && Array.isArray(value.discoveredTraitIds)) ?? emptyDex()
  return {
    ...dex,
    discoveredEndingIds: dex.discoveredEndingIds.map(id => id === 'developer_relations' ? 'technical_community' : id),
  }
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

type LegacyGameState = never

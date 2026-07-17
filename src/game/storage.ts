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
      pendingAchievementIds: game.pendingAchievementIds ?? [],
      unlockedAchievementIds: game.unlockedAchievementIds ?? [],
      evidence: { ...game.evidence, weeklyRisks: game.evidence.weeklyRisks ?? [] },
      traitProgress: game.traitProgress ?? {},
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
  return { schemaVersion: 2, discoveredTraitIds: [], discoveredEndingIds: [], discoveredAchievementIds: [], gamesCompleted: 0 }
}

export function loadDex(): HumanDex {
  const rawDex = read<unknown>(
    DEX_KEY,
    value => typeof value === 'object' && value !== null,
  )
  const data = (rawDex ?? {}) as Partial<HumanDex> & {
    schemaVersion?: number
    discoveredTraitIds?: unknown
    discoveredEndingIds?: unknown
    discoveredAchievementIds?: unknown
    gamesCompleted?: unknown
  }
  const hasCoreArrays = Array.isArray(data.discoveredTraitIds) && Array.isArray(data.discoveredEndingIds)
  const gamesCompleted = typeof data.gamesCompleted === 'number' ? data.gamesCompleted : 0
  let dex = emptyDex()
  if (hasCoreArrays) {
    dex = {
      schemaVersion: 2,
      discoveredTraitIds: data.discoveredTraitIds as string[],
      discoveredEndingIds: data.discoveredEndingIds as string[],
      discoveredAchievementIds: Array.isArray(data.discoveredAchievementIds) ? data.discoveredAchievementIds as string[] : [],
      gamesCompleted,
    } as HumanDex
  }
  return {
    ...dex,
    discoveredEndingIds: dex.discoveredEndingIds.map(id => id === 'developer_relations' ? 'technical_community' : id),
    discoveredAchievementIds: dex.discoveredAchievementIds ?? [],
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

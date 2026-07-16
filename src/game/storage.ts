import type { GameState, HumanDex } from './types'

const SAVE_KEY = 'rising-star-maker.save.v2'
const LEGACY_SAVE_KEY = 'rising-star-maker.save.v1'
const DEX_KEY = 'rising-star-maker.dex.v1'

export function loadGame(): GameState | null {
  return read<GameState>(SAVE_KEY, value => value.schemaVersion === 2 && typeof value.week === 'number')
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

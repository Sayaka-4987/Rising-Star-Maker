export function nextRandom(state: number): [number, number] {
  let next = state | 0
  next ^= next << 13
  next ^= next >>> 17
  next ^= next << 5
  const normalized = (next >>> 0) / 4294967296
  return [normalized, next >>> 0 || 0x9e3779b9]
}

export function randomInt(state: number, min: number, max: number): [number, number] {
  const [value, next] = nextRandom(state)
  return [Math.floor(value * (max - min + 1)) + min, next]
}

export function pickOne<T>(state: number, items: readonly T[]): [T, number] {
  if (items.length === 0) throw new Error('Cannot choose from an empty collection')
  const [index, next] = randomInt(state, 0, items.length - 1)
  return [items[index] as T, next]
}

export function weightedPick<T extends { weight: number }>(state: number, items: readonly T[]): [T, number] {
  if (items.length === 0) throw new Error('Cannot choose from an empty collection')
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  const [value, next] = nextRandom(state)
  let cursor = value * total
  for (const item of items) {
    cursor -= item.weight
    if (cursor < 0) return [item, next]
  }
  return [items[items.length - 1] as T, next]
}

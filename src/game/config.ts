export const TOTAL_WEEKS = 12
export const WEEKS_PER_MONTH = 4

const LEGACY_TOTAL_WEEKS = 24
const weekScale = TOTAL_WEEKS / LEGACY_TOTAL_WEEKS
const countScale = LEGACY_TOTAL_WEEKS / TOTAL_WEEKS

export function scaleLegacyWeek(legacyWeek: number): number {
  return Math.max(1, Math.round(legacyWeek * weekScale))
}

export function toLegacyEquivalentCount(value: number): number {
  return value * countScale
}

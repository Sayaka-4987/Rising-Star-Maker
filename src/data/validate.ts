import asciiData from '../content/ascii.json'
import messages from '../content/zh-CN.json'
import { hasText } from '../content/text'
import { activities, endings, events, observationKeys, profileNameKeys, traits, weeklySituations } from './gameData'
import { evidenceIds, type OutcomeId } from '../game/types'

export function validateContent(): string[] {
  const errors: string[] = []
  const ascii = asciiData as Record<string, string[]>
  const unique = (label: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length) errors.push(`${label} contains duplicate IDs`)
  }
  const requireText = (key: string) => {
    if (!hasText(key)) errors.push(`Missing text: ${key}`)
  }

  unique('Activities', activities.map(item => item.id))
  unique('Events', events.map(item => item.id))
  unique('Traits', traits.map(item => item.id))
  unique('Endings', endings.map(item => item.id))
  unique('Weekly situations', weeklySituations.map(item => item.id))

  if (activities.length !== 12) errors.push(`Expected 12 activities, received ${activities.length}`)
  if (events.length !== 48) errors.push(`Expected 48 events, received ${events.length}`)
  if (traits.length !== 12) errors.push(`Expected 12 traits, received ${traits.length}`)
  if (endings.length !== 11) errors.push(`Expected 11 endings, received ${endings.length}`)
  if (weeklySituations.length !== 20) errors.push(`Expected 20 weekly situations, received ${weeklySituations.length}`)

  for (const activity of activities) {
    requireText(activity.labelKey)
    requireText(activity.descriptionKey)
    const activityEvents = events.filter(event => event.activityId === activity.id)
    if (activityEvents.length !== 4) errors.push(`${activity.id} must have exactly 4 outcome events`)
    const outcomes: OutcomeId[] = ['criticalFailure', 'failure', 'success', 'criticalSuccess']
    if (outcomes.some(outcome => !activityEvents.some(event => event.outcome === outcome))) errors.push(`${activity.id} is missing an outcome`)
  }
  for (const event of events) {
    if (!activities.some(activity => activity.id === event.activityId)) errors.push(`Unknown activity in ${event.id}`)
    if (event.textKeys.length < 1) errors.push(`${event.id} must have at least 1 text variant`)
    event.textKeys.forEach(requireText)
    if (event.weight <= 0) errors.push(`${event.id} has an invalid weight`)
  }
  for (const trait of traits) {
    requireText(trait.nameKey)
    requireText(trait.descriptionKey)
  }
  for (const ending of endings) {
    requireText(ending.nameKey)
    requireText(ending.descriptionKey)
    ending.summaryKeys.forEach(requireText)
    if (!ascii[ending.asciiKey]?.length) errors.push(`Missing ASCII art: ${ending.asciiKey}`)
    for (const required of ending.requiredTraits ?? []) {
      if (!traits.some(trait => trait.id === required)) errors.push(`Unknown trait ${required} in ending ${ending.id}`)
    }
    for (const evidenceId of [...Object.keys(ending.minimumEvidence ?? {}), ...Object.keys(ending.evidenceWeights ?? {})]) {
      if (!evidenceIds.includes(evidenceId as (typeof evidenceIds)[number])) errors.push(`Unknown evidence ${evidenceId} in ending ${ending.id}`)
    }
  }
  for (const situation of weeklySituations) {
    requireText(situation.titleKey)
    requireText(situation.descriptionKey)
    if (situation.weight <= 0) errors.push(`${situation.id} has an invalid weight`)
    if (situation.cooldownWeeks < 0 || situation.minimumWeek < 1) errors.push(`${situation.id} has invalid timing`)
    const references = [...situation.opportunityActivityIds, ...situation.riskActivityIds, ...situation.relatedActivityIds]
    for (const activityId of references) {
      if (!activities.some(activity => activity.id === activityId)) errors.push(`Unknown activity ${activityId} in situation ${situation.id}`)
    }
    for (const evidenceId of situation.evidenceTags) {
      if (!evidenceIds.includes(evidenceId)) errors.push(`Unknown evidence ${evidenceId} in situation ${situation.id}`)
    }
  }
  for (const evidenceId of evidenceIds) requireText(`report.evidence.${evidenceId}`)
  profileNameKeys.forEach(requireText)
  observationKeys.forEach(requireText)
  const names = profileNameKeys.map(key => (messages as Record<string, string>)[key] ?? '')
  if (names.filter(name => [...name].length === 3).length < 18) errors.push('At least 18 intern names must contain 3 Chinese characters')
  if (names.some(name => ![2, 3].includes([...name].length))) errors.push('Intern names must contain 2 or 3 Chinese characters')
  for (let index = 1; index <= 6; index += 1) {
    if (!ascii[`portrait.${index}`]?.length) errors.push(`Missing portrait.${index}`)
  }
  for (const [key, lines] of Object.entries(ascii)) {
    if (lines.some(line => /[^\x00-\x7F]/.test(line))) errors.push(`${key} must use ASCII characters only`)
  }
  return errors
}

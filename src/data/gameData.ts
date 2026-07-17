import type { Activity, Ending, EventTemplate, OutcomeId, Trait, WeeklySituation } from '../game/types'

export const activities: Activity[] = [
  { id: 'fix_bug', category: 'work', labelKey: 'activity.fix_bug.name', descriptionKey: 'activity.fix_bug.description', icon: '[!]', statDeltas: { technical: 3, independence: 1 }, primaryEvidence: 'engineering', secondaryEvidence: 'ownership' },
  { id: 'build_feature', category: 'work', labelKey: 'activity.build_feature.name', descriptionKey: 'activity.build_feature.description', icon: '[+]', statDeltas: { technical: 2, creativity: 2 }, primaryEvidence: 'engineering', secondaryEvidence: 'productSense' },
  { id: 'write_tests', category: 'work', labelKey: 'activity.write_tests.name', descriptionKey: 'activity.write_tests.description', icon: '[✓]', statDeltas: { technical: 2, independence: 1, chaos: -1 }, primaryEvidence: 'reliability', secondaryEvidence: 'engineering' },
  { id: 'read_docs', category: 'learning', labelKey: 'activity.read_docs.name', descriptionKey: 'activity.read_docs.description', icon: '[≡]', statDeltas: { curiosity: 3, technical: 1 }, primaryEvidence: 'research', secondaryEvidence: 'community' },
  { id: 'pair_programming', category: 'learning', labelKey: 'activity.pair_programming.name', descriptionKey: 'activity.pair_programming.description', icon: '[:]', statDeltas: { technical: 2, social: 1 }, primaryEvidence: 'communication', secondaryEvidence: 'leadership' },
  { id: 'tech_talk', category: 'learning', labelKey: 'activity.tech_talk.name', descriptionKey: 'activity.tech_talk.description', icon: '[?]', statDeltas: { curiosity: 2, social: 2 }, primaryEvidence: 'communication', secondaryEvidence: 'research' },
  { id: 'team_lunch', category: 'social', labelKey: 'activity.team_lunch.name', descriptionKey: 'activity.team_lunch.description', icon: '[_]', statDeltas: { social: 3, chaos: 1 }, primaryEvidence: 'communication', secondaryEvidence: 'leadership' },
  { id: 'mentor_1on1', category: 'social', labelKey: 'activity.mentor_1on1.name', descriptionKey: 'activity.mentor_1on1.description', icon: '[=]', statDeltas: { independence: 2, ambition: 2 }, primaryEvidence: 'ownership', secondaryEvidence: 'resilience' },
  { id: 'demo', category: 'social', labelKey: 'activity.demo.name', descriptionKey: 'activity.demo.description', icon: '[>]', statDeltas: { social: 2, ambition: 2 }, primaryEvidence: 'customerFacing', secondaryEvidence: 'communication' },
  { id: 'production_incident', category: 'danger', labelKey: 'activity.production_incident.name', descriptionKey: 'activity.production_incident.description', icon: '[!!]', statDeltas: { technical: 3, independence: 2, chaos: 2 }, primaryEvidence: 'incidentResponse', secondaryEvidence: 'reliability' },
  { id: 'touch_kubernetes', category: 'danger', labelKey: 'activity.touch_kubernetes.name', descriptionKey: 'activity.touch_kubernetes.description', icon: '[☁]', statDeltas: { technical: 2, curiosity: 2, chaos: 3 }, primaryEvidence: 'incidentResponse', secondaryEvidence: 'engineering' },
  { id: 'friday_project', category: 'danger', labelKey: 'activity.friday_project.name', descriptionKey: 'activity.friday_project.description', icon: '[*]', statDeltas: { creativity: 3, ambition: 1, chaos: 3 }, primaryEvidence: 'community', secondaryEvidence: 'productSense' },
]

const situation = (
  id: string,
  kind: WeeklySituation['kind'],
  opportunityActivityIds: string[],
  riskActivityIds: string[],
  relatedActivityIds: string[],
  evidenceTags: WeeklySituation['evidenceTags'],
  minimumWeek = 1,
): WeeklySituation => ({
  id,
  titleKey: `situation.${id}.title`,
  descriptionKey: `situation.${id}.description`,
  kind,
  minimumWeek,
  cooldownWeeks: 8,
  weight: 1,
  opportunityActivityIds,
  riskActivityIds,
  relatedActivityIds,
  evidenceTags,
})

export const weeklySituations: WeeklySituation[] = [
  situation('release_cleanup', 'common', ['write_tests', 'fix_bug'], ['friday_project'], ['touch_kubernetes'], ['reliability']),
  situation('docs_refresh', 'common', ['read_docs'], ['production_incident'], ['tech_talk'], ['community']),
  situation('new_teammate', 'common', ['pair_programming', 'team_lunch'], [], ['mentor_1on1'], ['leadership']),
  situation('tech_debt_week', 'common', ['fix_bug', 'write_tests'], ['build_feature'], ['read_docs'], ['engineering', 'reliability']),
  situation('quiet_week', 'common', ['read_docs', 'friday_project'], [], ['mentor_1on1'], ['ownership']),
  situation('customer_visit', 'opportunity', ['demo'], ['friday_project'], ['build_feature', 'team_lunch'], ['customerFacing']),
  situation('internal_tech_fair', 'opportunity', ['tech_talk', 'demo'], [], ['friday_project'], ['communication', 'community']),
  situation('open_source_issue', 'opportunity', ['friday_project'], [], ['read_docs'], ['community']),
  situation('cross_team_invite', 'opportunity', ['pair_programming', 'read_docs'], [], ['mentor_1on1'], ['leadership', 'communication']),
  situation('research_seminar', 'opportunity', ['tech_talk', 'read_docs'], [], ['write_tests'], ['research']),
  situation('test_env_unstable', 'trouble', ['touch_kubernetes', 'write_tests'], ['build_feature'], ['fix_bug'], ['incidentResponse', 'reliability']),
  situation('requirement_shift', 'trouble', ['mentor_1on1', 'pair_programming'], ['build_feature', 'demo'], ['read_docs'], ['productSense', 'resilience']),
  situation('mentor_busy', 'trouble', ['read_docs', 'fix_bug'], ['mentor_1on1'], ['friday_project'], ['ownership']),
  situation('incident_wave', 'trouble', ['production_incident', 'fix_bug'], ['friday_project'], ['write_tests'], ['incidentResponse']),
  situation('team_disagreement', 'trouble', ['mentor_1on1', 'team_lunch'], ['pair_programming'], ['tech_talk'], ['leadership', 'communication']),
  situation('project_spotlight', 'rare', ['friday_project', 'demo'], [], ['tech_talk'], ['community', 'customerFacing'], 5),
  situation('flight_club_day', 'rare', ['team_lunch', 'friday_project'], [], ['read_docs'], ['aviation'], 5),
  situation('customer_escalation', 'rare', ['demo', 'fix_bug', 'production_incident'], [], ['team_lunch'], ['customerFacing', 'incidentResponse'], 5),
  situation('research_collaboration', 'rare', ['read_docs', 'tech_talk'], [], ['write_tests'], ['research'], 5),
  situation('team_reorg', 'rare', ['mentor_1on1', 'team_lunch'], [], ['tech_talk'], ['leadership', 'ownership'], 5),
]

type OutcomeSeed = Omit<EventTemplate, 'id' | 'activityId' | 'outcome' | 'textKeys' | 'weight'>
const outcomeIds: OutcomeId[] = ['criticalFailure', 'failure', 'success', 'criticalSuccess']
const eventGroups: Record<string, Partial<Record<OutcomeId, OutcomeSeed>>> = {
  fix_bug: {
    criticalFailure: { statDeltas: { technical: -4, independence: -2 }, counterDeltas: { scopeCreep: 1 }, highlight: true },
    failure: { statDeltas: { technical: -1 } },
    success: { counterDeltas: { bugsFixed: 1 } },
    criticalSuccess: { statDeltas: { technical: 2, independence: 1 }, counterDeltas: { bugsFixed: 2 }, highlight: true },
  },
  build_feature: {
    criticalFailure: { statDeltas: { technical: -3, chaos: 3 }, counterDeltas: { scopeCreep: 2 }, highlight: true },
    failure: { statDeltas: { creativity: -1 }, counterDeltas: { scopeCreep: 1 } },
    success: { statDeltas: { creativity: 1 } },
    criticalSuccess: { statDeltas: { creativity: 3, ambition: 1 }, tags: ['aviation'], highlight: true },
  },
  write_tests: {
    criticalFailure: { statDeltas: { technical: -3, chaos: 3 }, highlight: true },
    failure: { statDeltas: { independence: -1 } },
    success: { statDeltas: { technical: 1, chaos: -1 } },
    criticalSuccess: { statDeltas: { technical: 2, independence: 2, chaos: -2 }, highlight: true },
  },
  read_docs: {
    criticalFailure: { statDeltas: { curiosity: -3 }, highlight: true },
    failure: { statDeltas: { technical: -1 } },
    success: { counterDeltas: { docsRead: 1 } },
    criticalSuccess: { statDeltas: { curiosity: 2, independence: 1 }, counterDeltas: { docsRead: 2 }, tags: ['aviation'], highlight: true },
  },
  pair_programming: {
    criticalFailure: { statDeltas: { social: -4, independence: -2 }, highlight: true },
    failure: { statDeltas: { social: -1 }, counterDeltas: { questionsAsked: 1 } },
    success: { statDeltas: { social: 1 }, counterDeltas: { questionsAsked: 2 } },
    criticalSuccess: { statDeltas: { technical: 2, social: 2 }, counterDeltas: { questionsAsked: 3 }, highlight: true },
  },
  tech_talk: {
    criticalFailure: { statDeltas: { social: -3, curiosity: -2 }, highlight: true },
    failure: { statDeltas: { social: -1 } },
    success: { counterDeltas: { questionsAsked: 1 } },
    criticalSuccess: { statDeltas: { curiosity: 2, social: 2 }, counterDeltas: { questionsAsked: 2 }, highlight: true },
  },
  team_lunch: {
    criticalFailure: { statDeltas: { social: -4, chaos: 2 }, counterDeltas: { socialEscapes: 1 }, highlight: true },
    failure: { statDeltas: { social: -1 }, counterDeltas: { socialEscapes: 1 } },
    success: { statDeltas: { social: 1 } },
    criticalSuccess: { statDeltas: { social: 3, curiosity: 1 }, tags: ['aviation'], highlight: true },
  },
  mentor_1on1: {
    criticalFailure: { statDeltas: { independence: -3, ambition: -2 }, highlight: true },
    failure: { statDeltas: { ambition: -1 } },
    success: { statDeltas: { independence: 1 } },
    criticalSuccess: { statDeltas: { independence: 2, ambition: 2, chaos: -1 }, highlight: true },
  },
  demo: {
    criticalFailure: { statDeltas: { social: -4, ambition: -2 }, counterDeltas: { demosGiven: 1 }, highlight: true },
    failure: { statDeltas: { social: -1 }, counterDeltas: { demosGiven: 1 } },
    success: { counterDeltas: { demosGiven: 1 } },
    criticalSuccess: { statDeltas: { social: 3, ambition: 2 }, counterDeltas: { demosGiven: 1 }, highlight: true },
  },
  production_incident: {
    criticalFailure: { statDeltas: { technical: -5, independence: -3, chaos: 5 }, counterDeltas: { incidentsObserved: 1 }, highlight: true },
    failure: { statDeltas: { independence: -2, chaos: 2 }, counterDeltas: { incidentsObserved: 1 } },
    success: { statDeltas: { technical: 1 }, counterDeltas: { incidentsObserved: 1 } },
    criticalSuccess: { statDeltas: { technical: 3, independence: 2 }, counterDeltas: { incidentsObserved: 1 }, highlight: true },
  },
  touch_kubernetes: {
    criticalFailure: { statDeltas: { technical: -5, chaos: 6 }, counterDeltas: { scopeCreep: 2 }, highlight: true },
    failure: { statDeltas: { technical: -2, chaos: 2 }, counterDeltas: { scopeCreep: 1 } },
    success: { statDeltas: { technical: 1 } },
    criticalSuccess: { statDeltas: { technical: 3, curiosity: 2, chaos: 1 }, highlight: true },
  },
  friday_project: {
    criticalFailure: { statDeltas: { creativity: -4, chaos: 5 }, counterDeltas: { sideProjects: 1, scopeCreep: 2 }, highlight: true },
    failure: { statDeltas: { ambition: -1 }, counterDeltas: { sideProjects: 1 } },
    success: { statDeltas: { creativity: 1 }, counterDeltas: { sideProjects: 1 }, tags: ['aviation'] },
    criticalSuccess: { statDeltas: { creativity: 3, ambition: 2 }, counterDeltas: { sideProjects: 1 }, tags: ['aviation'], highlight: true },
  },
}

export const events: EventTemplate[] = Object.entries(eventGroups).flatMap(([activityId, outcomes]) =>
  outcomeIds.map(outcome => ({
    id: `${activityId}.${outcome}`,
    activityId,
    outcome,
    textKeys: [`event.${activityId}.${outcome}`],
    weight: 1,
    ...outcomes[outcome],
  })),
)

export const traits: Trait[] = [
  { id: 'curious', nameKey: 'trait.curious.name', descriptionKey: 'trait.curious.description', priority: 10 },
  { id: 'bug_hunter', nameKey: 'trait.bug_hunter.name', descriptionKey: 'trait.bug_hunter.description', priority: 20 },
  { id: 'doc_goblin', nameKey: 'trait.doc_goblin.name', descriptionKey: 'trait.doc_goblin.description', priority: 20 },
  { id: 'test_guardian', nameKey: 'trait.test_guardian.name', descriptionKey: 'trait.test_guardian.description', priority: 20 },
  { id: 'coffee_powered', nameKey: 'trait.coffee_powered.name', descriptionKey: 'trait.coffee_powered.description', priority: 15 },
  { id: 'meeting_goblin', nameKey: 'trait.meeting_goblin.name', descriptionKey: 'trait.meeting_goblin.description', priority: 30 },
  { id: 'architecture_brain', nameKey: 'trait.architecture_brain.name', descriptionKey: 'trait.architecture_brain.description', priority: 40 },
  { id: 'open_source_addict', nameKey: 'trait.open_source_addict.name', descriptionKey: 'trait.open_source_addict.description', priority: 40 },
  { id: 'startup_dreamer', nameKey: 'trait.startup_dreamer.name', descriptionKey: 'trait.startup_dreamer.description', priority: 40 },
  { id: 'kubernetes_believer', nameKey: 'trait.kubernetes_believer.name', descriptionKey: 'trait.kubernetes_believer.description', priority: 40 },
  { id: 'aviation_nerd', nameKey: 'trait.aviation_nerd.name', descriptionKey: 'trait.aviation_nerd.description', priority: 50 },
  { id: 'chaotic_good', nameKey: 'trait.chaotic_good.name', descriptionKey: 'trait.chaotic_good.description', priority: 50 },
]

export const endings: Ending[] = [
  { id: 'no_return_offer', nameKey: 'ending.no_return_offer.name', descriptionKey: 'ending.no_return_offer.description', summaryKeys: ['ending.no_return_offer.summary.a', 'ending.no_return_offer.summary.b'], asciiKey: 'ending.no_return_offer', rarity: 'common', priority: 100, statWeights: {} },
  { id: 'software', nameKey: 'ending.software.name', descriptionKey: 'ending.software.description', summaryKeys: ['ending.software.summary.a', 'ending.software.summary.b'], asciiKey: 'ending.software', rarity: 'common', priority: 1, statWeights: { technical: 3, independence: 2 }, counterWeights: { bugsFixed: 6 }, evidenceWeights: { engineering: 12, reliability: 8, ownership: 6 } },
  { id: 'product', nameKey: 'ending.product.name', descriptionKey: 'ending.product.description', summaryKeys: ['ending.product.summary.a', 'ending.product.summary.b'], asciiKey: 'ending.product', rarity: 'common', priority: 2, statWeights: { creativity: 3, social: 2, ambition: 1 }, activityWeights: { build_feature: 18, mentor_1on1: 5 }, counterWeights: { demosGiven: 4 }, evidenceWeights: { productSense: 24, communication: 5, customerFacing: 4 } },
  { id: 'research', nameKey: 'ending.research.name', descriptionKey: 'ending.research.description', summaryKeys: ['ending.research.summary.a', 'ending.research.summary.b'], asciiKey: 'ending.research', rarity: 'common', priority: 3, statWeights: { curiosity: 3, technical: 2 }, activityWeights: { read_docs: 10, tech_talk: 5 }, counterWeights: { docsRead: 5, questionsAsked: 2 }, evidenceWeights: { research: 14, resilience: 6, engineering: 3 } },
  { id: 'technical_sales', nameKey: 'ending.technical_sales.name', descriptionKey: 'ending.technical_sales.description', summaryKeys: ['ending.technical_sales.summary.a', 'ending.technical_sales.summary.b'], asciiKey: 'ending.technical_sales', rarity: 'common', priority: 4, statWeights: { social: 3, ambition: 2, technical: 1 }, activityWeights: { demo: 12, team_lunch: 8 }, counterWeights: { demosGiven: 8 }, evidenceWeights: { customerFacing: 14, communication: 9, engineering: 2 } },
  { id: 'developer_relations', nameKey: 'ending.developer_relations.name', descriptionKey: 'ending.developer_relations.description', summaryKeys: ['ending.developer_relations.summary.a', 'ending.developer_relations.summary.b'], asciiKey: 'ending.developer_relations', rarity: 'rare', priority: 9, statWeights: { social: 2, curiosity: 2, creativity: 1 }, activityWeights: { tech_talk: 12, read_docs: 6, demo: 5 }, counterWeights: { questionsAsked: 4, docsRead: 3, demosGiven: 3 }, evidenceWeights: { community: 14, communication: 9, research: 4 } },
  { id: 'staff', nameKey: 'ending.staff.name', descriptionKey: 'ending.staff.description', summaryKeys: ['ending.staff.summary.a', 'ending.staff.summary.b'], asciiKey: 'ending.staff', rarity: 'rare', priority: 10, requiredTraits: ['architecture_brain'], statWeights: { technical: 3, independence: 3 }, traitBonuses: { architecture_brain: 500, doc_goblin: 120, test_guardian: 120 }, evidenceWeights: { leadership: 15, ownership: 9, engineering: 5 } },
  { id: 'open_source', nameKey: 'ending.open_source.name', descriptionKey: 'ending.open_source.description', summaryKeys: ['ending.open_source.summary.a', 'ending.open_source.summary.b'], asciiKey: 'ending.open_source', rarity: 'rare', priority: 11, requiredTraits: ['open_source_addict'], statWeights: { creativity: 3, curiosity: 2 }, counterWeights: { sideProjects: 14 }, evidenceWeights: { community: 16, ownership: 7 } },
  { id: 'founder', nameKey: 'ending.founder.name', descriptionKey: 'ending.founder.description', summaryKeys: ['ending.founder.summary.a', 'ending.founder.summary.b'], asciiKey: 'ending.founder', rarity: 'rare', priority: 12, requiredTraits: ['startup_dreamer'], statWeights: { ambition: 3, creativity: 2, chaos: 2 }, counterWeights: { sideProjects: 12 }, evidenceWeights: { productSense: 12, ownership: 10, community: 4 } },
  { id: 'flight', nameKey: 'ending.flight.name', descriptionKey: 'ending.flight.description', summaryKeys: ['ending.flight.summary.a', 'ending.flight.summary.b'], asciiKey: 'ending.flight', rarity: 'epic', priority: 20, requiredTraits: ['aviation_nerd'], statWeights: { curiosity: 2, independence: 2, social: 1 }, traitBonuses: { aviation_nerd: 1200 }, evidenceWeights: { aviation: 30 } },
  { id: 'kubernetes', nameKey: 'ending.kubernetes.name', descriptionKey: 'ending.kubernetes.description', summaryKeys: ['ending.kubernetes.summary.a', 'ending.kubernetes.summary.b'], asciiKey: 'ending.kubernetes', rarity: 'legendary', priority: 30, requiredTraits: ['kubernetes_believer', 'chaotic_good'], statWeights: { technical: 2, curiosity: 2, chaos: 3 }, traitBonuses: { kubernetes_believer: 200, chaotic_good: 200 }, evidenceWeights: { incidentResponse: 15, engineering: 8, reliability: 5 } },
]

export const profileNameKeys = Array.from({ length: 24 }, (_, index) => `name.${index + 1}`)
export const observationKeys = Array.from({ length: 12 }, (_, index) => `observation.${index + 1}`)

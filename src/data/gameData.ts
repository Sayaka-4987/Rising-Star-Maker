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
  situation('mobile_launch', 'opportunity', ['build_feature', 'demo'], ['friday_project'], ['write_tests'], ['engineering', 'productSense'], 6),
  situation('security_review', 'trouble', ['read_docs', 'write_tests'], ['touch_kubernetes'], ['production_incident'], ['reliability', 'incidentResponse'], 6),
  situation('data_migration', 'trouble', ['write_tests', 'touch_kubernetes'], ['build_feature'], ['fix_bug'], ['engineering', 'reliability'], 6),
  situation('model_experiment', 'opportunity', ['read_docs', 'build_feature'], [], ['write_tests', 'tech_talk'], ['research', 'engineering'], 6),
  situation('user_interviews', 'opportunity', ['mentor_1on1', 'demo'], ['build_feature'], ['team_lunch'], ['productSense', 'customerFacing'], 6),
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

function careerEnding(
  id: string,
  rarity: Ending['rarity'],
  priority: number,
  rules: Omit<Ending, 'id' | 'nameKey' | 'descriptionKey' | 'summaryKeys' | 'hintKey' | 'asciiKey' | 'rarity' | 'priority'>,
  contentId = id,
  asciiId = id,
): Ending {
  return {
    id,
    nameKey: `ending.${contentId}.name`,
    descriptionKey: `ending.${contentId}.description`,
    summaryKeys: [`ending.${contentId}.summary.a`, `ending.${contentId}.summary.b`],
    hintKey: `ending.${id}.hint`,
    asciiKey: `ending.${asciiId}`,
    rarity,
    priority,
    ...rules,
  }
}

export const endings: Ending[] = [
  careerEnding('no_return_offer', 'common', 100, { statWeights: {} }),
  careerEnding('internship_extended', 'common', 90, { statWeights: {}, evidenceWeights: { resilience: 8, ownership: 5 } }),
  careerEnding('software', 'common', 1, { statWeights: { technical: 3, independence: 2 }, minimumActivities: { fix_bug: 4, build_feature: 4, write_tests: 4 }, activityWeights: { fix_bug: 5, build_feature: 5, write_tests: 5 }, counterWeights: { bugsFixed: 5 }, evidenceWeights: { engineering: 10, reliability: 8, ownership: 6 } }),
  careerEnding('frontend', 'common', 2, { statWeights: { creativity: 3, technical: 2, social: 1 }, minimumEvidence: { engineering: 10, productSense: 8 }, minimumActivities: { build_feature: 12, demo: 6 }, activityWeights: { build_feature: 12, demo: 8 }, evidenceWeights: { productSense: 14, engineering: 9, customerFacing: 4 } }),
  careerEnding('backend', 'common', 3, { statWeights: { technical: 3, independence: 2 }, minimumEvidence: { engineering: 12, reliability: 7 }, minimumActivities: { fix_bug: 12, production_incident: 4 }, activityWeights: { fix_bug: 11, production_incident: 7, touch_kubernetes: 4 }, evidenceWeights: { engineering: 13, reliability: 9, incidentResponse: 5 } }),
  careerEnding('mobile', 'rare', 4, { statWeights: { technical: 2, creativity: 2 }, minimumEvidence: { engineering: 9, productSense: 7 }, minimumActivities: { build_feature: 10, demo: 5 }, requiredSituationIds: ['mobile_launch'], activityWeights: { build_feature: 10, demo: 7, write_tests: 4 }, situationWeights: { mobile_launch: 160 }, evidenceWeights: { engineering: 10, productSense: 12, reliability: 4 } }),
  careerEnding('test_engineer', 'common', 5, { statWeights: { technical: 2, independence: 2 }, minimumEvidence: { reliability: 14 }, minimumActivities: { write_tests: 18 }, activityWeights: { write_tests: 15, fix_bug: 5 }, evidenceWeights: { reliability: 16, engineering: 8 } }),
  careerEnding('security', 'rare', 6, { statWeights: { technical: 2, curiosity: 2, independence: 1 }, minimumEvidence: { reliability: 10, incidentResponse: 7 }, minimumActivities: { read_docs: 8, production_incident: 5 }, requiredSituationIds: ['security_review'], activityWeights: { read_docs: 7, production_incident: 9, write_tests: 6 }, situationWeights: { security_review: 180 }, evidenceWeights: { reliability: 14, incidentResponse: 12, research: 6 } }),
  careerEnding('performance', 'rare', 7, { statWeights: { technical: 2, curiosity: 3 }, minimumEvidence: { research: 12, engineering: 8 }, minimumActivities: { read_docs: 14, write_tests: 6 }, activityWeights: { read_docs: 10, write_tests: 8, fix_bug: 5 }, evidenceWeights: { research: 15, engineering: 10, reliability: 5 } }),
  careerEnding('site_reliability', 'rare', 8, { statWeights: { technical: 3, independence: 2 }, minimumEvidence: { incidentResponse: 14, reliability: 10 }, minimumActivities: { production_incident: 12, write_tests: 8 }, activityWeights: { production_incident: 14, write_tests: 10, fix_bug: 5 }, evidenceWeights: { incidentResponse: 17, reliability: 13, ownership: 5 } }),
  careerEnding('kubernetes', 'legendary', 30, { requiredTraits: ['kubernetes_believer', 'chaotic_good'], statWeights: { technical: 2, curiosity: 2, chaos: 3 }, minimumActivities: { touch_kubernetes: 12 }, traitBonuses: { kubernetes_believer: 240, chaotic_good: 240 }, activityWeights: { touch_kubernetes: 15, production_incident: 5 }, evidenceWeights: { incidentResponse: 15, engineering: 8, reliability: 5 } }),
  careerEnding('data_engineer', 'rare', 9, { statWeights: { technical: 3, independence: 1 }, minimumEvidence: { engineering: 10, reliability: 10 }, minimumActivities: { write_tests: 8, touch_kubernetes: 6 }, requiredSituationIds: ['data_migration'], activityWeights: { write_tests: 9, touch_kubernetes: 8, fix_bug: 5 }, situationWeights: { data_migration: 170 }, evidenceWeights: { engineering: 12, reliability: 14 } }),
  careerEnding('ml_engineer', 'rare', 10, { statWeights: { technical: 2, curiosity: 2, creativity: 1 }, minimumEvidence: { engineering: 9, research: 9 }, minimumActivities: { build_feature: 8, read_docs: 8 }, requiredSituationIds: ['model_experiment'], activityWeights: { build_feature: 9, read_docs: 9, write_tests: 5 }, situationWeights: { model_experiment: 170 }, evidenceWeights: { engineering: 12, research: 13 } }),
  careerEnding('data_scientist', 'rare', 11, { statWeights: { curiosity: 3, creativity: 1 }, minimumEvidence: { research: 11, productSense: 7 }, minimumActivities: { read_docs: 12, mentor_1on1: 4 }, requiredSituationIds: ['data_migration'], activityWeights: { read_docs: 12, mentor_1on1: 6, tech_talk: 5 }, situationWeights: { data_migration: 120 }, evidenceWeights: { research: 16, productSense: 11 } }),
  careerEnding('applied_scientist', 'rare', 12, { statWeights: { curiosity: 3, technical: 2 }, minimumEvidence: { research: 13, ownership: 7 }, minimumActivities: { read_docs: 10, build_feature: 8 }, requiredSituationIds: ['research_collaboration'], activityWeights: { read_docs: 10, build_feature: 9, write_tests: 5 }, situationWeights: { research_collaboration: 170 }, evidenceWeights: { research: 17, ownership: 9, engineering: 7 } }),
  careerEnding('research', 'common', 13, { statWeights: { curiosity: 3, technical: 1 }, minimumEvidence: { research: 13 }, minimumActivities: { read_docs: 16, tech_talk: 8 }, activityWeights: { read_docs: 12, tech_talk: 8 }, counterWeights: { docsRead: 4, questionsAsked: 2 }, evidenceWeights: { research: 16, resilience: 8 } }),
  careerEnding('product', 'common', 14, { statWeights: { creativity: 3, social: 2, ambition: 1 }, minimumEvidence: { productSense: 10, communication: 6 }, minimumActivities: { build_feature: 12, mentor_1on1: 6 }, activityWeights: { build_feature: 12, mentor_1on1: 8, demo: 5 }, evidenceWeights: { productSense: 17, communication: 8, customerFacing: 5 } }),
  careerEnding('program_manager', 'common', 15, { statWeights: { social: 3, independence: 2, ambition: 1 }, minimumEvidence: { communication: 11, ownership: 8 }, minimumActivities: { mentor_1on1: 12, pair_programming: 6, team_lunch: 6 }, activityWeights: { mentor_1on1: 12, pair_programming: 8, team_lunch: 7 }, evidenceWeights: { communication: 15, ownership: 12, leadership: 9 } }),
  careerEnding('solutions_architect', 'rare', 16, { statWeights: { technical: 2, social: 2, curiosity: 1 }, minimumEvidence: { customerFacing: 9, engineering: 9 }, minimumActivities: { demo: 8, production_incident: 3 }, requiredSituationIds: ['customer_visit'], activityWeights: { demo: 11, production_incident: 6, read_docs: 5 }, situationWeights: { customer_visit: 150, customer_escalation: 100 }, evidenceWeights: { customerFacing: 14, engineering: 12, communication: 7 } }),
  careerEnding('technical_sales', 'common', 17, { statWeights: { social: 3, ambition: 2, technical: 1 }, minimumEvidence: { customerFacing: 11, communication: 9 }, minimumActivities: { demo: 14, team_lunch: 8 }, activityWeights: { demo: 14, team_lunch: 9 }, counterWeights: { demosGiven: 6 }, evidenceWeights: { customerFacing: 16, communication: 12 } }),
  careerEnding('technical_community', 'rare', 18, { statWeights: { social: 2, curiosity: 2, creativity: 1 }, minimumEvidence: { community: 10, communication: 9 }, minimumActivities: { tech_talk: 12, read_docs: 8 }, activityWeights: { tech_talk: 13, read_docs: 8, demo: 5 }, evidenceWeights: { community: 16, communication: 12, research: 5 } }, 'developer_relations', 'developer_relations'),
  careerEnding('support_engineer', 'common', 19, { statWeights: { technical: 2, social: 2, independence: 1 }, minimumEvidence: { customerFacing: 8, incidentResponse: 8 }, minimumActivities: { fix_bug: 8, production_incident: 6 }, requiredSituationIds: ['customer_escalation'], activityWeights: { fix_bug: 9, production_incident: 9, demo: 4 }, situationWeights: { customer_escalation: 160 }, evidenceWeights: { customerFacing: 13, incidentResponse: 13, communication: 6 } }),
  careerEnding('ux_researcher', 'rare', 20, { statWeights: { curiosity: 2, social: 2, creativity: 1 }, minimumEvidence: { productSense: 9, research: 7 }, minimumActivities: { mentor_1on1: 10, demo: 6 }, requiredSituationIds: ['user_interviews'], activityWeights: { mentor_1on1: 11, demo: 7, team_lunch: 5 }, situationWeights: { user_interviews: 170 }, evidenceWeights: { productSense: 15, research: 11, customerFacing: 7 } }),
  careerEnding('technical_writer', 'common', 21, { statWeights: { curiosity: 3, independence: 1 }, minimumEvidence: { community: 10, reliability: 7 }, minimumActivities: { read_docs: 18, tech_talk: 6 }, activityWeights: { read_docs: 15, tech_talk: 7 }, counterWeights: { docsRead: 5 }, evidenceWeights: { community: 16, reliability: 10, research: 6 } }),
  careerEnding('programming_instructor', 'common', 22, { statWeights: { social: 3, curiosity: 2 }, minimumEvidence: { communication: 12, leadership: 7 }, minimumActivities: { pair_programming: 12, tech_talk: 10 }, activityWeights: { pair_programming: 12, tech_talk: 11, team_lunch: 4 }, evidenceWeights: { communication: 16, leadership: 12, community: 6 } }),
  careerEnding('open_source', 'rare', 23, { requiredTraits: ['open_source_addict'], statWeights: { creativity: 3, curiosity: 2 }, minimumActivities: { friday_project: 12 }, traitBonuses: { open_source_addict: 420 }, activityWeights: { friday_project: 14, read_docs: 4 }, counterWeights: { sideProjects: 10 }, evidenceWeights: { community: 16, ownership: 8 } }),
  careerEnding('founder', 'rare', 24, { requiredTraits: ['startup_dreamer'], statWeights: { ambition: 3, creativity: 2, chaos: 1 }, minimumActivities: { friday_project: 14, build_feature: 6 }, traitBonuses: { startup_dreamer: 460 }, activityWeights: { friday_project: 13, build_feature: 8, demo: 4 }, evidenceWeights: { productSense: 14, ownership: 11, community: 5 } }),
  careerEnding('independent_developer', 'rare', 25, { statWeights: { technical: 2, creativity: 3, independence: 2 }, minimumEvidence: { engineering: 10, ownership: 8 }, minimumActivities: { friday_project: 18, build_feature: 8 }, activityWeights: { friday_project: 15, build_feature: 8, fix_bug: 4 }, evidenceWeights: { engineering: 12, ownership: 12, community: 7 } }),
  careerEnding('staff', 'rare', 26, { requiredTraits: ['architecture_brain'], statWeights: { technical: 3, independence: 3 }, minimumEvidence: { leadership: 8, ownership: 8 }, traitBonuses: { architecture_brain: 520, doc_goblin: 100, test_guardian: 100 }, evidenceWeights: { leadership: 16, ownership: 11, engineering: 6 } }),
  careerEnding('flight', 'epic', 27, { requiredTraits: ['aviation_nerd'], statWeights: { curiosity: 2, independence: 2, social: 1 }, minimumEvidence: { aviation: 3 }, traitBonuses: { aviation_nerd: 1200 }, evidenceWeights: { aviation: 30 } }),
]

export const profileNameKeys = Array.from({ length: 24 }, (_, index) => `name.${index + 1}`)
export const observationKeys = Array.from({ length: 12 }, (_, index) => `observation.${index + 1}`)

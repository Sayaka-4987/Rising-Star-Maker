import asciiData from './content/ascii.json'
import { getLocale, setLocale, t } from './content/text'
import { activities, endings, traits } from './data/gameData'
import { achievementIds, activityById, advanceFromFeedback, createNewGame, ensureCurrentSituation, formatForIntern, hintForActivity, localizedProfileName, nearbyEndings, predictedEndings, removeSelectedActivity, reportAttentionLines, reportLines, reportTrendLines, resolveSelectedWeek, revealComplete, situationById, strongestEvidence, toggleActivity } from './game/rules'
import { clearAllData, loadDex, loadGame, saveDex, saveGame } from './game/storage'
import type { GameState, HumanDex } from './game/types'

const ascii = asciiData as Record<string, string[]>
const rootElement = document.querySelector<HTMLDivElement>('#app')
if (!rootElement) throw new Error('App root is missing')
const root = rootElement
const LOCALE_STORAGE_KEY = 'rsm.locale'

const preferredLocale = loadPreferredLocale()
if (preferredLocale) setLocale(preferredLocale)

let game = loadGame()
if (game) game = ensureCurrentSituation(game)
let dex = loadDex()
let view: 'title' | 'dex' | 'game' = 'title'

root.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]')
  if (!button) return
  const action = button.dataset.action
  const id = button.dataset.id

  if (action === 'new') {
    game = createNewGame(randomSeed())
    view = 'game'
    persist()
  } else if (action === 'continue' && game) {
    view = 'game'
  } else if (action === 'dex') {
    view = 'dex'
  } else if (action === 'home') {
    view = 'title'
  } else if (action === 'reveal' && game) {
    game = revealComplete(game)
    persist()
  } else if (action === 'select-activity' && game && id) {
    game = toggleActivity(game, id)
    persist()
  } else if (action === 'remove-activity' && game) {
    game = removeSelectedActivity(game, Number(button.dataset.index))
    persist()
  } else if (action === 'start-week' && game) {
    const hadEnding = Boolean(game.endingId)
    game = resolveSelectedWeek(game)
    if (game.pendingAchievementIds.length > 0) recordAchievements(game)
    if (!hadEnding && game.endingId) recordEnding(game)
    persist()
  } else if (action === 'next-feedback' && game) {
    game = advanceFromFeedback(game)
    persist()
  } else if (action === 'clear') {
    if (window.confirm(t('confirm.clear'))) {
      clearAllData()
      game = null
      dex = loadDex()
      view = 'title'
    }
  } else if (action === 'set-locale' && id) {
    if (setLocale(id)) persistLocale(id)
  }
  render()
})

function render(): void {
  root.innerHTML = view === 'dex' ? renderDex() : view === 'game' && game ? renderGame(game) : renderTitle()
}

function renderTitle(): string {
  return shell(`
    <main class="title-screen panel" aria-labelledby="game-title">
      <div class="logo" aria-hidden="true">
        <strong>RISING STAR MAKER</strong>
        <span>INTERN OBSERVATION v0.1</span>
      </div>
      <h1 id="game-title">${e(t('app.title'))}</h1>
      <p class="tagline">${e(t('app.tagline'))}</p>
      <p class="intro">${e(t('app.intro'))}</p>
      <div class="title-locale-inline">${localeSwitcher()}</div>
      <details class="achievement-fold">
        <summary>${e(t('button.achievements'))} <strong>${dex.discoveredAchievementIds.length}/${achievementIds.length}</strong></summary>
        ${dex.discoveredAchievementIds.length > 0
          ? `<ul class="achievement-list">${dex.discoveredAchievementIds.map(id => `<li><strong>${e(t(`achievement.${id}.name`))}</strong><p>${e(t(`achievement.${id}.description`))}</p></li>`).join('')}</ul>`
          : `<p class="achievement-empty">${e(t('label.noAchievements'))}</p>`}
      </details>
      <div class="title-actions">
        ${game ? button('continue', t('button.continue'), 'primary') : ''}
        ${button('new', t('button.new'), game ? '' : 'primary')}
        ${button('dex', t('button.dex'))}
        ${button('clear', t('button.clear'), 'quiet danger-text')}
      </div>
      <p class="save-note">LOCAL SAVE // ${dex.gamesCompleted} COMPLETE</p>
    </main>
  `)
}

function renderGame(state: GameState): string {
  switch (state.phase) {
    case 'reveal': return renderReveal(state)
    case 'action': return renderPlanning(state)
    case 'feedback': return renderResult(state)
  }
}

function renderReveal(state: GameState): string {
  return shell(`
    ${topbar(`<div class="topbar-brand"><span class="status-dot"></span>${e(t('app.title'))}</div>`, '', localeSwitcher())}
    <main class="center-screen panel fade-in">
      <p class="eyebrow">NEW INTERN RECEIVED</p>
      ${portrait(state.profile.portraitId, localizedProfileName(state.profile))}
      <h1>${e(localizedProfileName(state.profile))}</h1>
      <p class="profile-meta">${e(formatForIntern('label.gender', state, { gender: t(`gender.${state.profile.gender}`) }))}</p>
      <p class="profile-meta">${e(localizedProfilePronoun(state.profile))}</p>
      <blockquote>${e(formatForIntern(state.profile.observationKey, state))}</blockquote>
      ${button('reveal', t('button.begin'), 'primary')}
    </main>
  `)
}

function renderPlanning(state: GameState): string {
  const categories = ['work', 'learning', 'social', 'danger'] as const
  const latest = state.eventHistory[state.eventHistory.length - 1]?.text ?? formatForIntern(state.profile.observationKey, state)
  const situation = situationById(state.currentSituationId)
  return shell(`
    ${topbar(`<div class="topbar-brand"><span class="status-dot"></span>${e(t('app.title'))}</div>`, e(t('label.week', { week: state.week })), `${button('home', t('button.home'), 'quiet small')}${localeSwitcher()}`)}
    <main class="game-grid">
      <aside class="intern-panel panel">
        <div class="portrait-desktop">${portrait(state.profile.portraitId, localizedProfileName(state.profile))}</div>
        <details class="portrait-fold">
          <summary>${e(t('label.portrait'))}</summary>
          ${portrait(state.profile.portraitId, localizedProfileName(state.profile))}
        </details>
        <h2>${e(localizedProfileName(state.profile))}</h2>
        <p class="muted">${e(t(`gender.${state.profile.gender}`))} · ${e(localizedProfilePronoun(state.profile))}</p>
        <h3>${e(t('label.traits'))}</h3>
        ${traitChips(state)}
        <section class="log-inline">
          <h3>${e(t('label.log'))}</h3>
          <ol class="log-list compact">
            ${state.eventHistory.slice(-12).reverse().map(item => `<li>${e(item.text)}</li>`).join('') || `<li>${e(t('label.none'))}</li>`}
          </ol>
        </section>
      </aside>
      <section class="activity-panel panel" aria-labelledby="activities-heading">
        ${situation ? `<article class="situation-card situation-${e(situation.kind)}">
          <div class="situation-headline"><span>${e(t('label.situation'))}</span><strong>${e(t(`situation.kind.${situation.kind}`))}</strong><h2>${e(t(situation.titleKey))}</h2></div>
          <p>${e(formatForIntern(situation.descriptionKey, state))}</p>
        </article>` : ''}
        <div class="section-heading">
          <h2 id="activities-heading">${e(t('label.schedule'))}</h2>
          <p class="eyebrow section-eyebrow">WEEKLY PLAN</p>
          <span>${state.selectedActivityIds.length} / 3</span>
        </div>
        <div class="schedule-bar">
          <div class="schedule-slots">
            ${[0, 1, 2].map(index => scheduleSlot(state.selectedActivityIds[index], index)).join('')}
          </div>
          ${button('start-week', t('button.startWeek'), 'primary', state.selectedActivityIds.length !== 3)}
        </div>
        ${categories.map(category => `
          <section class="activity-group">
            <h3>${e(t(`category.${category}`))}</h3>
            <div class="activity-list">
              ${activities.filter(activity => activity.category === category).map(activity => activityCard(activity.id, state)).join('')}
            </div>
          </section>
        `).join('')}
      </section>
    </main>
  `)
}

function renderResult(state: GameState): string {
  if (state.pendingResults.length === 0) return ''
  const situation = situationById(state.currentSituationId)
  const nextLabel = state.week === 24 ? t('button.finish') : t('button.nextWeek')
  return shell(`
    ${topbar(`<div class="topbar-brand"><span class="status-dot"></span>${e(t('app.title'))}</div>`, e(t('label.week', { week: state.week })), localeSwitcher())}
    <main class="weekly-results panel fade-in">
      ${state.pendingAchievementIds.length > 0
        ? `<section class="achievement-toast" aria-live="polite"><strong>${e(t('label.newAchievement'))}</strong><ul>${state.pendingAchievementIds.map(id => `<li>${e(t(`achievement.${id}.name`))}</li>`).join('')}</ul></section>`
        : ''}
      <div class="results-heading">
        <div><p class="eyebrow">WEEKLY RESULTS</p><h1>${e(t('label.weekResults', { week: state.week }))}</h1></div>
        <span>${e(localizedProfileName(state.profile))}</span>
      </div>
      ${situation ? `<article class="feedback-situation">
        <span>${e(t(`situation.kind.${situation.kind}`))}</span>
        <strong>${e(t(situation.titleKey))}</strong>
        <p>${e(formatForIntern(situation.descriptionKey, state))}</p>
      </article>` : ''}
      <div class="result-list">
        ${state.pendingResults.map(result => {
          const activity = activityById(result.activityId)
          const unlocked = result.unlockedTraitId ? traits.find(trait => trait.id === result.unlockedTraitId) : undefined
          return `<article class="result-card result-card-${result.outcome}">
            <header>
              <span class="result-icon">${e(activity?.icon ?? '[ ]')}</span>
              <h2>${e(activity ? t(activity.labelKey) : '')}</h2>
              <span class="outcome outcome-${result.outcome}">${e(t(`outcome.${result.outcome}`))}</span>
            </header>
            <p class="event-copy">${e(result.text)}</p>
            ${result.situationHint ? `<p class="situation-attribution hint-${e(result.situationHint)}"><strong>${e(t('label.situationEffect'))} · ${e(t(`situation.hint.${result.situationHint}`))}</strong>${e(formatForIntern(`situation.feedback.${result.situationHint}`, state))}</p>` : ''}
            ${unlocked ? `<div class="trait-unlock compact">
              <span>${e(t('label.unlocked'))}</span>
              <strong>${e(t(unlocked.nameKey))}</strong>
              <p>${e(formatForIntern(unlocked.descriptionKey, state))}</p>
            </div>` : ''}
          </article>`
        }).join('')}
      </div>
      ${state.week % 4 === 0 && state.week < 24 ? renderReportSection(state) : ''}
      ${state.week === 24 && state.endingId ? renderEndingSection(state) : ''}
      <div class="results-actions">${state.week === 24
        ? `${button('new', t('button.again'), 'primary')}${button('dex', t('button.dex'))}${button('home', t('button.home'), 'quiet')}`
        : button('next-feedback', nextLabel, 'primary')}</div>
    </main>
  `)
}

function renderReportSection(state: GameState): string {
  const month = state.week / 4
  return `<section class="report-screen paper embedded-report">
      <p class="report-stamp">INTERN REPORT // MONTH ${month}</p>
      <h1>${e(formatForIntern(`report.title.${month}`, state))}</h1>
      <hr>
      <h2>${e(t('label.confirmed'))}</h2>
      <ul>${reportLines(state).map(line => `<li>${e(line)}</li>`).join('')}</ul>
      <h2>${e(t('label.attention'))}</h2>
      <ul>${reportAttentionLines(state).map(line => `<li>${e(line)}</li>`).join('')}</ul>
      <h2>${e(t('label.trend'))}</h2>
      <ul>${reportTrendLines(state).map(line => `<li>${e(line)}</li>`).join('')}</ul>
      ${state.week >= 20 ? `<h2>${e(t('label.direction'))}</h2>
      <ol class="directions">${predictedEndings(state).map(ending => `<li>${e(t(ending.nameKey))}</li>`).join('')}</ol>` : ''}
    </section>`
}

function renderEndingSection(state: GameState): string {
  const ending = endings.find(item => item.id === state.endingId)
  if (!ending) return ''
  const notable = state.eventHistory.filter(item => item.highlight).slice(-5)
  const evidence = notable.length >= 3 ? notable : state.eventHistory.slice(-5)
  const summaryKey = ending.summaryKeys[state.seed % 2] as string
  const nearby = nearbyEndings(state)
  return `<section class="ending-screen embedded-ending">
      <p class="eyebrow">${e(t('label.ending'))}</p>
      <pre class="ending-art" aria-hidden="true">${e((ascii[ending.asciiKey] ?? []).join('\n').replace('name', localizedProfileName(state.profile)))}</pre>
      <h1>${e(t(ending.nameKey))}</h1>
      <p class="rarity rarity-${ending.rarity}">${e(t('label.rarity', { rarity: t(`rarity.${ending.rarity}`) }))}</p>
      <p class="ending-description">${e(formatForIntern(ending.descriptionKey, state))}</p>
      <blockquote>${e(formatForIntern(summaryKey, state))}</blockquote>
      <section class="ending-evidence">
        <h2>${e(t('label.behavior'))}</h2>
        <ul>${evidence.map(item => `<li>${e(item.text)}</li>`).join('')}</ul>
        <h2>${e(t('label.confirmed'))}</h2>
        <ul>${strongestEvidence(state, 5).map(id => `<li>${e(t(`evidence.${id}`))}</li>`).join('')}</ul>
      </section>
      <section class="nearby-endings"><h2>${e(t('label.nearby'))}</h2><p>${nearby.map(item => e(t(item.nameKey))).join(' · ')}</p></section>
      <section class="next-run"><h2>${e(t('label.nextRun'))}</h2>${nearby.length > 0
        ? `<ul>${nearby.map(item => `<li><strong>${e(t(item.nameKey))}：</strong>${e(t(item.hintKey))}</li>`).join('')}</ul>`
        : `<p>${e(t('ending.nextRun.generic'))}</p>`}</section>
    </section>`
}

function renderDex(): string {
  const neutralPronoun = localizedNeutralPronoun()
  const genericInternName = localizedGenericInternName()
  return shell(`
    ${topbar(`<div class="topbar-brand"><span class="status-dot"></span>${e(t('app.title'))}</div>`, e(t('button.dex')), `${button('home', t('button.back'), 'quiet small')}${localeSwitcher()}`)}
    <main class="dex-screen panel fade-in">
      <div class="section-heading"><div><p class="eyebrow">HUMANDEX</p><h1>${e(t('button.dex'))}</h1></div></div>
      <p>${e(t('label.games', { count: dex.gamesCompleted }))}</p>
      <section><h2>${e(t('label.dexTraits'))}</h2><div class="dex-grid">
        ${traits.map(trait => dex.discoveredTraitIds.includes(trait.id)
          ? `<article class="dex-card known"><span>[T]</span><h3>${e(t(trait.nameKey))}</h3><p>${e(t(trait.descriptionKey, { pronoun: neutralPronoun }))}</p></article>`
          : `<article class="dex-card unknown"><span>[?]</span><h3>???</h3><p>${e(t('label.unknown'))}</p></article>`).join('')}
      </div></section>
      <section><h2>${e(t('label.dexEndings'))}</h2><div class="dex-grid endings-grid">
        ${endings.map(ending => dex.discoveredEndingIds.includes(ending.id)
          ? `<article class="dex-card known"><span>[${e(t(`rarity.${ending.rarity}`))}]</span><h3>${e(t(ending.nameKey))}</h3><p>${e(t(ending.descriptionKey, { name: genericInternName, pronoun: neutralPronoun }))}</p></article>`
          : `<article class="dex-card unknown"><span>[?]</span><h3>???</h3><p>${e(t(ending.hintKey))}</p></article>`).join('')}
      </div></section>
    </main>
  `)
}

function activityCard(id: string, state: GameState): string {
  const activity = activityById(id)
  if (!activity) return ''
  const selectedCount = state.selectedActivityIds.filter(selectedId => selectedId === id).length
  const hint = hintForActivity(situationById(state.currentSituationId), id)
  return `<button class="activity-card ${selectedCount > 0 ? 'selected' : ''}" data-action="select-activity" data-id="${e(id)}" ${state.selectedActivityIds.length === 3 ? 'disabled' : ''}>
    <span class="activity-icon">${e(activity.icon)}</span>
    <span><strong>${e(t(activity.labelKey))}${selectedCount > 0 ? `<em>×${selectedCount}</em>` : ''}${hint ? `<mark class="situation-hint hint-${e(hint)}">${e(t(`situation.hint.${hint}`))}</mark>` : ''}</strong><small>${e(t(activity.descriptionKey))}</small></span>
  </button>`
}

function scheduleSlot(id: string | undefined, index: number): string {
  const activity = id ? activityById(id) : undefined
  return activity
    ? `<button class="schedule-slot filled" data-action="remove-activity" data-index="${index}"><span>0${index + 1}</span>${e(t(activity.labelKey))}</button>`
    : `<div class="schedule-slot"><span>0${index + 1}</span>${e(t('label.emptySlot'))}</div>`
}

function traitChips(state: GameState): string {
  if (state.traits.length === 0) return `<p class="muted">${e(t('label.none'))}</p>`
  return `<div class="trait-chips">${state.traits.map(id => {
    const trait = traits.find(item => item.id === id)
    return trait ? `<span title="${e(formatForIntern(trait.descriptionKey, state))}">${e(t(trait.nameKey))}</span>` : ''
  }).join('')}</div>`
}

function portrait(id: string, name: string): string {
  return `<pre class="portrait" role="img" aria-label="${e(name)}的字符画肖像">${e((ascii[id] ?? []).join('\n'))}</pre>`
}

function button(action: string, label: string, classes = '', disabled = false): string {
  return `<button class="button ${classes}" data-action="${e(action)}" ${disabled ? 'disabled' : ''}>${e(label)}</button>`
}

function localeSwitcher(): string {
  const locale = getLocale()
  return `<div class="locale-switch" role="group" aria-label="${e(t('label.language'))}"><span>${e(t('label.language'))}</span><button class="button small locale-button ${locale === 'en-US' ? 'active' : ''}" data-action="set-locale" data-id="en-US">EN</button><button class="button small locale-button ${locale === 'zh-CN' ? 'active' : ''}" data-action="set-locale" data-id="zh-CN">中文</button></div>`
}

function topbar(left: string, center = '', right = ''): string {
  return `<header class="topbar panel"><div class="topbar-left">${left}</div><div class="topbar-center">${center}</div><div class="topbar-actions">${right}</div></header>`
}

function shell(content: string): string {
  return `<div class="app-shell">${content}<footer>RSM // LOCAL STATIC BUILD // TEXT FIRST</footer></div>`
}

function persist(): void {
  if (game) saveGame(game)
}

function loadPreferredLocale(): string | null {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return value === 'en-US' || value === 'zh-CN' ? value : null
  } catch {
    return null
  }
}

function persistLocale(locale: string): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

function localizedNeutralPronoun(): string {
  return getLocale() === 'en-US' ? 'they' : 'ta'
}

function localizedProfilePronoun(profile: GameState['profile']): string {
  if (getLocale() !== 'en-US') return profile.pronoun
  if (profile.gender === 'male') return 'he/his'
  if (profile.gender === 'female') return 'she/her'
  return 'they'
}

function localizedGenericInternName(): string {
  return getLocale() === 'en-US' ? 'an intern' : '一名实习生'
}

function recordEnding(state: GameState): void {
  dex = {
    ...dex,
    gamesCompleted: dex.gamesCompleted + 1,
    discoveredTraitIds: [...new Set([...dex.discoveredTraitIds, ...state.traits])],
    discoveredEndingIds: [...new Set([...dex.discoveredEndingIds, state.endingId as string])],
  }
  saveDex(dex)
}

function recordAchievements(state: GameState): void {
  if (state.pendingAchievementIds.length === 0) return
  dex = {
    ...dex,
    discoveredAchievementIds: [...new Set([...dex.discoveredAchievementIds, ...state.pendingAchievementIds])],
  }
  saveDex(dex)
}

function randomSeed(): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] || Date.now()
}

function e(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] as string)
}

render()

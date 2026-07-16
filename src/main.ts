import asciiData from './content/ascii.json'
import { t } from './content/text'
import { activities, endings, traits } from './data/gameData'
import { activityById, advanceFromReport, advanceFromResult, createNewGame, formatForIntern, predictedEndings, removeSelectedActivity, reportLines, resolveSelectedWeek, revealComplete, toggleActivity } from './game/rules'
import { clearAllData, loadDex, loadGame, saveDex, saveGame } from './game/storage'
import type { GameState, HumanDex } from './game/types'

const ascii = asciiData as Record<string, string[]>
const rootElement = document.querySelector<HTMLDivElement>('#app')
if (!rootElement) throw new Error('App root is missing')
const root = rootElement

let game = loadGame()
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
    game = resolveSelectedWeek(game)
    persist()
  } else if (action === 'next-result' && game) {
    const previousPhase = game.phase
    while (game.phase === 'results') game = advanceFromResult(game)
    if (previousPhase === 'results' && game.phase === 'ending' && game.endingId) recordEnding(game)
    persist()
  } else if (action === 'next-report' && game) {
    game = advanceFromReport(game)
    persist()
  } else if (action === 'clear') {
    if (window.confirm(t('confirm.clear'))) {
      clearAllData()
      game = null
      dex = loadDex()
      view = 'title'
    }
  }
  render()
})

function render(): void {
  root.innerHTML = view === 'dex' ? renderDex() : view === 'game' && game ? renderGame(game) : renderTitle()
}

function renderTitle(): string {
  return shell(`
    <main class="title-screen panel" aria-labelledby="game-title">
      <pre class="logo" aria-hidden="true">+----------------------------------+
|      RISING  STAR  MAKER         |
|      INTERN OBSERVATION v0.1     |
+----------------------------------+</pre>
      <p class="eyebrow">${e(t('app.subtitle'))}</p>
      <h1 id="game-title">${e(t('app.title'))}</h1>
      <p class="tagline">${e(t('app.tagline'))}</p>
      <p class="intro">${e(t('app.intro'))}</p>
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
    case 'planning': return renderPlanning(state)
    case 'results': return renderResult(state)
    case 'report': return renderReport(state)
    case 'ending': return renderEnding(state)
  }
}

function renderReveal(state: GameState): string {
  return shell(`
    <main class="center-screen panel fade-in">
      <p class="eyebrow">NEW INTERN RECEIVED</p>
      ${portrait(state.profile.portraitId, state.profile.name)}
      <h1>${e(state.profile.name)}</h1>
      <p class="profile-meta">${e(formatForIntern('label.gender', state, { gender: t(`gender.${state.profile.gender}`) }))}</p>
      <blockquote>${e(formatForIntern(state.profile.observationKey, state))}</blockquote>
      ${button('reveal', t('button.begin'), 'primary')}
    </main>
  `)
}

function renderPlanning(state: GameState): string {
  const categories = ['work', 'learning', 'social', 'danger'] as const
  const latest = state.eventHistory[state.eventHistory.length - 1]?.text ?? formatForIntern(state.profile.observationKey, state)
  return shell(`
    <header class="topbar panel">
      <div class="topbar-brand"><span class="status-dot"></span>${e(t('app.title'))}</div>
      <strong>${e(t('label.week', { week: state.week }))}</strong>
      ${button('home', t('button.home'), 'quiet small')}
    </header>
    <main class="game-grid">
      <aside class="intern-panel panel">
        ${portrait(state.profile.portraitId, state.profile.name)}
        <h2>${e(state.profile.name)}</h2>
        <p class="muted">${e(t(`gender.${state.profile.gender}`))} · ${e(state.profile.pronoun)}</p>
        <h3>${e(t('label.traits'))}</h3>
        ${traitChips(state)}
        <p class="latest-observation">${e(latest)}</p>
      </aside>
      <section class="activity-panel panel" aria-labelledby="activities-heading">
        <div class="section-heading">
          <div><p class="eyebrow">WEEKLY PLAN</p><h2 id="activities-heading">${e(t('label.schedule'))}</h2></div>
          <span>${state.selectedActivityIds.length} / 3</span>
        </div>
        ${categories.map(category => `
          <section class="activity-group">
            <h3>${e(t(`category.${category}`))}</h3>
            <div class="activity-list">
              ${activities.filter(activity => activity.category === category).map(activity => activityCard(activity.id, state)).join('')}
            </div>
          </section>
        `).join('')}
        <div class="schedule-bar">
          <div class="schedule-slots">
            ${[0, 1, 2].map(index => scheduleSlot(state.selectedActivityIds[index], index)).join('')}
          </div>
          ${button('start-week', t('button.startWeek'), 'primary', state.selectedActivityIds.length !== 3)}
        </div>
      </section>
      <aside class="log-panel panel">
        <h2>${e(t('label.log'))}</h2>
        <ol class="log-list">
          ${state.eventHistory.slice(-12).reverse().map(item => `<li>${e(item.text)}</li>`).join('') || `<li>${e(t('label.none'))}</li>`}
        </ol>
      </aside>
    </main>
  `)
}

function renderResult(state: GameState): string {
  if (state.pendingResults.length === 0) return ''
  const nextLabel = state.week === 24
    ? t('button.viewEnding')
    : state.week % 4 === 0
      ? t('button.viewReport')
      : t('button.nextWeek')
  return shell(`
    <main class="weekly-results panel fade-in">
      <div class="results-heading">
        <div><p class="eyebrow">WEEKLY RESULTS</p><h1>${e(t('label.weekResults', { week: state.week }))}</h1></div>
        <span>${e(state.profile.name)}</span>
      </div>
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
            ${unlocked ? `<div class="trait-unlock compact">
              <span>${e(t('label.unlocked'))}</span>
              <strong>${e(t(unlocked.nameKey))}</strong>
              <p>${e(formatForIntern(unlocked.descriptionKey, state))}</p>
            </div>` : ''}
          </article>`
        }).join('')}
      </div>
      <div class="results-actions">${button('next-result', nextLabel, 'primary')}</div>
    </main>
  `)
}

function renderReport(state: GameState): string {
  const month = state.week / 4
  return shell(`
    <main class="report-screen paper fade-in">
      <p class="report-stamp">INTERN REPORT // MONTH ${month}</p>
      <h1>${e(formatForIntern(`report.title.${month}`, state))}</h1>
      <p class="report-name">${e(state.profile.name)} · ${e(t(`gender.${state.profile.gender}`))}</p>
      <hr>
      <h2>${e(t('label.behavior'))}</h2>
      <ul>${reportLines(state).map(line => `<li>${e(line)}</li>`).join('')}</ul>
      <h2>${e(t('label.traits'))}</h2>
      ${traitChips(state)}
      <h2>${e(t('label.direction'))}</h2>
      <ol class="directions">${predictedEndings(state).map(ending => `<li>${e(t(ending.nameKey))}</li>`).join('')}</ol>
      ${button('next-report', t('button.reportContinue'), 'ink-button')}
    </main>
  `)
}

function renderEnding(state: GameState): string {
  const ending = endings.find(item => item.id === state.endingId)
  if (!ending) return ''
  const notable = state.eventHistory.filter(item => item.highlight).slice(-5)
  const evidence = notable.length >= 3 ? notable : state.eventHistory.slice(-5)
  const summaryKey = ending.summaryKeys[state.seed % 2] as string
  return shell(`
    <main class="ending-screen panel fade-in">
      <p class="eyebrow">${e(t('label.ending'))}</p>
      <pre class="ending-art" aria-hidden="true">${e((ascii[ending.asciiKey] ?? []).join('\n').replace('name', state.profile.name))}</pre>
      <h1>${e(t(ending.nameKey))}</h1>
      <p class="rarity rarity-${ending.rarity}">${e(t('label.rarity', { rarity: t(`rarity.${ending.rarity}`) }))}</p>
      <p class="ending-description">${e(formatForIntern(ending.descriptionKey, state))}</p>
      <blockquote>${e(formatForIntern(summaryKey, state))}</blockquote>
      <section class="ending-evidence">
        <h2>${e(t('label.behavior'))}</h2>
        <ul>${evidence.map(item => `<li>${e(item.text)}</li>`).join('')}</ul>
      </section>
      <div class="ending-actions">
        ${button('new', t('button.again'), 'primary')}
        ${button('dex', t('button.dex'))}
        ${button('home', t('button.home'), 'quiet')}
      </div>
    </main>
  `)
}

function renderDex(): string {
  return shell(`
    <main class="dex-screen panel fade-in">
      <div class="section-heading"><div><p class="eyebrow">HUMANDEX</p><h1>${e(t('button.dex'))}</h1></div>${button('home', t('button.back'), 'quiet')}</div>
      <p>${e(t('label.games', { count: dex.gamesCompleted }))}</p>
      <section><h2>${e(t('label.dexTraits'))}</h2><div class="dex-grid">
        ${traits.map(trait => dex.discoveredTraitIds.includes(trait.id)
          ? `<article class="dex-card known"><span>[T]</span><h3>${e(t(trait.nameKey))}</h3><p>${e(t(trait.descriptionKey, { pronoun: 'ta' }))}</p></article>`
          : `<article class="dex-card unknown"><span>[?]</span><h3>???</h3><p>${e(t('label.unknown'))}</p></article>`).join('')}
      </div></section>
      <section><h2>${e(t('label.dexEndings'))}</h2><div class="dex-grid endings-grid">
        ${endings.map(ending => dex.discoveredEndingIds.includes(ending.id)
          ? `<article class="dex-card known"><span>[${e(t(`rarity.${ending.rarity}`))}]</span><h3>${e(t(ending.nameKey))}</h3><p>${e(t(ending.descriptionKey, { name: '一名实习生', pronoun: 'ta' }))}</p></article>`
          : `<article class="dex-card unknown"><span>[?]</span><h3>???</h3><p>${e(t('label.unknown'))}</p></article>`).join('')}
      </div></section>
    </main>
  `)
}

function activityCard(id: string, state: GameState): string {
  const activity = activityById(id)
  if (!activity) return ''
  const selectedCount = state.selectedActivityIds.filter(selectedId => selectedId === id).length
  return `<button class="activity-card ${selectedCount > 0 ? 'selected' : ''}" data-action="select-activity" data-id="${e(id)}" ${state.selectedActivityIds.length === 3 ? 'disabled' : ''}>
    <span class="activity-icon">${e(activity.icon)}</span>
    <span><strong>${e(t(activity.labelKey))}${selectedCount > 0 ? `<em>×${selectedCount}</em>` : ''}</strong><small>${e(t(activity.descriptionKey))}</small></span>
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

function shell(content: string): string {
  return `<div class="app-shell">${content}<footer>RSM // LOCAL STATIC BUILD // TEXT FIRST</footer></div>`
}

function persist(): void {
  if (game) saveGame(game)
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

function randomSeed(): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] || Date.now()
}

function e(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] as string)
}

render()

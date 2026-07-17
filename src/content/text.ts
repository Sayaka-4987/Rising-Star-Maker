import messages from './zh-CN.json'
import enUSMessages from './en-US.json'

export type MessageCatalog = Readonly<Record<string, string>>

export const DEFAULT_LOCALE = 'zh-CN'

const catalogs = new Map<string, MessageCatalog>([
  [DEFAULT_LOCALE, messages as MessageCatalog],
  ['en-US', enUSMessages as MessageCatalog],
])

let activeLocale = DEFAULT_LOCALE

export function registerLocale(locale: string, catalog: MessageCatalog): void {
  catalogs.set(locale, catalog)
}

export function setLocale(locale: string): boolean {
  if (!catalogs.has(locale)) return false
  activeLocale = locale
  return true
}

export function getLocale(): string {
  return activeLocale
}

export function getAvailableLocales(): string[] {
  return [...catalogs.keys()]
}

export function t(key: string, variables: Record<string, string | number> = {}): string {
  const fallback = catalogs.get(DEFAULT_LOCALE) as MessageCatalog
  const template = catalogs.get(activeLocale)?.[key] ?? fallback[key]
  if (!template) return `[${key}]`
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? `{${name}}`))
}

export function hasText(key: string): boolean {
  const value = catalogs.get(DEFAULT_LOCALE)?.[key]
  return typeof value === 'string' && value.trim().length > 0
}

export const allTextKeys = Object.keys(messages)

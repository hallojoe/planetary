import { catalogs, languages, languageNames } from './locales';
import type { Language } from './locales';

const storageKey = 'planetary.language';
export function resolveLanguage(saved: string | null, preferred: readonly string[]): Language {
  if (languages.includes(saved as Language)) return saved as Language;
  for (const candidate of preferred) {
    const base = candidate.toLowerCase().split(/[-_]/)[0] as Language;
    if (languages.includes(base)) return base;
  }
  return 'en';
}

let language: Language = 'en';
let numberFormatter = new Intl.NumberFormat(language);
let dateFormatter = makeDateFormatter();
function makeDateFormatter() {
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
export function getLanguage(): Language { return language; }
export function t(message: string, params: Record<string, string> = {}): string {
  const translated = Object.hasOwn(catalogs[language], message) ? catalogs[language][message] : message;
  return translated.replace(/\{(\w+)\}/g, (token, key: string) => params[key] ?? token);
}
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return options ? new Intl.NumberFormat(language, options).format(value) : numberFormatter.format(value);
}
export function formatDate(date: Date): string { return dateFormatter.format(date).toLocaleUpperCase(language); }

export function translatePage(root: ParentNode = document) {
  for (const [marker, attribute] of [['data-i18n', null], ['data-i18n-label', 'aria-label'], ['data-i18n-title', 'title'], ['data-i18n-content', 'content']] as const) {
    root.querySelectorAll<HTMLElement>(`[${marker}]`).forEach(element => {
      const translated = t(element.getAttribute(marker)!);
      if (attribute) element.setAttribute(attribute, translated);
      else element.textContent = translated;
    });
  }
}

export function setLanguage(next: Language) {
  if (!languages.includes(next)) return;
  language = next;
  numberFormatter = new Intl.NumberFormat(language);
  dateFormatter = makeDateFormatter();
  document.documentElement.lang = language;
  try { localStorage.setItem(storageKey, language); } catch { /* Storage is optional. */ }
  translatePage();
  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  window.dispatchEvent(new Event('languagechange'));
}

export function initLanguage() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(storageKey); } catch { /* Private browsing may deny storage. */ }
  const trigger = document.getElementById('language-toggle')!;
  const panel = document.getElementById('language-options')!;
  const options = document.getElementById('language-list')!;
  for (const code of languages) {
    const button = document.createElement('button');
    button.type = 'button';
    button.lang = code;
    button.dataset.language = code;
    button.textContent = languageNames[code];
    button.addEventListener('click', () => {
      setLanguage(code);
      panel.hidePopover();
      trigger.focus();
    });
    options.append(button);
  }
  // Native popovers provide Escape, light dismissal, and focus return.
  panel.addEventListener('toggle', () => {
    const open = panel.matches(':popover-open');
    trigger.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
  });
  setLanguage(resolveLanguage(saved, navigator.languages ?? [navigator.language]));
}

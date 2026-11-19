import { readFileSync } from 'node:fs';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { catalogs, languages, messages } from '../src/locales';
import { bodies } from '../src/orbits';
import { interiors } from '../src/interiors';
import { formatDate, formatNumber, getLanguage, resolveLanguage, setLanguage, t } from '../src/i18n';

describe('translation coverage', () => {
  it('has unique messages and matching placeholders in every language', () => {
    expect(new Set(messages.map(row => row[0])).size).toBe(messages.length);
    const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
    for (const row of messages) {
      expect(row).toHaveLength(languages.length);
      for (const translation of row) {
        expect(translation.trim()).not.toBe('');
        expect(placeholders(translation)).toEqual(placeholders(row[0]));
      }
    }
  });

  it('covers all marked HTML, planet descriptions, and interior text', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const text = [...html.matchAll(/data-i18n(?:-label|-title|-content)?="([^"]+)"/g)].map(match => match[1]);
    for (const body of bodies) text.push(body.name, body.type, body.description);
    for (const interior of Object.values(interiors)) {
      text.push(interior.note);
      for (const [name, material] of interior.layers) text.push(name, material);
    }
    for (const language of languages) for (const message of text) {
      expect(Object.hasOwn(catalogs[language], message), `${language}: ${message}`).toBe(true);
    }
  });
});

describe('language preferences', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('prefers a saved choice, matches regional browser languages, and falls back to English', () => {
    expect(resolveLanguage('pl', ['da-DK'])).toBe('pl');
    expect(resolveLanguage(null, ['fr-FR', 'de-DE'])).toBe('de');
    expect(resolveLanguage('invalid', ['es-MX'])).toBe('es');
    expect(resolveLanguage(null, ['DA-dk'])).toBe('da');
    expect(resolveLanguage(null, ['fr-FR'])).toBe('en');
    expect(resolveLanguage(null, [])).toBe('en');
  });

  it('updates the document, persists the choice, and formats localized text and values', () => {
    const document = { documentElement: { lang: 'en' }, querySelectorAll: () => [] };
    const setItem = vi.fn(), dispatchEvent = vi.fn();
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal('localStorage', { setItem });
    for (const language of languages) {
      setLanguage(language);
      expect(document.documentElement.lang).toBe(language);
      expect(setItem).toHaveBeenLastCalledWith('planetary.language', language);
      expect(t('Explore: {name}', { name: t('Earth') })).toContain(catalogs[language].Earth);
      expect(formatNumber(1234.5)).toBe(new Intl.NumberFormat(language).format(1234.5));
      expect(formatDate(new Date('2000-01-01T12:00:00Z'))).toBe(new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date('2000-01-01T12:00:00Z')).toLocaleUpperCase(language));
    }
    expect(dispatchEvent).toHaveBeenCalledTimes(5);
    expect(t('Unknown future message')).toBe('Unknown future message');
    // A blocked storage API must not prevent switching languages.
    vi.stubGlobal('localStorage', { setItem() { throw new Error('blocked'); } });
    expect(() => setLanguage('en')).not.toThrow();
    expect(getLanguage()).toBe('en');
  });
});

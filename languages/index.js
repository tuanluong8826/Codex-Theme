/**
 * Unified Internationalization (i18n) Engine
 * Supports Vietnamese (vi), English (en), and Chinese (zh).
 */

import vi from './vi.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };
import zh from './zh.json' with { type: 'json' };

export const supportedLanguages = {
  vi: { code: 'vi', name: 'Tiếng Việt', catalog: vi },
  en: { code: 'en', name: 'English', catalog: en },
  zh: { code: 'zh', name: '中文', catalog: zh }
};

export const defaultLanguage = 'vi';

/**
 * Normalizes input language string into 'vi', 'en', or 'zh'.
 * @param {string} [input]
 * @returns {'vi'|'en'|'zh'}
 */
export function normalizeLanguage(input) {
  if (!input || typeof input !== 'string') return defaultLanguage;
  const lower = input.toLowerCase().trim();
  if (/^vi($|[-_])/.test(lower) || lower.includes('vietnam')) return 'vi';
  if (/^en($|[-_])/.test(lower) || lower.includes('english')) return 'en';
  if (/^zh($|[-_])/.test(lower) || lower.includes('chinese')) return 'zh';
  return defaultLanguage;
}

/**
 * Gets a localized message by section and key.
 * @param {'vi'|'en'|'zh'} lang
 * @param {string} keyPath (e.g. 'animation.settingsTitle' or 'common.ok')
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function t(lang, keyPath, params = {}) {
  const code = normalizeLanguage(lang);
  const catalog = supportedLanguages[code]?.catalog || vi;
  const parts = keyPath.split('.');
  let current = catalog;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English, then Vietnamese
      let fallback = en;
      for (const p of parts) {
        if (fallback && typeof fallback === 'object' && p in fallback) fallback = fallback[p];
        else { fallback = null; break; }
      }
      current = fallback || keyPath;
      break;
    }
  }

  if (typeof current !== 'string') return keyPath;
  let text = current;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

export { vi, en, zh };

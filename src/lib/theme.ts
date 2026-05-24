export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/** Stored user choice, or null if never set. */
export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

/** System preference; falls back to dark when unknown. */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

/** Stored choice if present, else system preference (fallback dark). */
export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

/** Toggle the `dark` class on <html>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Persist and apply. */
export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

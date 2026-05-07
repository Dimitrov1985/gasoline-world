import { useReducer, useEffect } from 'react'

let _theme = localStorage.getItem('gw_theme') || 'dark'
const _subs = new Set()

function _apply(t) {
  document.documentElement.setAttribute('data-theme', t)
}

_apply(_theme) // apply immediately on module load (prevents flash)

function _notify() { _subs.forEach(fn => fn()) }

export function setTheme(t) {
  if (t === _theme) return
  _theme = t
  localStorage.setItem('gw_theme', t)
  _apply(t)
  _notify()
}

export function useTheme() {
  const [, tick] = useReducer(x => x + 1, 0)

  useEffect(() => {
    _subs.add(tick)
    return () => _subs.delete(tick)
  }, [])

  return { theme: _theme, setTheme, isDark: _theme === 'dark' }
}

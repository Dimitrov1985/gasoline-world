import { useReducer, useEffect } from 'react'
import { ru } from './ru'
import { en } from './en'

const TRANSLATIONS = { ru, en }

// migrate old 'uk' setting to 'ru'
const _stored = localStorage.getItem('gw_lang')
if (_stored === 'uk') localStorage.setItem('gw_lang', 'ru')
let _lang = (localStorage.getItem('gw_lang') === 'en') ? 'en' : 'ru'
const _subs = new Set()

function _notify() { _subs.forEach(fn => fn()) }

export function setLang(lang) {
  if (lang === _lang) return
  _lang = lang
  localStorage.setItem('gw_lang', lang)
  _notify()
}

export function getLang() { return _lang }

export function useTranslation() {
  const [, tick] = useReducer(x => x + 1, 0)

  useEffect(() => {
    _subs.add(tick)
    return () => _subs.delete(tick)
  }, [])

  function t(key, vars) {
    const str = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.ru?.[key] ?? key
    if (!vars) return str
    return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
  }

  return { lang: _lang, t, setLang }
}

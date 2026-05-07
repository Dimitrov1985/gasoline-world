import { useState, useEffect, useCallback } from 'react'
import { DATA } from '../data/gasoline'

function loadLS(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export function useNotifications() {
  const [watched,       setWatched]       = useState(() => new Set(loadLS('gw_watched', [])))
  const [snapshot,      setSnapshot]      = useState(() => loadLS('gw_snapshot', {}))
  const [notifications, setNotifications] = useState(() => loadLS('gw_notifications', []))
  // priceOverrides — simulated price changes (in-memory only, resets on refresh)
  const [priceOverrides, setPriceOverrides] = useState({})

  useEffect(() => saveLS('gw_watched',       [...watched]),       [watched])
  useEffect(() => saveLS('gw_snapshot',      snapshot),           [snapshot])
  useEffect(() => saveLS('gw_notifications', notifications),      [notifications])

  // Effective price for a country+fuel (override > data)
  const getPrice = useCallback((country, fuel) => {
    return priceOverrides[`${country.iso}_${fuel}`] ?? country[fuel].usd
  }, [priceOverrides])

  // Subscribe to a country — save current prices as reference
  const watch = useCallback((iso) => {
    const c = DATA.find(d => d.iso === iso)
    if (!c) return
    setSnapshot(prev => ({
      ...prev,
      [`${iso}_petrol`]: getPrice(c, 'petrol'),
      [`${iso}_diesel`]: getPrice(c, 'diesel'),
    }))
    setWatched(prev => new Set([...prev, iso]))
  }, [getPrice])

  // Unsubscribe
  const unwatch = useCallback((iso) => {
    setWatched(prev => { const n = new Set(prev); n.delete(iso); return n })
    setSnapshot(prev => {
      const n = { ...prev }
      delete n[`${iso}_petrol`]
      delete n[`${iso}_diesel`]
      return n
    })
  }, [])

  // Compare current (or overridden) prices to snapshot → generate notifications
  const checkPrices = useCallback((overrides = {}) => {
    const newNotifs = []
    const newSnap   = {}

    for (const iso of watched) {
      const c = DATA.find(d => d.iso === iso)
      if (!c) continue

      for (const fuel of ['petrol', 'diesel']) {
        const key     = `${iso}_${fuel}`
        const stored  = snapshot[key]
        const current = overrides[key] ?? c[fuel].usd

        if (stored !== undefined && Math.abs(current - stored) > 0.0005) {
          newNotifs.push({
            id:       `${key}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            iso, fuel,
            oldPrice: stored,
            newPrice: current,
            ts:       Date.now(),
            read:     false,
          })
          newSnap[key] = current
        }
      }
    }

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 100))
      setSnapshot(prev => ({ ...prev, ...newSnap }))

      // Browser push notifications
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        newNotifs.forEach(n => {
          const c = DATA.find(d => d.iso === n.iso)
          const dir = n.newPrice > n.oldPrice ? '📈' : '📉'
          try {
            new Notification(`${dir} ${c?.country ?? ''}`, {
              body: `${n.fuel === 'petrol' ? '⛽ Бензин' : '🛢 Дизель'}: $${n.oldPrice.toFixed(3)} → $${n.newPrice.toFixed(3)}`,
            })
          } catch {}
        })
      }
    }

    return newNotifs.length
  }, [watched, snapshot])

  // Simulate a price update for watched countries
  const simulateUpdate = useCallback(() => {
    if (watched.size === 0) return 0

    const overrides = {}
    for (const iso of watched) {
      const c = DATA.find(d => d.iso === iso)
      if (!c) continue
      // Change petrol OR diesel (sometimes both)
      for (const fuel of ['petrol', 'diesel']) {
        if (Math.random() < 0.65) {
          const base   = c[fuel].usd
          const delta  = (Math.random() - 0.35) * 0.14  // -4.9% … +9.1%
          overrides[`${iso}_${fuel}`] = Math.max(0.01, Math.round(base * (1 + delta) * 1000) / 1000)
        }
      }
    }

    setPriceOverrides(overrides)
    return checkPrices(overrides)
  }, [watched, checkPrices])

  const requestPermission = useCallback(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const markAllRead     = useCallback(() =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true }))), [])
  const removeOne       = useCallback((id) =>
    setNotifications(prev => prev.filter(n => n.id !== id)), [])
  const clearAll        = useCallback(() => setNotifications([]), [])

  return {
    watched,
    notifications,
    priceOverrides,
    unreadCount: notifications.filter(n => !n.read).length,
    isWatched:   (iso) => watched.has(iso),
    watch, unwatch,
    simulateUpdate,
    requestPermission,
    markAllRead, removeOne, clearAll,
    getPrice,
  }
}

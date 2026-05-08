import { useState } from 'react'
import { DATA } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import { countryName } from '../../i18n/countryNames'
import styles from './NotificationCenter.module.css'

function timeStr(ts) {
  const d = new Date(ts)
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} `
       + `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function NotifItem({ n, onRemove }) {
  const { t, lang } = useTranslation()
  const c    = DATA.find(d => d.iso === n.iso)
  if (!c) return null
  const isUp = n.newPrice > n.oldPrice
  const pct  = (((n.newPrice - n.oldPrice) / n.oldPrice) * 100).toFixed(1)
  return (
    <div className={`${styles.item} ${n.read ? styles.read : ''}`}>
      {!n.read && <span className={styles.dot} />}
      <span className={styles.iFlag}>{c.flag}</span>
      <div className={styles.iBody}>
        <div className={styles.iTop}>
          <span className={styles.iCountry}>{countryName(c.country, lang)}</span>
          <span className={styles.iFuel}>{t(`notif.${n.fuel}`) || (n.fuel === 'petrol' ? '⛽' : '🛢')}</span>
          <span className={styles.iTime}>{timeStr(n.ts)}</span>
        </div>
        <div className={styles.iPrices}>
          <span className={styles.iOld}>${n.oldPrice.toFixed(3)}</span>
          <span className={styles.iArrow}>→</span>
          <span className={`${styles.iNew} ${isUp ? styles.up : styles.down}`}>${n.newPrice.toFixed(3)}</span>
          <span className={`${styles.iPct} ${isUp ? styles.up : styles.down}`}>
            {isUp ? '+' : ''}{pct}%  {isUp ? '↑' : '↓'}
          </span>
        </div>
      </div>
      <button className={styles.iRemove} onClick={() => onRemove(n.id)} title="✕">✕</button>
    </div>
  )
}

export default function NotificationCenter({
  notifications, unreadCount, watched,
  onMarkAllRead, onClear, onRemove,
  onUnwatch, onSimulate, onRequestPermission,
}) {
  const { t, lang } = useTranslation()
  const [open,   setOpen]   = useState(false)
  const [tab,    setTab]    = useState('notifs')
  const [simMsg, setSimMsg] = useState(null)

  function handleSimulate() {
    const count = onSimulate()
    setSimMsg(count > 0
      ? `✅ ${count} ${lang === 'en' ? 'price changes detected' : 'змін знайдено'}`
      : watched.size === 0
        ? (lang === 'en' ? '⚠️ No subscriptions' : '⚠️ Немає підписок')
        : (lang === 'en' ? '✅ No changes' : '✅ Змін немає'))
    setTimeout(() => setSimMsg(null), 4000)
    setTab('notifs')
  }

  const permStatus = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'

  return (
    <>
      <button className={styles.bell} onClick={() => setOpen(o => !o)} title={t('notif.title')}>
        🔔
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>{t('notif.title')}</span>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className={styles.tabs}>
              <button className={`${styles.ptab} ${tab === 'notifs' ? styles.ptabA : ''}`}
                onClick={() => setTab('notifs')}>
                {t('notif.feed')}
                {unreadCount > 0 && <span className={styles.tbadge}>{unreadCount}</span>}
              </button>
              <button className={`${styles.ptab} ${tab === 'watch' ? styles.ptabA : ''}`}
                onClick={() => setTab('watch')}>
                {t('notif.watchlist')} <span className={styles.tbadge2}>{watched.size}</span>
              </button>
            </div>

            {tab === 'notifs' && (
              <div className={styles.tabContent}>
                {permStatus === 'default' && (
                  <div className={styles.permBanner}>
                    <span>{t('notif.permissionTxt')}</span>
                    <button className={styles.permBtn} onClick={onRequestPermission}>{t('notif.permissionBtn')}</button>
                  </div>
                )}
                {simMsg && <div className={styles.simMsg}>{simMsg}</div>}
                <div className={styles.actions}>
                  <button className={styles.simBtn} onClick={handleSimulate}>{t('notif.simulate')}</button>
                  {unreadCount > 0 && (
                    <button className={styles.actionBtn} onClick={onMarkAllRead}>{t('notif.markRead')}</button>
                  )}
                  {notifications.length > 0 && (
                    <button className={styles.actionBtn} onClick={onClear}>🗑</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🔕</div>
                    <div className={styles.emptyText}>{t('notif.empty')}</div>
                    <div className={styles.emptyHint}>{t('notif.emptyHint')}</div>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {notifications.map(n => <NotifItem key={n.id} n={n} onRemove={onRemove} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'watch' && (
              <div className={styles.tabContent}>
                {watched.size === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🔕</div>
                    <div className={styles.emptyText}>{t('notif.noWatch')}</div>
                    <div className={styles.emptyHint}>{t('notif.noWatchHint')}</div>
                  </div>
                ) : (
                  <div className={styles.watchList}>
                    {[...watched].map(iso => {
                      const c = DATA.find(d => d.iso === iso)
                      if (!c) return null
                      return (
                        <div key={iso} className={styles.watchItem}>
                          <span className={styles.wFlag}>{c.flag}</span>
                          <div className={styles.wInfo}>
                            <span className={styles.wName}>{countryName(c.country, lang)}</span>
                            <span className={styles.wRegion}>{t(`region.${c.region}`)}</span>
                          </div>
                          <button className={styles.unwatchBtn} onClick={() => onUnwatch(iso)}>
                            {t('notif.unwatch')}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

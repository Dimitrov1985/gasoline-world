import { getPriceClass, getBarWidth } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import { countryName } from '../../i18n/countryNames'
import styles from './CardsGrid.module.css'

export default function CardsGrid({ items, fuel, selectedIso, onSelect, isWatched, onWatch }) {
  const { t, lang } = useTranslation()
  if (items.length === 0) return <div className={styles.empty}>{t('list.notFound')}</div>

  return (
    <div className={styles.grid}>
      {items.map((d, i) => {
        const price    = d[fuel]
        const cls      = getPriceClass(price.usd)
        const bw       = getBarWidth(price.usd, fuel)
        const isActive = d.iso === selectedIso
        const watching = isWatched?.(d.iso)
        return (
          <div
            key={d.country}
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            style={{ animationDelay: `${i * 0.025}s` }}
            onClick={() => onSelect(d.iso)}
          >
            <div className={`${styles.bar} ${styles[cls]}`} style={{ width: `${bw}%` }} />

            <button
              className={`${styles.watchBtn} ${watching ? styles.watchActive : ''}`}
              onClick={e => { e.stopPropagation(); onWatch?.(d.iso) }}
              title={watching ? t('notif.unwatchTooltip') : t('notif.watchTooltip')}
            >
              🔔
            </button>

            {isActive && <div className={styles.activeBadge}>{t('list.inCalc')}</div>}

            <div className={styles.flag}>{d.flag}</div>
            <div className={styles.info}>
              <div className={styles.name}>{countryName(d.country, lang)}</div>
              <div className={styles.local}>{price.local} / {t('calc.liters')}</div>
            </div>
            <div className={styles.priceBlock}>
              <div className={`${styles.usd} ${styles[cls]}`}>${price.usd.toFixed(2)}</div>
              <div className={styles.unit}>{t('list.perLiter')}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

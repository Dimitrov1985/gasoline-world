import { DATA } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import styles from './Stats.module.css'

function pctDiff(a, b) {
  return Math.round(Math.abs((a - b) / b) * 100)
}

export default function Stats({ fuel }) {
  const { t, lang } = useTranslation()
  const sorted   = [...DATA].sort((a, b) => a[fuel].usd - b[fuel].usd)
  const cheapest = sorted[0]
  const priciest = sorted[sorted.length - 1]
  const avg      = DATA.reduce((s, d) => s + d[fuel].usd, 0) / DATA.length
  const avgStr   = avg.toFixed(2)
  const regions  = new Set(DATA.map(d => d.region)).size

  const cheapDelta  = pctDiff(cheapest[fuel].usd, avg)
  const priceyDelta = pctDiff(priciest[fuel].usd, avg)
  const vsAvg       = lang === 'ru' ? 'от среднего' : 'vs avg'

  return (
    <div className={styles.stats}>

      {/* Cheapest */}
      <div className={`${styles.card} ${styles.green}`} data-glyph="↓">
        <div className={`${styles.cardBadge} ${styles.badgeGreen}`}>↓</div>
        <div className={styles.label}>{t('stats.cheapest')}</div>
        <div className={`${styles.value} ${styles.cheapVal}`}>${cheapest[fuel].usd.toFixed(2)}</div>
        <div className={styles.country}>{cheapest.flag} {cheapest.country}</div>
        <div className={`${styles.delta} ${styles.deltaDown}`}>−{cheapDelta}% {vsAvg}</div>
      </div>

      {/* Most expensive */}
      <div className={`${styles.card} ${styles.red}`} data-glyph="↑">
        <div className={`${styles.cardBadge} ${styles.badgeRed}`}>↑</div>
        <div className={styles.label}>{t('stats.expensive')}</div>
        <div className={`${styles.value} ${styles.expensiveVal}`}>${priciest[fuel].usd.toFixed(2)}</div>
        <div className={styles.country}>{priciest.flag} {priciest.country}</div>
        <div className={`${styles.delta} ${styles.deltaUp}`}>+{priceyDelta}% {vsAvg}</div>
      </div>

      {/* World average */}
      <div className={`${styles.card} ${styles.blue}`} data-glyph="≈">
        <div className={`${styles.cardBadge} ${styles.badgeBlue}`}>≈</div>
        <div className={styles.label}>{t('stats.average')}</div>
        <div className={`${styles.value} ${styles.avgVal}`}>${avgStr}</div>
        <div className={styles.country}>{t('stats.perLiter')}</div>
      </div>

      {/* Countries count */}
      <div className={`${styles.card} ${styles.orange}`} data-glyph="#">
        <div className={`${styles.cardBadge} ${styles.badgeOrange}`}>#</div>
        <div className={styles.label}>{t('stats.countries')}</div>
        <div className={`${styles.value} ${styles.orangeVal}`}>{DATA.length}</div>
        <div className={styles.country}>{t('stats.regions')}: {regions}</div>
      </div>

    </div>
  )
}

import { DATA } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import styles from './Stats.module.css'

export default function Stats({ fuel }) {
  const { t } = useTranslation()
  const sorted   = [...DATA].sort((a, b) => a[fuel].usd - b[fuel].usd)
  const cheapest = sorted[0]
  const priciest = sorted[sorted.length - 1]
  const avg      = (DATA.reduce((s, d) => s + d[fuel].usd, 0) / DATA.length).toFixed(2)
  const regions  = new Set(DATA.map(d => d.region)).size

  return (
    <div className={styles.stats}>
      <div className={`${styles.card} ${styles.green}`}>
        <div className={styles.label}>{t('stats.cheapest')}</div>
        <div className={`${styles.value} ${styles.cheapVal}`}>${cheapest[fuel].usd.toFixed(2)}</div>
        <div className={styles.country}>{cheapest.flag} {cheapest.country}</div>
      </div>
      <div className={`${styles.card} ${styles.red}`}>
        <div className={styles.label}>{t('stats.expensive')}</div>
        <div className={`${styles.value} ${styles.expensiveVal}`}>${priciest[fuel].usd.toFixed(2)}</div>
        <div className={styles.country}>{priciest.flag} {priciest.country}</div>
      </div>
      <div className={`${styles.card} ${styles.blue}`}>
        <div className={styles.label}>{t('stats.average')}</div>
        <div className={`${styles.value} ${styles.avgVal}`}>${avg}</div>
        <div className={styles.country}>{t('stats.perLiter')}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.label}>{t('stats.countries')}</div>
        <div className={`${styles.value} ${styles.orangeVal}`}>{DATA.length}</div>
        <div className={styles.country}>{t('stats.regions')}: {regions}</div>
      </div>
    </div>
  )
}

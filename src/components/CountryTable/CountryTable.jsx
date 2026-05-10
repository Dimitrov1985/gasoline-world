import { getPriceClass } from '../../data/gasoline'
import { generateForecast } from '../../data/forecast'
import { useTranslation } from '../../i18n'
import { countryName } from '../../i18n/countryNames'
import Sparkline from '../Sparkline/Sparkline'
import styles from './CountryTable.module.css'

export default function CountryTable({ items, fuel, selectedIso, onSelect, isWatched, onWatch }) {
  const { t, lang } = useTranslation()
  if (items.length === 0) return <div className={styles.empty}>{t('list.notFound')}</div>

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('table.rank')}</th>
            <th>{t('table.flag')}</th>
            <th>{t('table.country')}</th>
            <th>{t('table.region')}</th>
            <th>{t('table.usd')}</th>
            <th className={styles.trendCol}>8м</th>
            <th>{t('table.local')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((d, i) => {
            const price       = d[fuel]
            const cls         = getPriceClass(price.usd)
            const isActive    = d.iso === selectedIso
            const watching    = isWatched?.(d.iso)
            const sparkPoints = generateForecast(d, fuel, 8).map(p => p.price)
            return (
              <tr
                key={d.country}
                className={isActive ? styles.activeRow : ''}
                onClick={() => onSelect(d.iso)}
                style={{ cursor: 'pointer', animationDelay: `${i * 0.02}s` }}
              >
                <td className={styles.rank}>{i + 1}</td>
                <td className={styles.flag}>{d.flag}</td>
                <td className={styles.name}>
                  {countryName(d.country, lang)}
                  {isActive && <span className={styles.activeBadge}>⚡</span>}
                </td>
                <td className={styles.region}>{t(`region.${d.region}`)}</td>
                <td className={styles.priceUsd}>
                  <span className={`${styles.dot} ${styles[cls]}`} />
                  <span className={styles[cls]}>${price.usd.toFixed(2)}</span>
                </td>
                <td className={styles.trendCol}>
                  <Sparkline points={sparkPoints} cls={cls} width={48} height={18} />
                </td>
                <td className={styles.local}>{price.local}</td>
                <td className={styles.watchCell}>
                  <button
                    className={`${styles.watchBtn} ${watching ? styles.watchActive : ''}`}
                    onClick={e => { e.stopPropagation(); onWatch?.(d.iso) }}
                    title={watching ? t('notif.unwatchTooltip') : t('notif.watchTooltip')}
                  >
                    🔔
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

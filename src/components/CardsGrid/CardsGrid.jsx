import { getPriceClass } from '../../data/gasoline'
import { generateForecast } from '../../data/forecast'
import { useTranslation } from '../../i18n'
import { countryName } from '../../i18n/countryNames'
import Sparkline from '../Sparkline/Sparkline'
import PriceBar from '../PriceBar/PriceBar'
import styles from './CardsGrid.module.css'

export default function CardsGrid({ items, fuel, selectedIso, onSelect, isWatched, onWatch }) {
  const { t, lang } = useTranslation()
  if (items.length === 0) return <div className={styles.empty}>{t('list.notFound')}</div>

  return (
    <div className={styles.grid}>
      {items.map((d, i) => {
        const price       = d[fuel]
        const cls         = getPriceClass(price.usd)
        const isActive    = d.iso === selectedIso
        const watching    = isWatched?.(d.iso)
        const sparkPoints = generateForecast(d, fuel, 8).map(p => p.price)
        return (
          <div
            key={d.country}
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            style={{ animationDelay: `${i * 0.025}s` }}
            onClick={() => onSelect(d.iso)}
          >
            <PriceBar usd={price.usd} fuel={fuel} cls={cls} />

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
              <div className={styles.name} title={countryName(d.country, lang)}>{countryName(d.country, lang)}</div>
              <div className={styles.local}>{price.local} / {t('calc.liters')}</div>
            </div>
            <Sparkline points={sparkPoints} cls={cls} />
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

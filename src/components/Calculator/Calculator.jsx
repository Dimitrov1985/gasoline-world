import { useState, useMemo } from 'react'
import { DATA, FUELS, getPriceClass } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import { countryName } from '../../i18n/countryNames'
import styles from './Calculator.module.css'

const PRESETS = [30, 40, 50, 60, 70, 80]

function parseLocal(str) {
  const m = str.match(/^([0-9\s.,]+)\s*(.*)$/)
  if (!m) return { amount: null, currency: str }
  const amount   = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'))
  const currency = m[2].trim()
  return { amount, currency }
}

function formatLocal(priceStr, volume) {
  const { amount, currency } = parseLocal(priceStr)
  if (!amount) return priceStr
  const total    = amount * volume
  const decimals = total >= 100 ? 0 : total >= 10 ? 1 : 2
  return `${total.toFixed(decimals)} ${currency}`
}

export default function Calculator({ fuel, onFuelChange, selectedIso, onSelectIso }) {
  const { t, lang } = useTranslation()
  const [volume, setVolume] = useState(50)

  const sortedCountries = useMemo(
    () => [...DATA].sort((a, b) => {
      const na = lang === 'en' ? (a.country) : a.country
      const nb = lang === 'en' ? (b.country) : b.country
      return na.localeCompare(nb, lang === 'en' ? 'en' : 'ru')
    }),
    [lang]
  )

  const selected = DATA.find(d => d.iso === selectedIso) ?? DATA[0]
  const price    = selected[fuel]
  const totalUsd = price.usd * volume
  const cls      = getPriceClass(price.usd)

  const maxUsd    = useMemo(() => Math.max(...DATA.map(d => d[fuel].usd)), [fuel])
  const cheapest3 = useMemo(() => [...DATA].sort((a, b) => a[fuel].usd - b[fuel].usd).slice(0, 3), [fuel])
  const inTop3    = cheapest3.some(d => d.iso === selectedIso)

  return (
    <section className={styles.section} id="calculator">
      <div className={styles.header}>
        <span className={styles.title}>{t('calc.title')}</span>
        <span className={styles.hint}>{t('calc.hint')}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.inputs}>

          <div className={styles.field}>
            <label className={styles.label}>{t('calc.fuel')}</label>
            <div className={styles.fuelToggle}>
              {FUELS.map(f => (
                <button
                  key={f.key}
                  className={`${styles.fuelBtn} ${fuel === f.key ? styles.fuelActive : ''}`}
                  onClick={() => onFuelChange(f.key)}
                >
                  {t(`fuel.${f.key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('calc.country')}</label>
            <select
              className={styles.select}
              value={selectedIso}
              onChange={e => onSelectIso(Number(e.target.value))}
            >
              {sortedCountries.map(d => (
                <option key={d.iso} value={d.iso}>
                  {d.flag} {countryName(d.country, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              {t('calc.volume')}&nbsp;
              <span className={styles.volumeNum}>{volume} {t('calc.liters')}</span>
            </label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderMin}>10</span>
              <input
                type="range" min={10} max={150} step={1}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.sliderMax}>150</span>
              <input
                type="number" min={1} max={999}
                value={volume}
                onChange={e => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n) && n >= 1 && n <= 999) setVolume(n)
                }}
                className={styles.numInput}
              />
            </div>
            <div className={styles.presets}>
              {PRESETS.map(p => (
                <button
                  key={p}
                  className={`${styles.preset} ${volume === p ? styles.presetActive : ''}`}
                  onClick={() => setVolume(p)}
                >
                  {p}{t('calc.liters')}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className={styles.result}>
          <div className={styles.resultTop}>
            <span className={styles.resultFlag}>{selected.flag}</span>
            <div>
              <div className={styles.resultName}>{countryName(selected.country, lang)}</div>
              <div className={styles.resultRegion}>{t(`region.${selected.region}`)}</div>
            </div>
          </div>

          <div className={styles.resultPrice}>
            <div className={styles.resultLabel}>{t('calc.fullTank')} ({volume} {t('calc.liters')})</div>
            <div className={`${styles.resultUsd} ${styles[cls]}`}>${totalUsd.toFixed(2)}</div>
            <div className={styles.resultLocalLine}>≈ {formatLocal(price.local, volume)}</div>
            <div className={styles.perLiter}>{price.usd.toFixed(3)} {t('calc.perLiter')}</div>
          </div>

          <div className={styles.comp}>
            <div className={styles.compTitle}>{t('calc.compare')}</div>
            {[...cheapest3, ...(inTop3 ? [] : [selected])].map(d => {
              const t2  = d[fuel].usd * volume
              const pct = Math.min(100, (t2 / (maxUsd * volume)) * 100)
              const c   = getPriceClass(d[fuel].usd)
              const isCurrent = d.iso === selectedIso
              return (
                <div key={d.iso} className={`${styles.compRow} ${isCurrent ? styles.compCurrent : ''}`}>
                  <span className={styles.compFlag}>{d.flag}</span>
                  <span className={styles.compName}>{countryName(d.country, lang)}</span>
                  <div className={styles.compTrack}>
                    <div className={`${styles.compFill} ${styles['fill_' + c]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`${styles.compAmt} ${styles[c]}`}>${t2.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

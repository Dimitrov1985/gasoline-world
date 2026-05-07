import { REGIONS, FUELS } from '../../data/gasoline'
import { useTranslation } from '../../i18n'
import styles from './Controls.module.css'

export default function Controls({
  search, sort, region, view, fuel,
  onSearch, onSort, onRegion, onView, onFuel,
}) {
  const { t } = useTranslation()

  return (
    <div className={styles.controls}>
      <div className={styles.searchBox}>
        <span className={styles.icon}>🔍</span>
        <input
          type="text"
          placeholder={t('ctrl.search')}
          value={search}
          onChange={e => onSearch(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.fuelToggle}>
        {FUELS.map(f => (
          <button
            key={f.key}
            className={`${styles.fuelBtn} ${fuel === f.key ? styles.fuelActive : ''}`}
            onClick={() => onFuel(f.key)}
          >
            {t(`fuel.${f.key}`)}
          </button>
        ))}
      </div>

      <select className={styles.select} value={sort} onChange={e => onSort(e.target.value)}>
        <option value="asc">{t('ctrl.sortCheap')}</option>
        <option value="desc">{t('ctrl.sortExp')}</option>
        <option value="name">{t('ctrl.sortName')}</option>
      </select>

      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${view === 'cards' ? styles.active : ''}`}
          onClick={() => onView('cards')}
        >
          {t('ctrl.cards')}
        </button>
        <button
          className={`${styles.viewBtn} ${view === 'table' ? styles.active : ''}`}
          onClick={() => onView('table')}
        >
          {t('ctrl.table')}
        </button>
      </div>

      <div className={styles.regions}>
        <button
          className={`${styles.regionBtn} ${region === 'all' ? styles.regionActive : ''}`}
          onClick={() => onRegion('all')}
        >
          {t('region.all')}
        </button>
        {REGIONS.map(r => (
          <button
            key={r}
            className={`${styles.regionBtn} ${region === r ? styles.regionActive : ''}`}
            onClick={() => onRegion(r)}
          >
            {t(`region.${r}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

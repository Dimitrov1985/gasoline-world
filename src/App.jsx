import { useState, useMemo } from 'react'
import Splash from './components/Splash/Splash'
import { DATA } from './data/gasoline'
import { useNotifications } from './hooks/useNotifications'
import Header from './components/Header/Header'
import Stats from './components/Stats/Stats'
import WorldMap from './components/WorldMap/WorldMap'
import Calculator from './components/Calculator/Calculator'
import Controls from './components/Controls/Controls'
import CardsGrid from './components/CardsGrid/CardsGrid'
import CountryTable from './components/CountryTable/CountryTable'
import Forecast from './components/Forecast/Forecast'
import News from './components/News/News'
import NotificationCenter from './components/NotificationCenter/NotificationCenter'
import { useTranslation } from './i18n'
import styles from './App.module.css'

export default function App() {
  const [splash, setSplash]           = useState(true)
  const [search, setSearch]           = useState('')
  const [sort, setSort]               = useState('asc')
  const [region, setRegion]           = useState('all')
  const [view, setView]               = useState('cards')
  const [fuel, setFuel]               = useState('petrol')
  const [selectedIso, setSelectedIso] = useState(643)
  const [section, setSection]         = useState('main')  // 'main' | 'forecast' | 'news'

  const notif      = useNotifications()
  const { t, lang } = useTranslation()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let items = DATA.filter(d => {
      const matchSearch = d.country.toLowerCase().includes(q)
      const matchRegion = region === 'all' || d.region === region
      return matchSearch && matchRegion
    })
    if (sort === 'asc')  items = [...items].sort((a, b) => a[fuel].usd - b[fuel].usd)
    if (sort === 'desc') items = [...items].sort((a, b) => b[fuel].usd - a[fuel].usd)
    if (sort === 'name') items = [...items].sort((a, b) => a.country.localeCompare(b.country, 'ru'))
    return items
  }, [search, sort, region, fuel])

  function selectCountry(iso) {
    setSelectedIso(iso)
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function toggleWatch(iso) {
    if (notif.isWatched(iso)) notif.unwatch(iso)
    else notif.watch(iso)
  }

  const bellSlot = (
    <NotificationCenter
      notifications={notif.notifications}
      unreadCount={notif.unreadCount}
      watched={notif.watched}
      onMarkAllRead={notif.markAllRead}
      onClear={notif.clearAll}
      onRemove={notif.removeOne}
      onWatch={notif.watch}
      onUnwatch={notif.unwatch}
      onSimulate={notif.simulateUpdate}
      onRequestPermission={notif.requestPermission}
    />
  )

  return (
    <div className={styles.app}>
      {splash && <Splash onDone={() => setSplash(false)} />}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <Header notificationSlot={bellSlot} onLogoClick={() => setSection('main')} />
      <Stats fuel={fuel} />

      {/* Section nav */}
      <nav className={styles.sectionNav}>
        <button className={`${styles.navBtn} ${section === 'main' ? styles.navActive : ''}`}
          onClick={() => setSection('main')}>
          {t('app.overview')}
        </button>
        <button className={`${styles.navBtn} ${section === 'forecast' ? styles.navActive : ''}`}
          onClick={() => setSection('forecast')}>
          {t('app.forecast')}
        </button>
        <button className={`${styles.navBtn} ${section === 'news' ? styles.navActive : ''}`}
          onClick={() => setSection('news')}>
          {lang === 'en' ? '📰 News' : '📰 Новости'}
        </button>
      </nav>

      {section === 'main' && (
        <>
          <WorldMap fuel={fuel} selectedIso={selectedIso} onSelect={selectCountry} />
          <Calculator
            fuel={fuel} onFuelChange={setFuel}
            selectedIso={selectedIso} onSelectIso={setSelectedIso}
          />
          <Controls
            search={search} sort={sort} region={region} view={view} fuel={fuel}
            onSearch={setSearch} onSort={setSort} onRegion={setRegion}
            onView={setView} onFuel={setFuel}
          />
          <main className={styles.main}>
            <div className={styles.count}>
              {t('app.showing')} <span>{filtered.length}</span> {t('app.of')} {DATA.length} {t('app.countries')}
            </div>
            {view === 'cards'
              ? <CardsGrid
                  items={filtered} fuel={fuel}
                  selectedIso={selectedIso} onSelect={selectCountry}
                  isWatched={notif.isWatched} onWatch={toggleWatch}
                />
              : <CountryTable
                  items={filtered} fuel={fuel}
                  selectedIso={selectedIso} onSelect={selectCountry}
                  isWatched={notif.isWatched} onWatch={toggleWatch}
                />
            }
          </main>
        </>
      )}

      {section === 'forecast' && (
        <Forecast fuel={fuel} onFuelChange={setFuel} />
      )}

      {section === 'news' && <News />}
    </div>
  )
}

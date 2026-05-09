import { useState } from 'react'
import { CATEGORIES_UK, CATEGORIES_EN } from '../../data/news'
import { useNews } from '../../hooks/useNews'
import { useTranslation } from '../../i18n'
import styles from './News.module.css'

function timeAgo(dateStr, lang) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  if (days === 0) return lang === 'en' ? 'Today'        : 'Сегодня'
  if (days === 1) return lang === 'en' ? 'Yesterday'    : 'Вчера'
  if (days < 7)  return lang === 'en' ? `${days}d ago`  : `${days} дн. назад`
  return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'short' })
}

const CAT_COLORS = {
  'ОПЕК':          '#f59e0b', 'OPEC':         '#f59e0b',
  'Ближний Восток':'#10b981', 'Middle East':  '#10b981',
  'Европа':        '#3b82f6', 'Europe':       '#3b82f6',
  'Сев. Америка':  '#8b5cf6', 'N. America':   '#8b5cf6',
  'Азия':          '#ec4899', 'Asia':         '#ec4899',
  'Африка':        '#f97316', 'Africa':       '#f97316',
  'Ю. Америка':    '#14b8a6', 'S. America':   '#14b8a6',
  'Россия':        '#64748b', 'Russia':       '#64748b',
}

function NewsCard({ item, featured, onClick, lang }) {
  const cat     = lang === 'en' ? item.categoryEn : item.categoryUk
  const color   = CAT_COLORS[cat] ?? 'var(--orange)'
  const title   = lang === 'en' ? item.titleEn   : item.title
  const summary = lang === 'en' ? item.summaryEn : item.summary

  return (
    <article
      className={`${styles.card} ${featured ? styles.featured : ''}`}
      onClick={() => onClick(item)}
    >
      <div className={styles.cardTop} style={{ '--cat-color': color }}>
        <span className={styles.flag}>{item.flag}</span>
        <span className={styles.cat} style={{ color, borderColor: color, background: `${color}18` }}>
          {cat}
        </span>
        <span className={styles.date}>{timeAgo(item.date, lang)}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.summary}>{summary}</p>
      <div className={styles.cardFooter}>
        <span className={styles.source}>{item.source}</span>
        <span className={styles.readMore}>{lang === 'en' ? 'Read more →' : 'Читать →'}</span>
      </div>
    </article>
  )
}

function Modal({ item, onClose, lang }) {
  if (!item) return null
  const cat     = lang === 'en' ? item.categoryEn : item.categoryUk
  const color   = CAT_COLORS[cat] ?? 'var(--orange)'
  const title   = lang === 'en' ? item.titleEn   : item.title
  const summary = lang === 'en' ? item.summaryEn : item.summary
  const body    = lang === 'en' ? item.bodyEn    : item.body

  return (
    <>
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modal}>

        {/* Sticky header */}
        <div className={styles.modalHead}>
          <div className={styles.modalMeta}>
            <span className={styles.flag}>{item.flag}</span>
            <span className={styles.cat} style={{ color, borderColor: color, background: `${color}18` }}>{cat}</span>
            <span className={styles.date}>{timeAgo(item.date, lang)}</span>
            <span className={styles.source}>{item.source}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Scrollable body */}
        <div className={styles.modalScroll}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <p className={styles.modalSummary}>{summary}</p>
          <div className={styles.modalDivider} style={{ background: color }} />
          <p className={styles.modalBody}>{body}</p>
          {item.url && item.url !== '#' && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
              {lang === 'en' ? '↗ Read full article on' : '↗ Читати повністю на'} {item.source}
            </a>
          )}
          {!item.isLive && (
            <div className={styles.modalFooterNote}>
              {lang === 'en'
                ? '* Demo content for illustration purposes.'
                : '* Демо-контент у навчальних цілях.'}
            </div>
          )}
        </div>

      </div>
    </>
  )
}

export default function News() {
  const { lang } = useTranslation()
  const { articles, loading, isLive } = useNews()
  const [activeCategory, setActiveCategory] = useState(0)
  const [search,         setSearch]         = useState('')
  const [openItem,       setOpenItem]       = useState(null)

  const categories = lang === 'en' ? CATEGORIES_EN : CATEGORIES_UK

  const filtered = articles.filter(item => {
    const cat  = lang === 'en' ? item.categoryEn : item.categoryUk
    const txt  = (lang === 'en' ? item.titleEn + item.summaryEn : item.title + item.summary).toLowerCase()
    const catOk = activeCategory === 0 || cat === categories[activeCategory]
    const srcOk = txt.includes(search.toLowerCase()) || item.source.toLowerCase().includes(search.toLowerCase())
    return catOk && (!search || srcOk)
  })

  const featured = filtered.find(n => n.featured)
  const rest     = filtered.filter(n => !n.featured)

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.pageTitle}>📰 {lang === 'en' ? 'Fuel News' : 'Новини пального'}</span>
          {isLive
            ? <span className={styles.liveBadge}>🔴 LIVE</span>
            : <span className={styles.staticBadge}>{lang === 'en' ? 'Demo' : 'Демо'}</span>
          }
          {loading && <span className={styles.loadingBadge}>⏳</span>}
          <span className={styles.count}>{filtered.length} {lang === 'en' ? 'articles' : 'материалов'}</span>
        </div>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.search}
            placeholder={lang === 'en' ? 'Search news...' : 'Поиск новостей...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className={styles.cats}>
        {categories.map((c, i) => (
          <button
            key={i}
            className={`${styles.catBtn} ${activeCategory === i ? styles.catActive : ''}`}
            onClick={() => setActiveCategory(i)}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          🔍 {lang === 'en' ? 'Nothing found' : 'Ничего не найдено'}
        </div>
      ) : (
        <div className={styles.feed}>
          {/* Featured article */}
          {featured && (
            <NewsCard item={featured} featured lang={lang} onClick={setOpenItem} />
          )}
          {/* Grid */}
          <div className={styles.grid}>
            {rest.map(item => (
              <NewsCard key={item.id} item={item} featured={false} lang={lang} onClick={setOpenItem} />
            ))}
          </div>
        </div>
      )}

      <Modal item={openItem} onClose={() => setOpenItem(null)} lang={lang} />
    </div>
  )
}

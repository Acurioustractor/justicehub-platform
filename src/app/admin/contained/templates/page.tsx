'use client'

import { useState, useMemo } from 'react'
import { STATS, FORMATS, type FormatKey } from '@/lib/contained-brand'

// ─── Photo library from Empathy Ledger ──────────────────────────────────────

const PHOTO_BASE = 'https://yvnuayzslukamizrlhwb.supabase.co/storage/v1/object/public/gallery-photos/justicehub'

const PHOTO_LIBRARY = [
  { url: `${PHOTO_BASE}/people/spotlight-on-changemaker-brodie-germaine.jpg`, label: 'Brodie Germaine', category: 'people' },
  { url: `${PHOTO_BASE}/people/a-heros-journey-from-addiction-to-inspiration-the-life-of-vic.jpg`, label: 'Vic — Hero Journey', category: 'people' },
  { url: `${PHOTO_BASE}/programs/confit-pathways.jpg`, label: 'Confit Pathways', category: 'programs' },
  { url: `${PHOTO_BASE}/programs/walking-new-paths-reflections-from-bimberi.jpg`, label: 'Bimberi Reflections', category: 'programs' },
  { url: `${PHOTO_BASE}/spain/diagrama-youth-justice-spain.jpg`, label: 'Diagrama Spain', category: 'spain' },
  { url: `${PHOTO_BASE}/spain/beyond-walls-what-spanish-youth-detention-centers-taught-me-about-seeing-humanity-first.jpg`, label: 'Beyond Walls', category: 'spain' },
  { url: `${PHOTO_BASE}/community/breaking-bread-breaking-chains-when-two-worlds-collide.jpg`, label: 'Breaking Bread', category: 'community' },
  { url: `${PHOTO_BASE}/community/connecting-communities-a-network-for-justice-reinvestment.jpeg`, label: 'Justice Reinvestment', category: 'community' },
  { url: `${PHOTO_BASE}/places/header-dji-0323-light.jpg`, label: 'Oonchiumpa Aerial', category: 'places' },
  { url: `${PHOTO_BASE}/hero/brodie.jpg`, label: 'Brodie Portrait', category: 'hero' },
  { url: `${PHOTO_BASE}/hero/mentoring.jpg`, label: 'Mentoring', category: 'hero' },
  { url: `${PHOTO_BASE}/goods/container-factory.jpg`, label: 'Container Factory', category: 'goods' },
  { url: `${PHOTO_BASE}/goods/stretch-bed-hero.jpg`, label: 'Stretch Bed', category: 'goods' },
  { url: `${PHOTO_BASE}/goods/community-bed-assembly.jpg`, label: 'Community Build', category: 'goods' },
]

type CardType = 'stat' | 'quote' | 'story' | 'photo'

export default function TemplateExplorer() {
  const [cardType, setCardType] = useState<CardType>('stat')
  const [format, setFormat] = useState<FormatKey>('square')
  const [selectedStat, setSelectedStat] = useState('detention_cost')
  const [quote, setQuote] = useState("The system isn't broken. It was built this way.")
  const [author, setAuthor] = useState('')
  const [role, setRole] = useState('')
  const [title, setTitle] = useState('A Story of Change')
  const [excerpt, setExcerpt] = useState('')
  const [theme, setTheme] = useState('')
  const [caption, setCaption] = useState('')
  const [credit, setCredit] = useState('')
  const [location, setLocation] = useState('')
  const [selectedImage, setSelectedImage] = useState('')

  const previewUrl = useMemo(() => {
    const base = `/api/contained/share-card?type=${cardType}&format=${format}`
    const params = new URLSearchParams()
    params.set('type', cardType)
    params.set('format', format)

    if (cardType === 'stat') {
      params.set('stat', selectedStat)
    } else if (cardType === 'quote') {
      params.set('quote', quote)
      if (author) params.set('author', author)
      if (role) params.set('role', role)
      if (selectedImage) params.set('image', selectedImage)
    } else if (cardType === 'story') {
      params.set('title', title)
      if (excerpt) params.set('excerpt', excerpt)
      if (author) params.set('author', author)
      if (theme) params.set('theme', theme)
      if (selectedImage) params.set('image', selectedImage)
    } else if (cardType === 'photo') {
      if (selectedImage) params.set('image', selectedImage)
      if (caption) params.set('caption', caption)
      if (credit) params.set('credit', credit)
      if (location) params.set('location', location)
    }

    return `/api/contained/share-card?${params.toString()}`
  }, [cardType, format, selectedStat, quote, author, role, title, excerpt, theme, caption, credit, location, selectedImage])

  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => setRefreshKey(k => k + 1)

  const copyUrl = () => {
    const fullUrl = `${window.location.origin}${previewUrl}`
    navigator.clipboard.writeText(fullUrl)
  }

  const downloadCard = async () => {
    const res = await fetch(previewUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contained-${cardType}-${format}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = FORMATS[format]
  const aspectRatio = fmt.width / fmt.height

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-[#222] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social Templates</h1>
            <p className="text-[#6b7280] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              CONTAINED Campaign — Branded Social Media Cards
            </p>
          </div>
          <a
            href="/admin/contained"
            className="text-sm text-[#6b7280] hover:text-[#F5F0E8] border border-[#333] px-4 py-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Back to Campaign
          </a>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 max-w-[1800px]">
        {/* Controls Panel */}
        <div className="w-full lg:w-[420px] border-r border-[#222] p-8 space-y-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {/* Card Type */}
          <div>
            <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-3 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Card Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['stat', 'quote', 'story', 'photo'] as CardType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setCardType(t)}
                  className={`px-3 py-2 text-sm font-bold uppercase tracking-wider border ${
                    cardType === t
                      ? 'bg-[#DC2626] border-[#DC2626] text-white'
                      : 'border-[#333] text-[#6b7280] hover:border-[#555]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-3 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(FORMATS) as [FormatKey, typeof FORMATS[FormatKey]][]).map(([key, f]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`px-3 py-2 text-xs uppercase tracking-wider border ${
                    format === key
                      ? 'bg-white text-[#0A0A0A] border-white'
                      : 'border-[#333] text-[#6b7280] hover:border-[#555]'
                  }`}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card-specific controls */}
          {cardType === 'stat' && (
            <div>
              <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-3 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Statistic
              </label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {Object.entries(STATS).map(([key, stat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStat(key)}
                    className={`w-full text-left p-3 border ${
                      selectedStat === key
                        ? 'border-[#DC2626] bg-[#DC2626]/10'
                        : 'border-[#222] hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-bold text-[#DC2626]">{stat.value}</span>
                      <span className="text-sm text-[#6b7280]">{stat.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cardType === 'quote' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Quote</label>
                <textarea
                  value={quote}
                  onChange={e => setQuote(e.target.value)}
                  rows={4}
                  className="w-full bg-[#111] border border-[#333] px-4 py-3 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Author</label>
                  <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Role</label>
                  <input value={role} onChange={e => setRole(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
                </div>
              </div>
            </div>
          )}

          {cardType === 'story' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Excerpt</label>
                <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} className="w-full bg-[#111] border border-[#333] px-4 py-3 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Author</label>
                  <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Theme Tag</label>
                  <input value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" placeholder="e.g. Justice Reinvestment" />
                </div>
              </div>
            </div>
          )}

          {cardType === 'photo' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Caption</label>
                <input value={caption} onChange={e => setCaption(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Credit</label>
                  <input value={credit} onChange={e => setCredit(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-sm focus:border-[#DC2626] outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Photo picker (for quote, story, photo types) */}
          {cardType !== 'stat' && (
            <div>
              <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-3 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Photo ({cardType === 'photo' ? 'Required' : 'Optional'})
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                {PHOTO_LIBRARY.map(photo => (
                  <button
                    key={photo.url}
                    onClick={() => setSelectedImage(selectedImage === photo.url ? '' : photo.url)}
                    className={`relative aspect-square overflow-hidden border-2 ${
                      selectedImage === photo.url ? 'border-[#DC2626]' : 'border-transparent hover:border-[#333]'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                      <span className="text-[9px] text-[#9ca3af]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {photo.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="text-xs text-[#6b7280] uppercase tracking-[4px] mb-2 block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Or paste image URL
                </label>
                <input
                  value={selectedImage}
                  onChange={e => setSelectedImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#111] border border-[#333] px-4 py-2 text-[#F5F0E8] text-xs focus:border-[#DC2626] outline-none"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 bg-white text-black font-bold py-3 text-sm uppercase tracking-wider hover:bg-[#F5F0E8]"
            >
              Preview
            </button>
            <button
              onClick={downloadCard}
              className="flex-1 bg-[#DC2626] text-white font-bold py-3 text-sm uppercase tracking-wider hover:bg-[#b91c1c]"
            >
              Download
            </button>
          </div>
          <button
            onClick={copyUrl}
            className="w-full border border-[#333] text-[#6b7280] py-2 text-xs uppercase tracking-wider hover:border-[#555]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Copy URL
          </button>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 p-8 flex items-start justify-center overflow-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <div
            className="border border-[#222] bg-[#111]"
            style={{
              width: '100%',
              maxWidth: aspectRatio > 1 ? '800px' : aspectRatio < 0.7 ? '360px' : '540px',
              aspectRatio: `${fmt.width} / ${fmt.height}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={refreshKey}
              src={`${previewUrl}&_t=${refreshKey}`}
              alt="Card preview"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

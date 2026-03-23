import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const BRAND = {
  black: '#0A0A0A',
  offWhite: '#F5F0E8',
  red: '#DC2626',
  gray: { 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563' },
}

const STATS: Record<string, { value: string; label: string; subtext: string; source: string }> = {
  detention_cost: { value: '$1.55M', label: 'per child per year', subtext: 'Australia spends $1.55 million per child per year in youth detention — for an 84% reoffending rate.', source: 'Productivity Commission ROGS 2024-25' },
  reoffending: { value: '84%', label: 'reoffend within 2 years', subtext: 'After release from youth detention, 84% of young people reoffend within two years. The system creates more crime.', source: 'AIHW Youth Justice 2023-24' },
  indigenous: { value: '23.1x', label: 'Indigenous overrepresentation', subtext: 'Indigenous young people are 23.1 times more likely to be in detention than non-Indigenous youth.', source: 'Productivity Commission ROGS 2024-25' },
  alternatives: { value: '$520M', label: 'community programs', subtext: '$520M on community youth justice vs $1.14B on detention. 939 alternatives catalogued on ALMA.', source: 'ROGS 2024-25 + ALMA Database' },
  ratio: { value: '$15:$1', label: 'punitive vs what works', subtext: "For every $1 spent on community programs that actually work, $15 goes to punitive systems that don't.", source: 'Calculated from ROGS 2024-25' },
  evidence: { value: '489', label: 'evidence items collected', subtext: "489 evidence items, 1,150 measured outcomes. The data is clear — alternatives work. They just aren't funded.", source: 'ALMA Evidence Database' },
  inequality: { value: '68,000,000:1', label: 'the funding ratio', subtext: "Top 10 recipients get $74.2B. Bottom 100 get $10,860. That's sixty-eight million to one.", source: 'JusticeHub Funding Database — $97.9B tracked' },
  detention_vic: { value: '$7,304/day', label: 'to cage one child in Victoria', subtext: 'Victoria pays $2.67M per year to lock up one child. Community supervision costs $101–$601/day.', source: 'Productivity Commission ROGS 2024-25' },
  community_heroes: { value: '$0', label: 'government funding', subtext: 'Just Reinvest NSW runs 9 evidence-rated programs with zero government funding. They work anyway.', source: 'ALMA Program Catalogue + JusticeHub Funding Database' },
  indigenous_gap: { value: '10.8%', label: 'of funding reaches Indigenous orgs', subtext: 'Indigenous organisations receive 10.8% of justice funding. Indigenous youth are 23x overrepresented in detention.', source: 'JusticeHub Funding Database + ROGS 2024-25' },
  what_works: { value: '981', label: 'alternatives catalogued', subtext: "981 community-led alternatives. 54.9% evidence-backed. They work. They're not funded.", source: 'ALMA Evidence Database — JusticeHub' },
  tour_demand: { value: '230', label: 'people said bring it here', subtext: 'Perth. Melbourne. Canberra. Sydney. 230 Australians said bring the container to their city.', source: 'CONTAINED Campaign — JusticeHub' },
}

const FORMATS: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 630 },
}

const FONT_URLS = {
  spaceGrotesk: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf',
  ibmPlexMono: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n5ig.ttf',
}

async function loadFonts() {
  try {
    const [sg, ipm] = await Promise.all([
      fetch(FONT_URLS.spaceGrotesk).then(r => r.arrayBuffer()),
      fetch(FONT_URLS.ibmPlexMono).then(r => r.arrayBuffer()),
    ])
    return [
      { name: 'Space Grotesk', data: sg, weight: 700 as const, style: 'normal' as const },
      { name: 'IBM Plex Mono', data: ipm, weight: 400 as const, style: 'normal' as const },
    ]
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cardType = searchParams.get('type') || 'stat'
  const formatKey = searchParams.get('format') || 'square'
  const format = FORMATS[formatKey]

  if (!format) return new Response('Invalid format. Options: ' + Object.keys(FORMATS).join(', '), { status: 400 })

  const fonts = await loadFonts()
  const df = fonts.length > 0 ? 'Space Grotesk' : 'system-ui'
  const mf = fonts.length > 0 ? 'IBM Plex Mono' : 'Courier New'
  const isLand = format.width > format.height
  const pad = isLand ? 50 : 80
  const hSz = isLand ? 13 : 16
  const sSz = isLand ? 11 : 14
  const fSz = isLand ? 11 : 13

  // ─── STAT ─────────────────────────────────────────────────────────────────
  if (cardType === 'stat') {
    const stat = STATS[searchParams.get('stat') || 'detention_cost']
    if (!stat) return new Response('Invalid stat. Options: ' + Object.keys(STATS).join(', '), { status: 400 })
    const sc = isLand ? 0.6 : format.height > format.width * 1.5 ? 0.9 : 1

    return new ImageResponse(
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: BRAND.black, padding: pad, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: hSz, fontFamily: df, fontWeight: 700, color: BRAND.red, letterSpacing: 6 }}>THE CONTAINED</div>
          <div style={{ display: 'flex', fontSize: sSz, fontFamily: mf, color: BRAND.gray[500], letterSpacing: 4, marginTop: 4 }}>AUSTRALIAN TOUR 2026</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: Math.round(140 * sc), fontFamily: df, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: -4 }}>{stat.value}</div>
          <div style={{ display: 'flex', fontSize: Math.round(32 * sc), fontFamily: df, fontWeight: 700, color: BRAND.red, letterSpacing: 3, marginTop: 16 }}>{stat.label.toUpperCase()}</div>
          <div style={{ display: 'flex', fontSize: Math.round(22 * sc), fontFamily: mf, color: BRAND.gray[400], lineHeight: 1.5, marginTop: 16, maxWidth: '80%' }}>{stat.subtext}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: fSz, fontFamily: mf, color: BRAND.gray[600], maxWidth: '60%' }}>Source: {stat.source}</div>
          <div style={{ display: 'flex', fontSize: fSz + 3, fontFamily: mf, color: BRAND.gray[500] }}>justicehub.com.au</div>
        </div>
      </div>,
      { width: format.width, height: format.height, fonts }
    )
  }

  // ─── QUOTE ────────────────────────────────────────────────────────────────
  if (cardType === 'quote') {
    const quote = searchParams.get('quote') || "The system isn't broken. It was built this way."
    const author = searchParams.get('author') || ''
    const role = searchParams.get('role') || ''
    const sc = isLand ? 0.7 : 1

    return new ImageResponse(
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: BRAND.black, padding: pad, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: hSz, fontFamily: df, fontWeight: 700, color: BRAND.red, letterSpacing: 6 }}>THE CONTAINED</div>
          <div style={{ display: 'flex', fontSize: sSz, fontFamily: mf, color: BRAND.gray[500], letterSpacing: 4, marginTop: 4 }}>AUSTRALIAN TOUR 2026</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontSize: Math.round(120 * sc), fontFamily: df, fontWeight: 700, color: BRAND.red, lineHeight: 0.8 }}>{'\u201C'}</div>
          <div style={{ display: 'flex', fontSize: Math.round(36 * sc), fontFamily: df, fontWeight: 700, color: BRAND.offWhite, lineHeight: 1.3, marginTop: 16, maxWidth: '90%' }}>{quote}</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24 }}>
            {author ? <div style={{ display: 'flex', fontSize: Math.round(20 * sc), fontFamily: df, fontWeight: 700, color: BRAND.offWhite }}>{author}</div> : <div style={{ display: 'flex' }} />}
            {role ? <div style={{ display: 'flex', fontSize: Math.round(14 * sc), fontFamily: mf, color: BRAND.gray[400], letterSpacing: 2, marginTop: 4 }}>{role.toUpperCase()}</div> : <div style={{ display: 'flex' }} />}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: fSz + 3, fontFamily: mf, color: BRAND.gray[500] }}>justicehub.com.au</div>
        </div>
      </div>,
      { width: format.width, height: format.height, fonts }
    )
  }

  // ─── STORY ────────────────────────────────────────────────────────────────
  if (cardType === 'story') {
    const title = searchParams.get('title') || 'A Story of Change'
    const excerpt = searchParams.get('excerpt') || ''
    const author = searchParams.get('author') || ''
    const imageUrl = searchParams.get('image') || ''
    const theme = searchParams.get('theme') || ''

    const children = [
      imageUrl ? <img key="bg" src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null,
      imageUrl ? <div key="overlay" style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.9) 55%, rgba(10,10,10,0.98) 100%)' }} /> : null,
      <div key="content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: pad, flex: 1, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {theme ? <div style={{ display: 'flex', fontSize: 13, fontFamily: mf, color: BRAND.red, letterSpacing: 4, marginBottom: 16 }}>{theme.toUpperCase()}</div> : <div style={{ display: 'flex' }} />}
          <div style={{ display: 'flex', fontSize: isLand ? 36 : 48, fontFamily: df, fontWeight: 700, color: BRAND.offWhite, lineHeight: 1.15, letterSpacing: -1, maxWidth: '85%' }}>{title}</div>
          {excerpt ? <div style={{ display: 'flex', fontSize: isLand ? 16 : 20, fontFamily: mf, color: BRAND.gray[400], lineHeight: 1.5, marginTop: 16, maxWidth: '75%' }}>{excerpt}</div> : <div style={{ display: 'flex' }} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
            {author ? <div style={{ display: 'flex', fontSize: 16, fontFamily: mf, color: BRAND.offWhite }}>By {author}</div> : <div style={{ display: 'flex' }} />}
            <div style={{ display: 'flex', fontSize: 16, fontFamily: mf, color: BRAND.gray[500] }}>justicehub.com.au</div>
          </div>
        </div>
      </div>,
    ].filter(Boolean)

    return new ImageResponse(
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: BRAND.black, position: 'relative' }}>
        {children}
      </div>,
      { width: format.width, height: format.height, fonts }
    )
  }

  // ─── PHOTO ────────────────────────────────────────────────────────────────
  if (cardType === 'photo') {
    const imageUrl = searchParams.get('image') || ''
    const caption = searchParams.get('caption') || ''
    const credit = searchParams.get('credit') || ''
    const location = searchParams.get('location') || ''

    if (!imageUrl) return new Response('Photo card requires &image= parameter', { status: 400 })

    return new ImageResponse(
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: BRAND.black }}>
        <img src={imageUrl} style={{ width: '100%', height: `${format.height - 200}px`, objectFit: 'cover' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 13, fontFamily: df, fontWeight: 700, color: BRAND.red, letterSpacing: 4 }}>THE CONTAINED</div>
            {caption ? <div style={{ display: 'flex', fontSize: 18, fontFamily: df, fontWeight: 700, color: BRAND.offWhite, marginTop: 8, lineHeight: 1.3 }}>{caption}</div> : <div style={{ display: 'flex' }} />}
            {location ? <div style={{ display: 'flex', fontSize: 12, fontFamily: mf, color: BRAND.gray[400], letterSpacing: 2, marginTop: 4 }}>{location.toUpperCase()}</div> : <div style={{ display: 'flex' }} />}
            {credit ? <div style={{ display: 'flex', fontSize: 11, fontFamily: mf, color: BRAND.gray[600], marginTop: 4 }}>Photo: {credit}</div> : <div style={{ display: 'flex' }} />}
          </div>
          <div style={{ display: 'flex', fontSize: 14, fontFamily: mf, color: BRAND.gray[500] }}>justicehub.com.au</div>
        </div>
      </div>,
      { width: format.width, height: format.height, fonts }
    )
  }

  return new Response('Invalid type. Options: stat, quote, story, photo', { status: 400 })
}

'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const next = params.get('next') || '/pitch/minderoo/'
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/pitch/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        setError(body.error || 'Incorrect password')
        setLoading(false)
        return
      }
      window.location.href = next
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf5ec', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <form onSubmit={submit} style={{ background: 'white', borderRadius: 12, padding: 40, width: 'min(92vw, 420px)', boxShadow: '0 4px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#605468', fontWeight: 600, marginBottom: 10 }}>The Three Circles</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 500, margin: '0 0 8px', color: '#2b2530' }}>For the funder envelope</h1>
        <p style={{ fontSize: 14, color: '#605468', lineHeight: 1.5, margin: '0 0 24px' }}>This pitch is shared under community consent. Please enter the passphrase you were given.</p>
        <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, color: '#605468', marginBottom: 6 }}>Passphrase</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #e6dfcf', borderRadius: 8, fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
        />
        {error && <div style={{ marginTop: 10, color: '#b7410e', fontSize: 13 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading || !password}
          style={{ marginTop: 16, width: '100%', padding: '12px 18px', background: loading || !password ? '#b8a8c4' : '#4a2560', color: 'white', border: 0, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading || !password ? 'default' : 'pointer', letterSpacing: 0.5 }}
        >{loading ? 'Unlocking...' : 'Open the envelope'}</button>
        <div style={{ marginTop: 18, fontSize: 11, color: '#8a7d92', lineHeight: 1.5 }}>Problem? Email <a href="mailto:benjamin@act.place" style={{ color: '#4a2560' }}>benjamin@act.place</a>.</div>
      </form>
    </div>
  )
}

export default function PitchLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

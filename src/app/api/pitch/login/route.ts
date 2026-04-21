import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  const expected = process.env.PITCH_PASSWORD
  const token = process.env.PITCH_SHARED_TOKEN

  if (!expected || !token) {
    return NextResponse.json({ error: 'Pitch auth not configured' }, { status: 500 })
  }
  if (password !== expected) {
    return NextResponse.json({ error: 'Incorrect passphrase' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('pitch_auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}

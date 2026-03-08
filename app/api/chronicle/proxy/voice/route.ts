// Chronicle voice proxy — verifies NextAuth session, forwards audio to Postmaster
// see steampunk-strategy/docs/handoffs/_working/20260307-caretaker-chronicle-working-spec.md

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const POSTMASTER_URL = process.env.POSTMASTER_INTERNAL_URL || process.env.POSTMASTER_API_URL || 'https://postmaster.steampunkfarms.org'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!INTERNAL_SECRET) return NextResponse.json({ error: 'Missing INTERNAL_SECRET' }, { status: 500 })

  try {
    const formData = await request.formData()
    const res = await fetch(`${POSTMASTER_URL}/api/chronicle/voice`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${INTERNAL_SECRET}` },
      body: formData,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Chronicle voice proxy error:', error)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 })
  }
}

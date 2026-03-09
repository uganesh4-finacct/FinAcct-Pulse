import { NextRequest, NextResponse } from 'next/server'

/**
 * Vercel Cron: runs on the 1st of each month at 6 AM UTC to auto-generate
 * monthly client invoices. Calls the finance generate endpoint with CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const url = `${baseUrl}/api/finance/invoices/generate`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cronSecret || ''}`,
    },
    body: JSON.stringify({ month: new Date().toISOString().slice(0, 7) }),
  })

  const result = await response.json().catch(() => ({ error: 'Invalid JSON' }))

  if (!response.ok) {
    return NextResponse.json(
      { success: false, ...result, timestamp: new Date().toISOString() },
      { status: response.status }
    )
  }

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  })
}

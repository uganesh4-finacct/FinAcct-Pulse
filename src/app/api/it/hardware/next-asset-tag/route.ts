import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessIT } from '@/lib/auth/permissions'

export async function GET(req: Request) {
  const user = await getUserRole()
  if (!user || !canAccessIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const entity = searchParams.get('entity') || 'US'
  const prefix = entity === 'India' ? 'FA-IN-' : 'FA-US-'
  const supabase = createServiceSupabase()
  const { data: byTag } = await supabase.from('it_hardware').select('asset_tag').like('asset_tag', prefix + '%')
  const { data: byAsset } = await supabase.from('it_hardware').select('asset').like('asset', prefix + '%')
  const tags = [...(byTag ?? []).map((r: { asset_tag: string }) => r.asset_tag).filter(Boolean), ...(byAsset ?? []).map((r: { asset: string }) => r.asset).filter(Boolean)]
  const numbers = tags.map((t: string) => parseInt(t.replace(prefix, ''), 10)).filter((n: number) => !isNaN(n))
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  const suggested = `${prefix}${String(next).padStart(3, '0')}`
  return NextResponse.json({ suggested })
}

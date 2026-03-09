import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth-server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { canAccessIT } from '@/lib/auth/permissions'

export async function GET() {
  const user = await getUserRole()
  if (!user || !canAccessIT(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createServiceSupabase()
  const { data: stats, error: statsErr } = await supabase.from('v_it_dashboard').select('*').single()
  if (statsErr) return NextResponse.json({ error: statsErr.message }, { status: 500 })

  const { data: hwWarranty } = await supabase.from('it_hardware').select('id, name, asset_tag, warranty_expiry').not('warranty_expiry', 'is', null).lte('warranty_expiry', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gt('warranty_expiry', new Date().toISOString().split('T')[0])
  const { data: domainsExp } = await supabase.from('it_domains').select('id, domain, expiry_date').not('expiry_date', 'is', null).lte('expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gt('expiry_date', new Date().toISOString().split('T')[0]).neq('status', 'cancelled')
  const { data: sslExp } = await supabase.from('it_domains').select('id, domain, ssl_expiry_date').not('ssl_expiry_date', 'is', null).lte('ssl_expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gt('ssl_expiry_date', new Date().toISOString().split('T')[0])

  return NextResponse.json({
    stats: stats ?? {},
    alerts: {
      warranty_expiring: hwWarranty ?? [],
      domains_expiring: domainsExp ?? [],
      ssl_expiring: sslExp ?? [],
    },
  })
}

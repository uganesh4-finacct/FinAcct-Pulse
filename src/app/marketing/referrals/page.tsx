import { createServiceSupabase } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function ReferralsPage() {
  const supabase = createServiceSupabase()
  const { data: referrals } = await supabase
    .from('referral_sources')
    .select('*')
    .order('total_value_won', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Referral Sources</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track who is sending business your way</p>
        </div>
        <Link href="/marketing" className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded hover:bg-slate-50 transition">
          ← Pipeline
        </Link>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Name', 'Type', 'Total Referrals', 'Won', 'Total Value Won', 'Contact'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!referrals || referrals.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No referral sources tracked yet.</td></tr>
            )}
            {referrals?.map((r: any) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.type || '—'}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{r.total_referrals}</td>
                <td className="px-4 py-3 font-mono font-semibold text-emerald-600">{r.total_won}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">${r.total_value_won?.toLocaleString() || '0'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{r.email || r.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

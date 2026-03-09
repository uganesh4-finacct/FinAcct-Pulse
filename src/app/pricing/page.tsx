'use client'
import { useState } from 'react'

const ROLES = [
  'Bookkeeper', 'Staff Accountant', 'Senior Accountant',
  'Accounting Manager', 'Controller', 'Payroll Specialist', 'Tax Accountant'
]

const VERTICALS = ['Restaurant', 'Insurance', 'Property Management', 'SaaS/ITES']

const INDIA_COST_ESTIMATES: Record<string, number> = {
  'Bookkeeper': 800,
  'Staff Accountant': 1200,
  'Senior Accountant': 1800,
  'Accounting Manager': 2500,
  'Controller': 3500,
  'Payroll Specialist': 900,
  'Tax Accountant': 1500,
}

export default function PricingCalculator() {
  const [role, setRole]               = useState('')
  const [vertical, setVertical]       = useState('')
  const [complexity, setComplexity]   = useState<'low' | 'medium' | 'high'>('medium')
  const [targetMargin, setTargetMargin] = useState(30)
  const [customCost, setCustomCost]   = useState('')
  const [result, setResult]           = useState<any>(null)

  const calculate = () => {
    const indiaCost = customCost ? parseFloat(customCost) : (INDIA_COST_ESTIMATES[role] ?? 1200)
    const complexityMultiplier = complexity === 'low' ? 0.85 : complexity === 'high' ? 1.25 : 1.0
    const adjustedCost = indiaCost * complexityMultiplier
    const tpAmount = adjustedCost
    const usOverhead = adjustedCost * 0.15
    const totalCost = tpAmount + usOverhead
    const recommendedFee = totalCost / (1 - targetMargin / 100)
    const margin = recommendedFee - totalCost

    setResult({
      indiaCost: adjustedCost,
      tpAmount,
      usOverhead,
      totalCost,
      recommendedFee: Math.ceil(recommendedFee / 50) * 50,
      margin,
      marginPct: targetMargin,
      floorPrice: totalCost * 1.1,
    })
  }

  const InputRow = ({ label, children }: any) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em' }}>Pricing Calculator</h1>
        <p style={{ fontSize: '12.5px', color: '#71717a', marginTop: '3px' }}>
          Calculate recommended client pricing based on India cost + margin target
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Input Panel */}
        <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#09090b', marginBottom: '20px' }}>Deal Parameters</div>

          <InputRow label="Role / Position">
            <select value={role} onChange={e => setRole(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px', background: 'white', color: '#09090b' }}>
              <option value="">Select role...</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </InputRow>

          <InputRow label="Client Vertical">
            <select value={vertical} onChange={e => setVertical(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px', background: 'white', color: '#09090b' }}>
              <option value="">Select vertical...</option>
              {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </InputRow>

          <InputRow label="Engagement Complexity">
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['low', 'medium', 'high'] as const).map(c => (
                <button key={c} onClick={() => setComplexity(c)} style={{
                  flex: 1, padding: '8px', borderRadius: '7px', fontSize: '12px',
                  fontWeight: complexity === c ? 700 : 400, cursor: 'pointer',
                  background: complexity === c ? '#7c3aed' : 'white',
                  color: complexity === c ? 'white' : '#71717a',
                  border: `1px solid ${complexity === c ? '#7c3aed' : '#e4e4e7'}`,
                  textTransform: 'capitalize',
                }}>
                  {c}
                </button>
              ))}
            </div>
          </InputRow>

          <InputRow label={`Target Margin: ${targetMargin}%`}>
            <input type="range" min={15} max={60} value={targetMargin}
              onChange={e => setTargetMargin(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#7c3aed' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
              <span>15% (Lean)</span><span>40% (Standard)</span><span>60% (Premium)</span>
            </div>
          </InputRow>

          <InputRow label="Custom India Cost Override (optional)">
            <input type="number" placeholder="Leave blank to use estimate"
              value={customCost} onChange={e => setCustomCost(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e4e4e7', borderRadius: '7px', fontSize: '13px' }} />
          </InputRow>

          <button onClick={calculate} disabled={!role}
            style={{
              width: '100%', padding: '11px', background: role ? '#7c3aed' : '#e4e4e7',
              color: role ? 'white' : '#a1a1aa', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700, cursor: role ? 'pointer' : 'not-allowed',
              marginTop: '4px',
            }}>
            Calculate Pricing
          </button>
        </div>

        {/* Results Panel */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Recommended Price */}
            <div style={{
              background: 'white', border: '2px solid #7c3aed', borderRadius: '12px',
              padding: '24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Recommended Monthly Fee
              </div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.04em', lineHeight: 1 }}>
                ${result.recommendedFee.toLocaleString()}
              </div>
              <div style={{ fontSize: '13px', color: '#71717a', marginTop: '8px' }}>
                /month · {result.marginPct}% margin · ${result.margin.toLocaleString()} profit
              </div>
            </div>

            {/* Cost Breakdown */}
            <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f4f5', fontSize: '13px', fontWeight: 600, color: '#09090b' }}>
                Cost Breakdown
              </div>
              {[
                { label: 'India Cost (TP Transfer)',  value: result.indiaCost,      color: '#2563eb', note: 'Paid to India entity' },
                { label: 'US Overhead Allocation',    value: result.usOverhead,     color: '#d97706', note: '15% of India cost' },
                { label: 'Total Cost',                value: result.totalCost,      color: '#09090b', note: 'Floor before margin', bold: true },
                { label: 'Target Margin',             value: result.margin,         color: '#059669', note: `${result.marginPct}% of fee` },
                { label: 'Recommended Fee',           value: result.recommendedFee, color: '#7c3aed', note: 'Rounded to nearest $50', bold: true },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 20px', borderBottom: '1px solid #f4f4f5',
                  background: row.bold ? '#fafafa' : 'white',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: row.bold ? 700 : 400, color: '#09090b' }}>{row.label}</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '1px' }}>{row.note}</div>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: row.color }}>
                    ${row.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Tiers */}
            <div style={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#09090b', marginBottom: '14px' }}>Pricing Scenarios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Competitive',  margin: 20, bg: '#f0fdf4', border: '#a7f3d0', color: '#059669' },
                  { label: 'Standard',     margin: 30, bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' },
                  { label: 'Premium',      margin: 45, bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' },
                ].map(tier => {
                  const fee = Math.ceil(result.totalCost / (1 - tier.margin / 100) / 50) * 50
                  return (
                    <div key={tier.label} style={{
                      background: tier.bg, border: `1px solid ${tier.border}`,
                      borderRadius: '8px', padding: '14px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: tier.color, marginBottom: '6px' }}>{tier.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>${fee.toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{tier.margin}% margin</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white', border: '1px dashed #e4e4e7', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '300px', color: '#a1a1aa', fontSize: '13px',
            flexDirection: 'column', gap: '8px',
          }}>
            <span style={{ fontSize: '32px' }}>◆</span>
            <span>Select a role and click Calculate to see pricing</span>
          </div>
        )}
      </div>
    </div>
  )
}

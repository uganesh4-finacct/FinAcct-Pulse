'use client'

interface FieldRowProps {
  label: string
  children: React.ReactNode
  required?: boolean
}

export function FieldRow({ label, children, required }: FieldRowProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        fontSize: '11.5px', fontWeight: 600, color: '#71717a',
        display: 'block', marginBottom: '5px', letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: '#e11d48', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function FieldInput({ value, onChange, type = 'text', placeholder }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '8px 11px',
        border: '1px solid #e4e4e7', borderRadius: '7px',
        fontSize: '13px', color: '#09090b', background: 'white',
        outline: 'none', transition: 'border-color 0.15s',
        fontFamily: 'inherit',
      }}
      onFocus={e => e.target.style.borderColor = '#7c3aed'}
      onBlur={e => e.target.style.borderColor = '#e4e4e7'}
    />
  )
}

export function FieldSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '8px 11px',
        border: '1px solid #e4e4e7', borderRadius: '7px',
        fontSize: '13px', color: '#09090b', background: 'white',
        outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function FieldTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '8px 11px',
        border: '1px solid #e4e4e7', borderRadius: '7px',
        fontSize: '13px', color: '#09090b', background: 'white',
        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
        lineHeight: 1.5,
      }}
      onFocus={e => e.target.style.borderColor = '#7c3aed'}
      onBlur={e => e.target.style.borderColor = '#e4e4e7'}
    />
  )
}

export function SaveButton({ onClick, saving, label = 'Save Changes' }: {
  onClick: () => void
  saving: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        width: '100%', padding: '10px',
        background: saving ? '#a78bfa' : '#7c3aed',
        color: 'white', border: 'none', borderRadius: '8px',
        fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {saving ? 'Saving...' : label}
    </button>
  )
}

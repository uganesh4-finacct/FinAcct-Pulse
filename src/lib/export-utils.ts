/**
 * Export report data to CSV and trigger download.
 * Escapes commas and quotes in string values.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: { key: string; header: string }[]
): void {
  const headers = columns.map(c => c.header).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const value = row[c.key]
      if (value == null) return ''
      const str = typeof value === 'number' ? String(value) : String(value)
      if (typeof value === 'string' && (str.includes(',') || str.includes('"'))) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  )
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

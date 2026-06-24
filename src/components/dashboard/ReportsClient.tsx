'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'

interface SummaryRow {
  submission_date: string
  category: string
  material_type: string
  total_submissions: number
  total_exceptions: number
  unresolved: number
}

interface MoistureRow {
  date: string
  material: string
  material_code: string
  product: string
  product_code: string
  value: number
}

interface Props {
  summary: SummaryRow[]
  moisture: MoistureRow[]
  categories?: any[]
}

const REPORTS = [
  { id: 'trend',       label: 'Submission & exception trend' },
  { id: 'exceptions',  label: 'Exceptions over time' },
  { id: 'by_category', label: 'Submissions by category' },
  { id: 'by_material', label: 'Top materials tested' },
  { id: 'moisture',    label: 'Moisture content — raw deliveries' },
]

const COLORS = ['#E4001B', '#1C2B4B', '#C47E1A', '#1A7A4A', '#6D28D9']

const chartFont = { fontSize: 12, fontFamily: 'var(--font-sans)' }
const tooltipStyle = {
  background: 'var(--c-surface)',
  border: '1px solid var(--c-border)',
  borderRadius: 8,
  fontSize: 12,
}

// Monday-based week bucket for the moisture series
function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d.toISOString().split('T')[0]
}

export default function ReportsClient({ summary, moisture }: Props) {
  const [report, setReport] = useState('trend')
  const [material, setMaterial] = useState('all')
  const [product, setProduct] = useState('all')

  const isMoisture = report === 'moisture'

  // Filter options depend on the active report
  const materialOptions = useMemo(() => {
    const set = new Set<string>()
    if (isMoisture) moisture.forEach((m) => set.add(m.material))
    else summary.forEach((s) => set.add(s.material_type))
    return Array.from(set).sort()
  }, [isMoisture, summary, moisture])

  const productOptions = useMemo(() => {
    const set = new Set<string>()
    moisture
      .filter((m) => material === 'all' || m.material === material)
      .forEach((m) => { if (m.product) set.add(m.product) })
    return Array.from(set).sort()
  }, [moisture, material])

  // ── Summary-derived datasets (material filter applied) ──
  const fSummary = useMemo(
    () => summary.filter((s) => material === 'all' || s.material_type === material),
    [summary, material],
  )

  const byDate = useMemo(() => Object.values(
    fSummary.reduce<Record<string, any>>((acc, row) => {
      const k = row.submission_date
      if (!acc[k]) acc[k] = { date: k, submissions: 0, exceptions: 0, unresolved: 0 }
      acc[k].submissions += Number(row.total_submissions)
      acc[k].exceptions  += Number(row.total_exceptions)
      acc[k].unresolved  += Number(row.unresolved)
      return acc
    }, {}),
  ).sort((a: any, b: any) => a.date.localeCompare(b.date)), [fSummary])

  const byCategory = useMemo(() => Object.values(
    fSummary.reduce<Record<string, any>>((acc, row) => {
      const k = row.category
      if (!acc[k]) acc[k] = { category: k, submissions: 0, exceptions: 0 }
      acc[k].submissions += Number(row.total_submissions)
      acc[k].exceptions  += Number(row.total_exceptions)
      return acc
    }, {}),
  ), [fSummary])

  const byMaterial = useMemo(() => Object.values(
    fSummary.reduce<Record<string, any>>((acc, row) => {
      const k = row.material_type
      if (!acc[k]) acc[k] = { material: k, submissions: 0 }
      acc[k].submissions += Number(row.total_submissions)
      return acc
    }, {}),
  ).sort((a: any, b: any) => b.submissions - a.submissions), [fSummary])

  // ── Moisture dataset: weekly average per material ──
  const moistureChart = useMemo(() => {
    const rows = moisture.filter((m) =>
      (material === 'all' || m.material === material) &&
      (product === 'all' || m.product === product),
    )
    const mats = Array.from(new Set(rows.map((r) => r.material)))
    const buckets: Record<string, Record<string, { sum: number; count: number }>> = {}
    rows.forEach((r) => {
      const wk = weekStart(r.date)
      buckets[wk] ??= {}
      buckets[wk][r.material] ??= { sum: 0, count: 0 }
      buckets[wk][r.material].sum += r.value
      buckets[wk][r.material].count += 1
    })
    const data = Object.keys(buckets).sort().map((wk) => {
      const row: any = { date: wk }
      mats.forEach((mt) => {
        const b = buckets[wk][mt]
        row[mt] = b ? Math.round((b.sum / b.count) * 100) / 100 : null
      })
      return row
    })
    return { data, mats, count: rows.length }
  }, [moisture, material, product])

  function changeReport(id: string) {
    setReport(id)
    setMaterial('all')
    setProduct('all')
  }
  function changeMaterial(m: string) {
    setMaterial(m)
    setProduct('all')
  }

  const activeLabel = REPORTS.find((r) => r.id === report)?.label ?? 'Report'
  const noData =
    (report === 'moisture' && moistureChart.data.length === 0) ||
    (report !== 'moisture' && fSummary.length === 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ minWidth: 280 }}>
          <label>Report</label>
          <select value={report} onChange={(e) => changeReport(e.target.value)}>
            {REPORTS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: 200 }}>
          <label>Material</label>
          <select value={material} onChange={(e) => changeMaterial(e.target.value)}>
            <option value="all">All materials</option>
            {materialOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {isMoisture && (
          <div className="form-group" style={{ minWidth: 200 }}>
            <label>Product</label>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              <option value="all">All products</option>
              {productOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h2>{activeLabel}</h2>
          {isMoisture && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
              Weekly average · {moistureChart.count} readings
            </span>
          )}
        </div>
        <div className="card-body">
          {noData ? (
            <p style={{ color: 'var(--c-text-3)', textAlign: 'center', padding: '2rem' }}>
              No data for this selection.
            </p>
          ) : report === 'trend' ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={byDate} style={chartFont}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="submissions" stroke="#1C2B4B" strokeWidth={2} dot={false} name="Submissions" />
                <Line type="monotone" dataKey="exceptions" stroke="#E4001B" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Exceptions" />
              </LineChart>
            </ResponsiveContainer>
          ) : report === 'exceptions' ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={byDate} style={chartFont}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="exceptions" stroke="#E4001B" strokeWidth={2} dot={false} name="Exceptions raised" />
                <Line type="monotone" dataKey="unresolved" stroke="#C47E1A" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Unresolved" />
              </LineChart>
            </ResponsiveContainer>
          ) : report === 'by_category' ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byCategory} style={chartFont}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--c-text-3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="submissions" fill="#1C2B4B" radius={[4, 4, 0, 0]} name="Submissions" />
                <Bar dataKey="exceptions" fill="#E4001B" radius={[4, 4, 0, 0]} name="Exceptions" />
              </BarChart>
            </ResponsiveContainer>
          ) : report === 'by_material' ? (
            <ResponsiveContainer width="100%" height={Math.max(320, byMaterial.length * 34)}>
              <BarChart data={byMaterial} layout="vertical" style={chartFont} margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="material" width={140} tick={{ fontSize: 11, fill: 'var(--c-text-2)' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="submissions" fill="#E4001B" radius={[0, 4, 4, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={moistureChart.data} style={chartFont}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => (v == null ? '—' : `${v}%`)} />
                <Legend />
                {moistureChart.mats.map((mt, i) => (
                  <Line
                    key={mt}
                    type="monotone"
                    dataKey={mt}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                    name={mt}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import type { SampleCategory } from '@/types'

interface SummaryRow {
  submission_date: string
  category: string
  material_type: string
  total_submissions: number
  total_exceptions: number
  unresolved: number
}

interface Props {
  summary: SummaryRow[]
  categories: SampleCategory[]
}

export default function ReportsClient({ summary, categories }: Props) {
  // Aggregate by date for the trend chart
  const byDate = Object.values(
    summary.reduce<Record<string, { date: string; submissions: number; exceptions: number }>>(
      (acc, row) => {
        const key = row.submission_date
        if (!acc[key]) acc[key] = { date: key, submissions: 0, exceptions: 0 }
        acc[key].submissions += Number(row.total_submissions)
        acc[key].exceptions  += Number(row.total_exceptions)
        return acc
      }, {}
    )
  ).sort((a, b) => a.date.localeCompare(b.date))

  // Aggregate by category
  const byCategory = Object.values(
    summary.reduce<Record<string, { category: string; submissions: number; exceptions: number }>>(
      (acc, row) => {
        const key = row.category
        if (!acc[key]) acc[key] = { category: key, submissions: 0, exceptions: 0 }
        acc[key].submissions += Number(row.total_submissions)
        acc[key].exceptions  += Number(row.total_exceptions)
        return acc
      }, {}
    )
  )

  // Aggregate by material type
  const byMaterial = Object.values(
    summary.reduce<Record<string, { material: string; submissions: number }>>(
      (acc, row) => {
        const key = row.material_type
        if (!acc[key]) acc[key] = { material: key, submissions: 0 }
        acc[key].submissions += Number(row.total_submissions)
        return acc
      }, {}
    )
  ).sort((a, b) => b.submissions - a.submissions)

  const chartStyle = {
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
  }

  if (summary.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--c-text-3)' }}>No submission data yet. Reports will appear once submissions are recorded.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Submission trend */}
      <div className="card">
        <div className="card-header">
          <h2>Submission trend</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>Daily · last 30 days</span>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byDate} style={chartStyle}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--c-text-3)' }}
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#C47E1A"
                strokeWidth={2}
                dot={false}
                name="Submissions"
              />
              <Line
                type="monotone"
                dataKey="exceptions"
                stroke="#B91C1C"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
                name="Exceptions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* By category */}
        <div className="card">
          <div className="card-header">
            <h2>Submissions by category</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory} style={chartStyle}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--c-text-3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="submissions" fill="#C47E1A" radius={[4, 4, 0, 0]} name="Submissions" />
                <Bar dataKey="exceptions" fill="#B91C1C" radius={[4, 4, 0, 0]} name="Exceptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By material type */}
        <div className="card">
          <div className="card-header">
            <h2>Top materials tested</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {byMaterial.slice(0, 8).map((row, i) => {
                const max = byMaterial[0]?.submissions ?? 1
                const pct = Math.round((row.submissions / max) * 100)
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--c-text)' }}>{row.material}</span>
                      <span style={{ color: 'var(--c-text-3)', fontFamily: 'var(--font-mono)' }}>{row.submissions}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--c-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--c-accent)',
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

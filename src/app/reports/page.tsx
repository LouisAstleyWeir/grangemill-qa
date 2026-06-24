// @ts-nocheck
import { getDashboardSummary, getMoistureSeries, getCategories } from '@/lib/queries'
import ReportsClient from '@/components/dashboard/ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }) {
  const params = await searchParams
  const from = params?.from ?? '2026-01-01'
  const to   = params?.to   ?? new Date().toISOString().split('T')[0]

  const [summary, moisture, categories] = await Promise.all([
    getDashboardSummary(from, to),
    getMoistureSeries(from, to),
    getCategories(),
  ])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Reports</h1>
          <p>On-demand analysis · {from} to {to}</p>
        </div>
      </div>

      <form method="GET" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label>From</label>
          <input type="date" name="from" defaultValue={from} />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label>To</label>
          <input type="date" name="to" defaultValue={to} />
        </div>
        <div className="form-group" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <button type="submit" className="btn btn-secondary">Apply date range</button>
        </div>
      </form>

      <ReportsClient
        summary={summary ?? []}
        moisture={moisture ?? []}
        categories={categories}
      />
    </>
  )
}

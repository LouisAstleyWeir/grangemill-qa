// @ts-nocheck
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import DashboardShell from '@/components/ui/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('id, date_of_sample, sample_categories ( label ), material_types ( label )')
    .order('submitted_at', { ascending: false })
    .limit(30)

  const { data: exceptions } = await supabaseAdmin
    .from('exceptions')
    .select('id, severity, trigger_type, field_key, resolved, submissions ( unique_id ), questions ( label )')
    .eq('resolved', false)
    .limit(100)

  // Accurate, cap-free counts straight from Postgres
  const { data: metrics } = await supabaseAdmin.rpc('dashboard_metrics').single()

  const thisMonth      = metrics?.submissions_this_month ?? 0
  const totalAllTime   = metrics?.submissions_total ?? 0
  const openExcSubs    = metrics?.submissions_with_open_exceptions ?? 0
  const unresolved     = metrics?.unresolved_exceptions ?? 0
  const resolutionRate = metrics?.resolution_rate ?? 100

  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <DashboardShell>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
          <p>Grangemill · Sample registration overview</p>
        </div>
        <Link href="/submit" className="btn btn-primary btn-lg">
          + New submission
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Submissions this month</div>
          <div className="stat-value">{thisMonth}</div>
          <div className="stat-sub">{monthLabel} · {totalAllTime} all time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Submissions with open exceptions</div>
          <div className="stat-value danger">{openExcSubs}</div>
          <div className="stat-sub">Need attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open exception items</div>
          <div className="stat-value">{unresolved}</div>
          <div className="stat-sub">Across all unresolved submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolution rate</div>
          <div className="stat-value ok">{resolutionRate}%</div>
          <div className="stat-sub">Of all exceptions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h2>Recent submissions</h2>
            <Link href="/submissions" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Material</th>
                </tr>
              </thead>
              <tbody>
                {(submissions ?? []).slice(0, 8).map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {s.date_of_sample}
                    </td>
                    <td>{s.sample_categories?.label ?? '—'}</td>
                    <td style={{ color: 'var(--c-text-2)' }}>{s.material_types?.label ?? '—'}</td>
                  </tr>
                ))}
                {(submissions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--c-text-3)', textAlign: 'center', padding: '2rem' }}>
                      No submissions yet.{' '}
                      <Link href="/submit" style={{ color: 'var(--c-accent)' }}>
                        Record the first one →
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Open exceptions</h2>
            <Link href="/exceptions" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Sample ID</th>
                  <th>Field</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {(exceptions ?? []).slice(0, 8).map((exc) => (
                  <tr key={exc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {exc.submissions?.unique_id ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {exc.questions?.label ?? exc.field_key}
                    </td>
                    <td>
                      <span className={`badge ${
                        exc.severity === 'high'   ? 'badge-danger' :
                        exc.severity === 'medium' ? 'badge-warn'   : 'badge-neutral'
                      }`}>
                        {exc.severity}
                      </span>
                    </td>
                  </tr>
                ))}
                {(exceptions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--c-ok)', textAlign: 'center', padding: '2rem' }}>
                      ✓ No open exceptions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

// @ts-nocheck
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

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

  const totalSubmissions = submissions?.length ?? 0
  const unresolved = exceptions?.length ?? 0

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
          <p>Grangemill · Sample registration</p>
        </div>
        <Link href="/submit" className="btn btn-primary btn-lg">+ New submission</Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Submissions</div>
          <div className="stat-value accent">{totalSubmissions}</div>
          <div className="stat-sub">Last 30 records</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unresolved exceptions</div>
          <div className="stat-value danger">{unresolved}</div>
          <div className="stat-sub">Needs attention</div>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{s.date_of_sample}</td>
                    <td>{s.sample_categories?.label ?? '—'}</td>
                    <td style={{ color: 'var(--c-text-2)' }}>{s.material_types?.label ?? '—'}</td>
                  </tr>
                ))}
                {(submissions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--c-text-3)', textAlign: 'center', padding: '2rem' }}>
                      No submissions yet. <Link href="/submit" style={{ color: 'var(--c-accent)' }}>Record the first one →</Link>
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
                        exc.severity === 'high' ? 'badge-danger' :
                        exc.severity === 'medium' ? 'badge-warn' : 'badge-neutral'
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
    </>
  )
}

import Link from 'next/link'
import { getDashboardSummary, getExceptions } from '@/lib/queries'

export default async function DashboardPage() {
  const [summary, openExceptions] = await Promise.all([
    getDashboardSummary(),
    getExceptions({ resolved: false }),
  ])

  const totalSubmissions = summary.reduce((n, r) => n + Number(r.total_submissions), 0)
  const totalExceptions  = summary.reduce((n, r) => n + Number(r.total_exceptions), 0)
  const unresolved       = openExceptions?.length ?? 0

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Dashboard</h1>
          <p>Last 30 days · Grangemill</p>
        </div>
        <Link href="/submit" className="btn btn-primary btn-lg">
          + New submission
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Submissions</div>
          <div className="stat-value accent">{totalSubmissions}</div>
          <div className="stat-sub">Last 30 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exceptions raised</div>
          <div className="stat-value">{totalExceptions}</div>
          <div className="stat-sub">Auto + manual</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unresolved</div>
          <div className="stat-value danger">{unresolved}</div>
          <div className="stat-sub">Needs attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolution rate</div>
          <div className="stat-value ok">
            {totalExceptions > 0
              ? Math.round(((totalExceptions - unresolved) / totalExceptions) * 100)
              : 100}%
          </div>
          <div className="stat-sub">Of all exceptions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent activity */}
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
                  <th>Exceptions</th>
                </tr>
              </thead>
              <tbody>
                {summary.slice(0, 8).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {row.submission_date}
                    </td>
                    <td>{row.category}</td>
                    <td style={{ color: 'var(--c-text-2)' }}>{row.material_type}</td>
                    <td>
                      {Number(row.total_exceptions) > 0 ? (
                        <span className="badge badge-danger">{row.total_exceptions}</span>
                      ) : (
                        <span className="badge badge-ok">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--c-text-3)', textAlign: 'center', padding: '2rem' }}>
                      No submissions yet. <Link href="/submit" style={{ color: 'var(--c-accent)' }}>Record the first one →</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open exceptions */}
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
                  <th>Type</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {(openExceptions ?? []).slice(0, 8).map((exc) => (
                  <tr key={exc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {(exc.submissions as { unique_id: string } | null)?.unique_id ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {(exc.questions as { label: string } | null)?.label ?? exc.field_key}
                    </td>
                    <td>
                      <span className={`badge ${exc.trigger_type === 'out_of_spec' ? 'badge-warn' : 'badge-neutral'}`}>
                        {exc.trigger_type === 'out_of_spec' ? 'Out of spec' : 'Manual'}
                      </span>
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
                {(openExceptions ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--c-ok)', textAlign: 'center', padding: '2rem' }}>
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

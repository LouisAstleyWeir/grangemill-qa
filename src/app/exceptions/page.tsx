// @ts-nocheck
import { getExceptions } from '@/lib/queries'
import ResolveButton from '@/components/dashboard/ResolveButton'

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string; severity?: string }>
}) {
  const params = await searchParams
  const showResolved = params.resolved === 'true'
  const exceptions = await getExceptions({
    resolved: showResolved ? undefined : false,
    severity: params.severity,
  })

  const counts = {
    high:   (exceptions ?? []).filter((e) => e.severity === 'high').length,
    medium: (exceptions ?? []).filter((e) => e.severity === 'medium').length,
    low:    (exceptions ?? []).filter((e) => e.severity === 'low').length,
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Exceptions</h1>
          <p>{exceptions?.length ?? 0} {showResolved ? 'total' : 'unresolved'} exceptions</p>
        </div>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ minWidth: 140 }}>
          <div className="stat-label">High severity</div>
          <div className="stat-value danger">{counts.high}</div>
        </div>
        <div className="stat-card" style={{ minWidth: 140 }}>
          <div className="stat-label">Medium</div>
          <div className="stat-value" style={{ color: 'var(--c-warn)' }}>{counts.medium}</div>
        </div>
        <div className="stat-card" style={{ minWidth: 140 }}>
          <div className="stat-label">Low</div>
          <div className="stat-value">{counts.low}</div>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label>Severity</label>
          <select name="severity" defaultValue={params.severity}>
            <option value="">All severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label>Show resolved</label>
          <select name="resolved" defaultValue={params.resolved}>
            <option value="">Unresolved only</option>
            <option value="true">Include resolved</option>
          </select>
        </div>
        <div className="form-group" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <button type="submit" className="btn btn-secondary">Apply</button>
        </div>
      </form>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-grid">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Date</th>
                <th>Field</th>
                <th>Value</th>
                <th>Spec</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(exceptions ?? []).map((exc) => (
                <tr key={exc.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-accent-dark)' }}>
                    {(exc.submissions as { unique_id: string } | null)?.unique_id ?? '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                    {(exc.submissions as { date_of_sample: string } | null)?.date_of_sample ?? '—'}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {(exc.questions as { label: string } | null)?.label ?? exc.field_key}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                    {exc.answer_value ?? '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                    {exc.spec_min !== null && exc.spec_max !== null
                      ? `${exc.spec_min}–${exc.spec_max}`
                      : exc.spec_min !== null ? `≥${exc.spec_min}`
                      : exc.spec_max !== null ? `≤${exc.spec_max}`
                      : '—'}
                  </td>
                  <td>
                    <span className={`badge ${exc.trigger_type === 'out_of_spec' ? 'badge-warn' : 'badge-neutral'}`}>
                      {exc.trigger_type === 'out_of_spec' ? 'Out of spec' : 'Manual flag'}
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
                  <td>
                    {exc.resolved ? (
                      <span className="badge badge-ok">Resolved</span>
                    ) : (
                      <span className="badge badge-danger">Open</span>
                    )}
                  </td>
                  <td>
                    {!exc.resolved && (
                      <ResolveButton exceptionId={exc.id} />
                    )}
                  </td>
                </tr>
              ))}
              {(exceptions ?? []).length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-ok)' }}>
                    ✓ No exceptions to show
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

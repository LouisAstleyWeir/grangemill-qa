// @ts-nocheck
import { getSubmissions, getCategories } from '@/lib/queries'
import Link from 'next/link'

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category_id?: string; status?: string }>
}) {
  const params = await searchParams
  const [submissions, categories] = await Promise.all([
    getSubmissions(params),
    getCategories(),
  ])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Submissions</h1>
          <p>{submissions?.length ?? 0} records</p>
        </div>
        <Link href="/submit" className="btn btn-primary">+ New submission</Link>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label>From</label>
          <input type="date" name="from" defaultValue={params.from} />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label>To</label>
          <input type="date" name="to" defaultValue={params.to} />
        </div>
        <div className="form-group" style={{ minWidth: 180 }}>
          <label>Category</label>
          <select name="category_id" defaultValue={params.category_id}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label>Status</label>
          <select name="status" defaultValue={params.status}>
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
        <div className="form-group" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <button type="submit" className="btn btn-secondary">Apply filters</button>
        </div>
      </form>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-grid">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Material</th>
                <th>Product / Grade</th>
                <th>Submitted by</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(submissions ?? []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-accent-dark)' }}>
                      {s.unique_id}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                    {s.date_of_sample}
                  </td>
                  <td>{(s.sample_categories as { label: string } | null)?.label ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)' }}>
                    {(s.material_types as { label: string } | null)?.label ?? '—'}
                  </td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: '0.875rem' }}>
                    {(s.products as { label: string } | null)?.label ?? '—'}
                  </td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: '0.875rem' }}>
                    {(s.users as { full_name: string } | null)?.full_name ?? '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      s.status === 'reviewed' ? 'badge-ok' :
                      s.status === 'flagged'  ? 'badge-danger' : 'badge-neutral'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(submissions ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-3)' }}>
                    No submissions match these filters.
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

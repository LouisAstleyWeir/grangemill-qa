// @ts-nocheck
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function SubmissionsPage({ searchParams }) {
  const params = await searchParams

  let query = supabaseAdmin
    .from('submissions')
    .select(`
      id,
      unique_id,
      date_of_sample,
      submitted_at,
      status,
      sampled_by,
      tested_by,
      sample_categories ( label ),
      material_types ( label ),
      products ( label )
    `)
    .order('submitted_at', { ascending: false })
    .limit(200)

  if (params?.from)        query = query.gte('date_of_sample', params.from)
  if (params?.to)          query = query.lte('date_of_sample', params.to)
  if (params?.category_id) query = query.eq('category_id', params.category_id)
  if (params?.status)      query = query.eq('status', params.status)

  const { data: submissions, error } = await query

  if (error) {
    console.error('Submissions query error:', error)
  }

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
          <input type="date" name="from" defaultValue={params?.from} />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label>To</label>
          <input type="date" name="to" defaultValue={params?.to} />
        </div>
        <div className="form-group" style={{ minWidth: 140 }}>
          <label>Status</label>
          <select name="status" defaultValue={params?.status}>
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
                <th>Sampled by</th>
                <th>Tested by</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(submissions ?? []).map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-accent-dark)' }}>
                    {s.unique_id}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                    {s.date_of_sample}
                  </td>
                  <td>{s.sample_categories?.label ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)' }}>{s.material_types?.label ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: '0.875rem' }}>{s.products?.label ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: '0.875rem' }}>{s.sampled_by ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: '0.875rem' }}>{s.tested_by ?? '—'}</td>
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-text-3)' }}>
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

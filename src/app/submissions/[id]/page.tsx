// @ts-nocheck
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSubmissionDetail, getSubmissionEdits } from '@/lib/queries'

export const dynamic = 'force-dynamic'

function fmtAnswer(row: { answer_value: string | null; answer_numeric: number | null; question_type: string | null }) {
  if (row.answer_numeric !== null && row.answer_numeric !== undefined) {
    return String(row.answer_numeric)
  }
  const v = row.answer_value
  if (v === null || v === undefined || v === '') return '—'
  if (v === 'true') return 'Yes'
  if (v === 'false') return 'No'
  return v
}

function statusBadgeClass(status: string) {
  if (status === 'reviewed') return 'badge-ok'
  if (status === 'flagged') return 'badge-danger'
  if (status === 'draft') return 'badge-warn'
  return 'badge-neutral'
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getSubmissionDetail(id)
  if (!detail) notFound()

  const edits = await getSubmissionEdits(id)

  const { submission: s, groups, exceptions, certificates } = detail
  const isDraft = s.status === 'draft'
  const openExceptions = exceptions.filter((e) => !e.resolved).length

  const headerRows: Array<[string, any]> = [
    ['Sample ID', s.unique_id ?? '—'],
    ['Batch number', s.batch_number ?? '—'],
    ['Date of sample', s.date_of_sample ?? '—'],
    ['Time taken', s.time_taken ?? '—'],
    ['Category', s.category ?? '—'],
    ['Material type', s.material ?? '—'],
    ['Product / grade', s.product ?? '—'],
    ['Sampled by', s.sampled_by ?? '—'],
    ['Tested by', s.tested_by ?? '—'],
    ['Customer', s.customer ?? '—'],
    ['Site', s.site ?? '—'],
    ['Analysis type', s.analysis_type ?? '—'],
    ['Submitted by', s.submitted_by_name ?? '—'],
    ['Submitted at', s.submitted_at ? new Date(s.submitted_at).toLocaleString('en-GB') : '—'],
    ['Reviewed by', s.reviewed_by ?? '—'],
  ]

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 4 }}>
            <Link href="/submissions" style={{ color: 'var(--c-text-3)', fontSize: '0.8125rem', textDecoration: 'none' }}>
              ← Submissions
            </Link>
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)' }}>{s.unique_id ?? 'Submission'}</h1>
          <p>
            <span className={`badge ${statusBadgeClass(s.status)}`} style={{ marginRight: 8 }}>{s.status}</span>
            {s.category ?? '—'} · {s.material ?? '—'}{s.product ? ` · ${s.product}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isDraft ? (
            <Link href={`/submit?draft=${s.id}`} className="btn btn-primary">
              Continue editing
            </Link>
          ) : (
            <Link href={`/submit?edit=${s.id}`} className="btn btn-secondary">
              Edit
            </Link>
          )}
          {certificates.length > 0 && (
            <Link href={`/certificates/${s.id}`} className="btn btn-secondary">
              View certificate
            </Link>
          )}
        </div>
      </div>

      {isDraft && (
        <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
          This submission is a draft and has not been finalised. Open “Continue editing” to complete it.
        </div>
      )}

      {/* Header / metadata */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2>Sample information</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem 2rem' }}>
            {headerRows.map(([label, value]) => (
              <div key={label}>
                <div className="stat-label" style={{ marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '0.9375rem', color: 'var(--c-text)' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
          {s.notes && (
            <>
              <div className="divider" />
              <div className="stat-label" style={{ marginBottom: 4 }}>Notes</div>
              <p style={{ color: 'var(--c-text)' }}>{s.notes}</p>
            </>
          )}
        </div>
      </div>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2>Exceptions</h2>
            <span className={`badge ${openExceptions > 0 ? 'badge-danger' : 'badge-ok'}`}>
              {openExceptions > 0 ? `${openExceptions} open` : 'All resolved'}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                  <th>Spec</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '0.875rem' }}>{e.questions?.label ?? e.field_key}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{e.answer_value ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
                      {e.spec_min !== null && e.spec_max !== null
                        ? `${e.spec_min}–${e.spec_max}`
                        : e.spec_min !== null ? `≥${e.spec_min}`
                        : e.spec_max !== null ? `≤${e.spec_max}`
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${e.trigger_type === 'out_of_spec' ? 'badge-warn' : 'badge-neutral'}`}>
                        {e.trigger_type === 'out_of_spec' ? 'Out of spec' : 'Manual'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        e.severity === 'high' ? 'badge-danger' :
                        e.severity === 'medium' ? 'badge-warn' : 'badge-neutral'
                      }`}>
                        {e.severity}
                      </span>
                    </td>
                    <td>
                      {e.resolved
                        ? <span className="badge badge-ok">Resolved</span>
                        : <span className="badge badge-danger">Open</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test results, grouped by section */}
      {groups.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--c-text-3)' }}>No test results were captured for this submission.</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.section_id} className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h2>{g.section_label}</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-grid">
                <thead>
                  <tr>
                    <th style={{ width: '60%' }}>Field</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((row) => (
                    <tr key={row.field_key}>
                      <td style={{ fontSize: '0.875rem' }}>{row.label}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--c-text)' }}>
                        {fmtAnswer(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Edit history */}
      {edits.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2>Edit history</h2>
            <span className="badge badge-neutral">{edits.length} {edits.length === 1 ? 'edit' : 'edits'}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Edited by</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {edits.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {e.edited_at ? new Date(e.edited_at).toLocaleString('en-GB') : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{e.edited_by ?? '—'}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{e.comment ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// @ts-nocheck
import Link from 'next/link'
import { getCertificates, getCertifiableSubmissions } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function CertificatesPage() {
  const [certs, batches] = await Promise.all([
    getCertificates(),
    getCertifiableSubmissions(),
  ])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Certificates</h1>
          <p>Client certificates of analysis</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header"><h2>Issued certificates</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-grid">
            <thead>
              <tr><th>Certificate No.</th><th>Product</th><th>Batch</th><th>Result</th><th>Issued</th><th>By</th><th></th></tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-accent)' }}>{c.certificate_number}</td>
                  <td>{c.product_label ?? '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{c.batch_number ?? '—'}</td>
                  <td>{c.overall_pass ? <span className="badge badge-ok">Pass</span> : <span className="badge badge-danger">Fail</span>}{c.superseded ? ' ' : ''}{c.superseded && <span className="badge badge-neutral">Superseded</span>}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{new Date(c.issued_at).toISOString().split('T')[0]}</td>
                  <td>{c.issued_by ?? '—'}</td>
                  <td><Link href={`/certificates/${c.submission_id}`} className="btn btn-secondary btn-sm">Open</Link></td>
                </tr>
              ))}
              {certs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-3)' }}>No certificates issued yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Finished-product batches</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-grid">
            <thead>
              <tr><th>Batch / Sample</th><th>Date</th><th>Product</th><th>Status</th><th>Certificate</th><th></th></tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const certNo = b.certificates?.[0]?.certificate_number
                return (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{b.batch_number ?? b.unique_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{b.date_of_sample}</td>
                    <td>{b.products?.label ?? b.material_types?.label ?? '—'}</td>
                    <td>
                      <span className={`badge ${b.status === 'reviewed' ? 'badge-ok' : b.status === 'flagged' ? 'badge-danger' : 'badge-neutral'}`}>{b.status}</span>
                    </td>
                    <td>{certNo ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--c-accent)' }}>{certNo}</span> : '—'}</td>
                    <td><Link href={`/certificates/${b.id}`} className="btn btn-primary btn-sm">{certNo ? 'View / re-issue' : 'Prepare'}</Link></td>
                  </tr>
                )
              })}
              {batches.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-3)' }}>No finished-product submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

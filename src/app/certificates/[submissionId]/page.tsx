// @ts-nocheck
import Link from 'next/link'
import { getCertificateModel, getCertificatesForSubmission } from '@/lib/queries'
import CertificateView from '@/components/dashboard/CertificateView'
import CertificateActions from '@/components/dashboard/CertificateActions'

export const dynamic = 'force-dynamic'

export default async function CertificatePage({ params }) {
  const { submissionId } = await params
  const [model, certs] = await Promise.all([
    getCertificateModel(submissionId),
    getCertificatesForSubmission(submissionId),
  ])

  if (!model) {
    return (
      <>
        <div className="page-header"><div className="page-header-text"><h1>Certificate</h1></div></div>
        <div className="card"><div className="card-body"><p>Submission not found.</p></div></div>
      </>
    )
  }

  const current = certs.find((c) => !c.superseded)

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Certificate · {model.submission.product ?? model.submission.material}</h1>
          <p>Batch {model.submission.batch_number ?? model.submission.unique_id}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={`/certificates/${submissionId}/document`} className="btn btn-navy">View / download document</Link>
          <Link href="/certificates" className="btn btn-secondary">All certificates</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <CertificateActions
          submissionId={submissionId}
          header={model.submission}
          materialCode={model.submission.material_code}
        />

        {certs.length > 0 && (
          <div className="card">
            <div className="card-header"><h2>Issued versions</h2></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-grid">
                <thead><tr><th>Certificate No.</th><th>Version</th><th>Result</th><th>Issued</th><th>By</th><th></th></tr></thead>
                <tbody>
                  {certs.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-accent)' }}>{c.certificate_number}</td>
                      <td>v{c.version}</td>
                      <td>{c.overall_pass ? <span className="badge badge-ok">Pass</span> : <span className="badge badge-danger">Fail</span>}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{new Date(c.issued_at).toISOString().split('T')[0]}</td>
                      <td>{c.issued_by ?? '—'}</td>
                      <td>{c.superseded ? <span className="badge badge-neutral">Superseded</span> : <span className="badge badge-accent">Current</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <CertificateView model={model} certificateNumber={current?.certificate_number} />
      </div>
    </>
  )
}

// @ts-nocheck
import Link from 'next/link'
import { getCurrentCertificate, getCertificateModel } from '@/lib/queries'
import CertificateDocument from '@/components/dashboard/CertificateDocument'
import PrintButton from '@/components/dashboard/PrintButton'

export const dynamic = 'force-dynamic'

export default async function CertificateDocumentPage({ params }) {
  const { submissionId } = await params
  const cert = await getCurrentCertificate(submissionId)
  const model = cert?.snapshot ?? (await getCertificateModel(submissionId))

  if (!model) {
    return (
      <>
        <div className="page-header"><div className="page-header-text"><h1>Certificate</h1></div></div>
        <div className="card"><div className="card-body"><p>Submission not found.</p></div></div>
      </>
    )
  }

  const meta = {
    certificate_number: cert?.certificate_number ?? null,
    issued_at: cert?.issued_at ?? null,
    issued_by: cert?.issued_by ?? null,
    draft: !cert,
  }

  return (
    <>
      <div className="cert-toolbar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <Link href={`/certificates/${submissionId}`} className="btn btn-secondary">← Back to batch</Link>
        <PrintButton />
        {meta.draft && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>
            This is a draft preview — issue the certificate first for a numbered document.
          </span>
        )}
      </div>

      <CertificateDocument model={model} meta={meta} />
    </>
  )
}

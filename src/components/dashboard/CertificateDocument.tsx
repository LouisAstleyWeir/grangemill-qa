// @ts-nocheck

const C = {
  navy: '#1C2B4B', red: '#E4001B', ok: '#1A7A4A', danger: '#B00015',
  border: '#C9CDD8', text: '#1A1D2E', t2: '#4A4F6A', t3: '#8A90A8',
  navyLight: '#EEF1F7', surface2: '#F2F3F6',
}

function specText(min, max) {
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `≥ ${min}`
  if (max != null) return `≤ ${max}`
  return '—'
}

function statusCell(pass) {
  if (pass === true) return <span style={{ color: C.ok, fontWeight: 700 }}>PASS</span>
  if (pass === false) return <span style={{ color: C.danger, fontWeight: 700 }}>FAIL</span>
  return <span style={{ color: C.t3 }}>Not tested</span>
}

export default function CertificateDocument({ model, meta }: { model: any; meta: any }) {
  const s = model.submission

  const fields: [string, any][] = [
    ['Material Description', s.product ?? s.material],
    ['Customer', s.customer],
    ['Site', s.site],
    ['Batch / Ticket No.', s.batch_number ?? s.unique_id],
    ['Date Sampled', s.date_of_sample],
    ['Time Sampled', s.time_taken],
    ['Sampled By', s.sampled_by],
    ['Tested By', s.tested_by],
    ['Reviewed By', s.reviewed_by],
    ['Analysis Type', s.analysis_type],
    ['Category', s.category_hc],
    ['Type', s.type_pv],
    ['Delivery Temp', s.delivery_temp],
  ].filter(([, v]) => v != null && v !== '')

  const verdict = model.tested_count === 0
    ? { color: C.t3, bg: C.surface2, text: 'NOT TESTED' }
    : model.overall_pass
      ? { color: C.ok, bg: '#E8F5EE', text: model.incomplete ? 'PASS (incomplete)' : 'PASS' }
      : { color: C.danger, bg: '#FDEAEC', text: 'FAIL' }

  const issuedDate = meta.issued_at ? new Date(meta.issued_at).toISOString().split('T')[0] : null

  return (
    <>
      <style>{`
        @page { size: A4; margin: 14mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          .sidebar, .cert-toolbar { display: none !important; }
          .main-content { padding: 0 !important; max-width: none !important; }
          body { background: #fff !important; }
          .cert-doc { box-shadow: none !important; margin: 0 !important; width: 100% !important; border: none !important; }
          .cert-group { page-break-inside: avoid; }
        }
        .cert-doc table { width: 100%; border-collapse: collapse; }
        .cert-doc th { background: ${C.navyLight}; color: ${C.navy}; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 7px 10px; border: 1px solid ${C.border}; }
        .cert-doc td { padding: 7px 10px; border: 1px solid ${C.border}; font-size: 12px; color: ${C.text}; }
      `}</style>

      <div className="cert-doc" style={{
        background: '#fff', maxWidth: 820, margin: '0 auto', border: `1px solid ${C.border}`,
        boxShadow: '0 2px 12px rgba(28,43,75,0.12)', fontFamily: "'Inter', sans-serif", color: C.text,
      }}>
        {/* IKO red top bar */}
        <div style={{ height: 6, background: C.red }} />

        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: `2px solid ${C.navy}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: C.navy }}>
              IK<span style={{ color: C.red }}>O</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3, marginTop: 2 }}>
              Central Laboratory · Grangemill
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>Certificate of Analysis</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: meta.draft ? C.t3 : C.red, marginTop: 3 }}>
              {meta.draft ? 'DRAFT — not yet issued' : meta.certificate_number}
            </div>
            {issuedDate && <div style={{ fontSize: 11, color: C.t3 }}>Issued {issuedDate}{meta.issued_by ? ` · ${meta.issued_by}` : ''}</div>}
          </div>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Verdict */}
          <div style={{
            display: 'inline-block', padding: '6px 16px', borderRadius: 4, marginBottom: 18,
            background: verdict.bg, color: verdict.color, fontWeight: 800, fontSize: 14, letterSpacing: '0.04em',
          }}>
            RESULT: {verdict.text}
          </div>

          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 28px', marginBottom: 22 }}>
            {fields.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.surface2}`, padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: C.t2, fontWeight: 600 }}>{label}</span>
                <span style={{ color: C.text, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Results by standard */}
          {model.groups.length === 0 && (
            <p style={{ color: C.t3, fontSize: 12 }}>No specifications loaded for this product — nothing to certify against.</p>
          )}

          {model.groups.map((g) => (
            <div className="cert-group" key={g.standard} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{g.standard}</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '46%' }}>Parameter</th>
                    <th style={{ width: '18%' }}>Result</th>
                    <th style={{ width: '22%' }}>Specification</th>
                    <th style={{ width: '14%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.params.map((p) => (
                    <tr key={p.field_key} style={p.pass === false ? { background: '#FDEAEC' } : undefined}>
                      <td>{p.label}</td>
                      <td style={{ fontFamily: 'monospace' }}>{p.value != null ? p.value : '—'}</td>
                      <td style={{ fontFamily: 'monospace', color: C.t2 }}>{specText(p.spec_min, p.spec_max)}</td>
                      <td>{statusCell(p.pass)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Footer / sign-off */}
          <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.t2 }}>
            <div>
              <div>Tested by: <strong>{s.tested_by ?? '—'}</strong></div>
              <div>Reviewed by: <strong>{s.reviewed_by ?? '—'}</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>{meta.draft ? 'Draft preview' : `Certificate ${meta.certificate_number}`}</div>
              {issuedDate && <div>Date issued: {issuedDate}</div>}
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 10, color: C.t3, lineHeight: 1.5 }}>
            This certificate relates only to the batch identified above and to the parameters tested. Results are assessed against the
            specification limits for the stated product and standard at the time of issue.
          </p>
        </div>
      </div>
    </>
  )
}

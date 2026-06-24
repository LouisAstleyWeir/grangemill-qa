// @ts-nocheck
function specText(min, max) {
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `≥ ${min}`
  if (max != null) return `≤ ${max}`
  return '—'
}

function passBadge(pass) {
  if (pass === true) return <span className="badge badge-ok">In spec</span>
  if (pass === false) return <span className="badge badge-danger">Out of spec</span>
  return <span className="badge badge-neutral">Not tested</span>
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-text-3)' }}>{label}</div>
      <div style={{ fontSize: '0.9375rem', color: 'var(--c-text)' }}>{value ?? '—'}</div>
    </div>
  )
}

export default function CertificateView({ model, certificateNumber }: { model: any; certificateNumber?: string }) {
  const s = model.submission

  const verdict = model.tested_count === 0
    ? { cls: 'alert-warn', text: 'No spec-checked results captured for this batch yet.' }
    : model.overall_pass
      ? { cls: 'alert-success', text: model.incomplete ? 'PASS — all tested parameters within spec (some parameters not tested)' : 'PASS — all parameters within specification' }
      : { cls: 'alert-danger', text: `FAIL — ${model.failures} parameter${model.failures === 1 ? '' : 's'} outside specification` }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className={`alert ${verdict.cls}`} style={{ fontWeight: 700 }}>
        {certificateNumber ? `${certificateNumber} · ` : ''}{verdict.text}
      </div>

      <div className="card">
        <div className="card-header"><h2>Certificate of Analysis</h2></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            <Field label="Material Description" value={s.product ?? s.material} />
            <Field label="Batch / Ticket No." value={s.batch_number ?? s.unique_id} />
            <Field label="Customer" value={s.customer} />
            <Field label="Site" value={s.site} />
            <Field label="Date Sampled" value={s.date_of_sample} />
            <Field label="Time Sampled" value={s.time_taken} />
            <Field label="Sampled By" value={s.sampled_by} />
            <Field label="Tested By" value={s.tested_by} />
            <Field label="Reviewed By" value={s.reviewed_by} />
            <Field label="Analysis Type" value={s.analysis_type} />
            <Field label="Category" value={s.category_hc} />
            <Field label="Type" value={s.type_pv} />
            <Field label="Delivery Temp" value={s.delivery_temp} />
          </div>
        </div>
      </div>

      {model.groups.length === 0 && (
        <div className="card"><div className="card-body">
          <p style={{ color: 'var(--c-text-3)' }}>This product has no specifications loaded, so there is nothing to certify against.</p>
        </div></div>
      )}

      {model.groups.map((g) => (
        <div className="card" key={g.standard}>
          <div className="card-header"><h2>{g.standard}</h2></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-grid">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Result</th>
                  <th>Specification</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {g.params.map((p) => (
                  <tr key={p.field_key}>
                    <td>{p.label}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{p.value != null ? p.value : '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text-3)' }}>{specText(p.spec_min, p.spec_max)}</td>
                    <td>{passBadge(p.pass)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

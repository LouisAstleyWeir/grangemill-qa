// @ts-nocheck
import IKOLogo from '@/components/ui/IKOLogo'

const C = {
  navy: '#1C2B4B', red: '#E4001B', ok: '#1A7A4A', danger: '#B00015',
  border: '#C9CDD8', text: '#1A1D2E', t2: '#4A4F6A', t3: '#8A90A8',
  navyLight: '#EEF1F7', surface2: '#F2F3F6',
}

// Sieve chain: field-key suffix -> display size, in standard descending order.
const SIEVES: [string, string][] = [
  ['14', '14.0mm'], ['10', '10.0mm'], ['63', '6.3mm'], ['40', '4.0mm'],
  ['335', '3.35mm'], ['236', '2.36mm'], ['20', '2.0mm'], ['06', '0.600mm'],
  ['025', '0.250mm'], ['0212', '0.212mm'], ['0075', '0.075mm'], ['0063', '0.063mm'],
  ['pan', 'Pan'],
]

function specText(min, max) {
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `≥ ${min}`
  if (max != null) return `≤ ${max}`
  return '—'
}

function statusCell(pass) {
  if (pass === true) return <span style={{ color: C.ok, fontWeight: 700 }}>PASS</span>
  if (pass === false) return <span style={{ color: C.danger, fontWeight: 700 }}>FAIL</span>
  return <span style={{ color: C.t3 }}>—</span>
}

function round3(x) {
  return x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000
}

export default function CertificateDocument({ model, meta }: { model: any; meta: any }) {
  const s = model.submission
  const byKey = model.byKey ?? {}
  const paramByKey = model.paramByKey ?? {}
  const p = model.compositionPrefix ?? null
  const v = (key) => (byKey[key] ? byKey[key].value : null)

  // ── Header metadata (only fields that have a value) ───────────────────────
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
  ].filter(([, val]) => val != null && val !== '')

  // ── Field keys consumed by the composition working blocks ─────────────────
  const consumed = new Set<string>()
  if (p) {
    ;[`${p}_total_mass`, `${p}_aliquot_vol`, `${p}_a_flask_binder`, `${p}_a_binder`,
      `${p}_1_flask`, `${p}_1_flask_binder`, `${p}_1_binder`, `${p}_mean_binder`,
      `${p}_soluble_binder`, `${p}_mass_aggregate`].forEach((k) => consumed.add(k))
    for (const [suf] of SIEVES) {
      consumed.add(`${p}_ret_${suf}`); consumed.add(`${p}_pct_ret_${suf}`); consumed.add(`${p}_pct_pas_${suf}`)
    }
  }

  // ── Remaining assessed (spec'd) parameters, regrouped by standard ─────────
  const specParams = (model.groups ?? []).flatMap((g) =>
    g.params.map((pr) => ({ ...pr, standard: pr.standard ?? g.standard })))
  const specKeys = new Set(specParams.map((pr) => pr.field_key))
  const remaining = specParams.filter((pr) => !consumed.has(pr.field_key))
  const remGroups: Record<string, any[]> = {}
  for (const pr of remaining) (remGroups[pr.standard ?? 'Other tests'] ??= []).push(pr)

  // ── Catch-all: anything captured but not shown above ──────────────────────
  const additional = Object.entries(byKey)
    .filter(([k, d]: any) =>
      !consumed.has(k) && !specKeys.has(k) &&
      (d.value != null || (d.answer_value != null && d.answer_value !== '')))
    .map(([k, d]: any) => ({ field_key: k, label: d.label, value: d.value != null ? d.value : d.answer_value }))

  const verdict = model.tested_count === 0
    ? { color: C.t3, bg: C.surface2, text: 'NOT TESTED' }
    : model.overall_pass
      ? { color: C.ok, bg: '#E8F5EE', text: model.incomplete ? 'PASS (incomplete)' : 'PASS' }
      : { color: C.danger, bg: '#FDEAEC', text: 'FAIL' }

  const issuedDate = meta.issued_at ? new Date(meta.issued_at).toISOString().split('T')[0] : null

  // Soluble binder figures
  const faFb = v(`${p}_a_flask_binder`), faB = v(`${p}_a_binder`)
  const faFlask = (faFb != null && faB != null) ? round3(faFb - faB) : null
  const solubleSpec = paramByKey[`${p}_soluble_binder`]

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
        .cert-doc th { background: ${C.navyLight}; color: ${C.navy}; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 9px; border: 1px solid ${C.border}; }
        .cert-doc td { padding: 6px 9px; border: 1px solid ${C.border}; font-size: 11.5px; color: ${C.text}; }
        .cert-doc .num { font-family: monospace; }
        .cert-doc h3 { font-size: 13px; font-weight: 700; color: ${C.navy}; margin: 0 0 6px; }
      `}</style>

      <div className="cert-doc" style={{
        background: '#fff', maxWidth: 820, margin: '0 auto', border: `1px solid ${C.border}`,
        boxShadow: '0 2px 12px rgba(28,43,75,0.12)', fontFamily: "'Inter', sans-serif", color: C.text,
      }}>
        <div style={{ height: 6, background: C.red }} />

        {/* Header */}
        <div style={{ padding: '18px 28px 14px', borderBottom: `2px solid ${C.navy}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <IKOLogo width={72} height={26} />
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3, marginTop: 6 }}>
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

        <div style={{ padding: '18px 28px 28px' }}>
          {/* Verdict */}
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 4, marginBottom: 16, background: verdict.bg, color: verdict.color, fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>
            RESULT: {verdict.text}
          </div>

          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 28px', marginBottom: 22 }}>
            {fields.map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.surface2}`, padding: '4px 0', fontSize: 11.5 }}>
                <span style={{ color: C.t2, fontWeight: 600 }}>{label}</span>
                <span style={{ color: C.text, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* ── Composition: Soluble Binder Analysis ── */}
          {p && (
            <div className="cert-group" style={{ marginBottom: 20 }}>
              <h3>Soluble Binder Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, alignItems: 'start' }}>
                <table>
                  <thead><tr><th>Weighing</th><th>Flask A</th><th>Flask 1</th></tr></thead>
                  <tbody>
                    <tr><td>Mass of Flask</td><td className="num">{faFlask ?? '—'}</td><td className="num">{v(`${p}_1_flask`) ?? '—'}</td></tr>
                    <tr><td>Mass of Flask + Binder</td><td className="num">{v(`${p}_a_flask_binder`) ?? '—'}</td><td className="num">{v(`${p}_1_flask_binder`) ?? '—'}</td></tr>
                    <tr><td>Mass of Binder</td><td className="num">{v(`${p}_a_binder`) ?? '—'}</td><td className="num">{v(`${p}_1_binder`) ?? '—'}</td></tr>
                  </tbody>
                </table>
                <table>
                  <tbody>
                    <tr><td>Total Mass of Sample</td><td className="num">{v(`${p}_total_mass`) ?? '—'}</td></tr>
                    <tr><td>Volume Aliquot</td><td className="num">{v(`${p}_aliquot_vol`) ?? '—'}</td></tr>
                    <tr><td>Mean Binder</td><td className="num">{v(`${p}_mean_binder`) ?? '—'}</td></tr>
                    <tr>
                      <td>Soluble Binder Content</td>
                      <td className="num">
                        {v(`${p}_soluble_binder`) ?? '—'}
                        {solubleSpec && <span style={{ color: C.t3 }}> &nbsp;({specText(solubleSpec.spec_min, solubleSpec.spec_max)}) </span>}
                        {solubleSpec && ' '}{solubleSpec && statusCell(solubleSpec.pass)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Composition: Grading Analysis (full sieve table) ── */}
          {p && (
            <div className="cert-group" style={{ marginBottom: 20 }}>
              <h3>Grading Analysis{v(`${p}_mass_aggregate`) != null ? ` · Mass of Agg − Binder: ${v(`${p}_mass_aggregate`)}` : ''}</h3>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '24%' }}>Sieve</th>
                    <th style={{ width: '16%' }}>Wt Retained</th>
                    <th style={{ width: '16%' }}>% Retained</th>
                    <th style={{ width: '16%' }}>% Passing</th>
                    <th style={{ width: '16%' }}>Spec (% Pass)</th>
                    <th style={{ width: '12%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SIEVES.map(([suf, size]) => {
                    const ret = v(`${p}_ret_${suf}`)
                    const pctRet = v(`${p}_pct_ret_${suf}`)
                    const pctPas = v(`${p}_pct_pas_${suf}`)
                    if (ret == null && pctRet == null && pctPas == null) return null
                    const sp = paramByKey[`${p}_pct_pas_${suf}`]
                    return (
                      <tr key={suf} style={sp && sp.pass === false ? { background: '#FDEAEC' } : undefined}>
                        <td>{size}</td>
                        <td className="num">{ret ?? '—'}</td>
                        <td className="num">{pctRet ?? '—'}</td>
                        <td className="num">{pctPas ?? '—'}</td>
                        <td className="num" style={{ color: C.t2 }}>{sp ? specText(sp.spec_min, sp.spec_max) : '—'}</td>
                        <td>{sp ? statusCell(sp.pass) : <span style={{ color: C.t3 }}>—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Remaining assessed parameters by standard ── */}
          {Object.entries(remGroups).map(([standard, list]) => (
            <div className="cert-group" key={standard} style={{ marginBottom: 20 }}>
              <h3>{standard}</h3>
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
                  {list.map((pr) => (
                    <tr key={pr.field_key} style={pr.pass === false ? { background: '#FDEAEC' } : undefined}>
                      <td>{pr.label}</td>
                      <td className="num">{pr.value != null ? pr.value : '—'}</td>
                      <td className="num" style={{ color: C.t2 }}>{specText(pr.spec_min, pr.spec_max)}</td>
                      <td>{statusCell(pr.pass)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* ── Additional recorded data (catch-all) ── */}
          {additional.length > 0 && (
            <div className="cert-group" style={{ marginBottom: 20 }}>
              <h3>Additional recorded data</h3>
              <table>
                <thead><tr><th style={{ width: '60%' }}>Field</th><th>Recorded value</th></tr></thead>
                <tbody>
                  {additional.map((a) => (
                    <tr key={a.field_key}><td>{a.label}</td><td className="num">{a.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 26, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.t2 }}>
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

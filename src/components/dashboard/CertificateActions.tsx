'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSubmissionHeader, issueCertificate } from '@/app/actions'

// ───────────────────────────────────────────────────────────────────────────
// CONFIG — confirm these with the QA team, then edit here in one place.
// Keyed by the product's material-type code (e.g. fp_ma_paving).
// ───────────────────────────────────────────────────────────────────────────

// Short "Type" code, derived from the product family and shown read-only.
const TYPE_BY_FAMILY: Record<string, string> = {
  fp_ma_paving:   'PV',
  fp_ma_roofing:  'RF',
  fp_ma_flooring: 'FL',
  fp_ma_tanking:  'TK',
  fp_bituminous:  'BIT',
}

// Which families can be hot-charged. Controls whether the Category (H/C) and
// Delivery Temp fields appear at all. (Best-guess defaults — confirm with QA.)
const HOT_CHARGE_FAMILIES: Record<string, boolean> = {
  fp_ma_paving:   true,
  fp_ma_roofing:  true,
  fp_ma_flooring: true,
  fp_ma_tanking:  true,
  fp_bituminous:  false,
}

const ANALYSIS_TYPE_OPTIONS = ['Routine', 'Re-test', 'Complaint investigation', 'Type-test']
const CATEGORY_OPTIONS = ['Hot Charge', 'Cold']

// ───────────────────────────────────────────────────────────────────────────

type HeaderForm = Record<string, string>

export default function CertificateActions({
  submissionId,
  header,
  materialCode,
}: {
  submissionId: string
  header: any
  materialCode?: string
}) {
  const router = useRouter()

  const derivedType = (materialCode && TYPE_BY_FAMILY[materialCode]) || header.type_pv || ''
  const hotChargeApplicable = materialCode ? !!HOT_CHARGE_FAMILIES[materialCode] : true

  const [form, setForm] = useState<HeaderForm>({
    customer: header.customer ?? '',
    site: header.site ?? '',
    batch_number: header.batch_number ?? '',
    analysis_type: header.analysis_type ?? '',
    category_hc: header.category_hc ?? '',
    delivery_temp: header.delivery_temp ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  function payload() {
    return {
      customer: form.customer,
      site: form.site,
      batch_number: form.batch_number,
      analysis_type: form.analysis_type,
      type_pv: derivedType,
      // Clear hot-charge-only fields when they don't apply to this product
      category_hc: hotChargeApplicable ? form.category_hc : '',
      delivery_temp: hotChargeApplicable ? form.delivery_temp : '',
    }
  }

  async function save() {
    setSaving(true); setMsg(null)
    const res = await saveSubmissionHeader(submissionId, payload())
    setSaving(false)
    if (res.success) { setMsg('Details saved.'); router.refresh() }
    else setMsg(`Save failed: ${res.error}`)
  }

  async function issue() {
    const initials = prompt('Issue certificate — enter your initials:')
    if (!initials) return
    // Persist current details first so the snapshot is complete
    await saveSubmissionHeader(submissionId, payload())
    setIssuing(true); setMsg(null)
    const res = await issueCertificate(submissionId, initials)
    setIssuing(false)
    if (res.success) { setMsg(`Issued ${res.certificateNumber}.`); router.refresh() }
    else setMsg(`Issue failed: ${res.error}`)
  }

  return (
    <div className="card">
      <div className="card-header"><h2>Report details</h2></div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Customer</label>
            <input type="text" value={form.customer} onChange={set('customer')} />
          </div>
          <div className="form-group">
            <label>Site</label>
            <input type="text" value={form.site} onChange={set('site')} />
          </div>
          <div className="form-group">
            <label>Batch / Ticket No.</label>
            <input type="text" value={form.batch_number} onChange={set('batch_number')} />
          </div>
          <div className="form-group">
            <label>Analysis Type</label>
            <select value={form.analysis_type} onChange={set('analysis_type')}>
              <option value="">Select…</option>
              {ANALYSIS_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <input
              type="text"
              value={derivedType}
              readOnly
              placeholder="—"
              style={{ background: 'var(--c-surface-2)', color: 'var(--c-text-2)' }}
            />
          </div>
          {hotChargeApplicable && (
            <>
              <div className="form-group">
                <label>Category (H/C)</label>
                <select value={form.category_hc} onChange={set('category_hc')}>
                  <option value="">Select…</option>
                  {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Delivery Temp</label>
                <input type="text" value={form.delivery_temp} onChange={set('delivery_temp')} placeholder="e.g. 217/220" />
              </div>
            </>
          )}
        </div>

        {!hotChargeApplicable && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)', marginTop: '0.75rem' }}>
            This product isn’t hot-charged, so Category and Delivery Temperature don’t apply.
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </button>
          <button className="btn btn-primary" onClick={issue} disabled={issuing}>
            {issuing ? 'Issuing…' : 'Issue certificate'}
          </button>
          {msg && <span style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{msg}</span>}
        </div>
      </div>
    </div>
  )
}

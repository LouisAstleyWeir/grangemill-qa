'use client'
// @ts-nocheck

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSubmissionHeader, issueCertificate } from '@/app/actions'

export default function CertificateActions({ submissionId, header }: { submissionId: string; header: any }) {
  const router = useRouter()
  const [form, setForm] = useState({
    customer: header.customer ?? '',
    site: header.site ?? '',
    batch_number: header.batch_number ?? '',
    analysis_type: header.analysis_type ?? '',
    category_hc: header.category_hc ?? '',
    type_pv: header.type_pv ?? '',
    delivery_temp: header.delivery_temp ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value })

  async function save() {
    setSaving(true); setMsg(null)
    const res = await saveSubmissionHeader(submissionId, form)
    setSaving(false)
    if (res.success) { setMsg('Header saved.'); router.refresh() }
    else setMsg(`Save failed: ${res.error}`)
  }

  async function issue() {
    const initials = prompt('Issue certificate — enter your initials:')
    if (!initials) return
    setIssuing(true); setMsg(null)
    const res = await issueCertificate(submissionId, initials)
    setIssuing(false)
    if (res.success) { setMsg(`Issued ${res.certificateNumber}.`); router.refresh() }
    else setMsg(`Issue failed: ${res.error}`)
  }

  const fields: [string, string][] = [
    ['customer', 'Customer'], ['site', 'Site'], ['batch_number', 'Batch / Ticket No.'],
    ['analysis_type', 'Analysis Type'], ['category_hc', 'Category (H/C)'],
    ['type_pv', 'Type (PV)'], ['delivery_temp', 'Delivery Temp'],
  ]

  return (
    <div className="card">
      <div className="card-header"><h2>Report details</h2></div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {fields.map(([k, label]) => (
            <div className="form-group" key={k}>
              <label>{label}</label>
              <input type="text" value={form[k]} onChange={set(k)} />
            </div>
          ))}
        </div>
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

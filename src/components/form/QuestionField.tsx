'use client'

import type { Question } from '@/types'

// Maps each mean field to the three source fields it averages
const CALCULATED_MEANS: Record<string, [string, string, string]> = {
  bit_pen_mean:          ['bit_pen_1',         'bit_pen_2',         'bit_pen_3'],
  bb_pen_mean:           ['bb_pen_1',           'bb_pen_2',           'bb_pen_3'],
  bb_corr_pen_mean:      ['bb_corr_pen_1',      'bb_corr_pen_2',      'bb_corr_pen_3'],
  ma16_pen_mean:         ['ma16_pen_1',         'ma16_pen_2',         'ma16_pen_3'],
  ma16_cone_pen_mean:    ['ma16_cone_pen_1',    'ma16_cone_pen_2',    'ma16_cone_pen_3'],
  fp_bit_pen_mean:       ['fp_bit_pen_1',       'fp_bit_pen_2',       'fp_bit_pen_3'],
  fp_bit_cone_pen_mean:  ['fp_bit_cone_pen_1',  'fp_bit_cone_pen_2',  'fp_bit_cone_pen_3'],
}

function calcMean(sources: [string, string, string], allAnswers: Record<string, string | string[]>): string {
  const vals = sources.map((k) => parseFloat(String(allAnswers[k] ?? '')))
  const valid = vals.filter((v) => !isNaN(v))
  if (valid.length === 0) return ''
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length
  return parseFloat(mean.toFixed(2)).toString()
}

interface Props {
  question: Question
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
  error?: string
  allAnswers: Record<string, string | string[]>
}

export default function QuestionField({ question, value, onChange, error, allAnswers }: Props) {
  const { field_key, label, question_type, options, is_required, spec_min, spec_max, help_text } = question

  // Conditional visibility for sub-questions
  if (field_key.startsWith('bit_pen_') && field_key !== 'bit_pen_required') {
    if (allAnswers['bit_pen_required'] === 'false') return null
  }
  if (field_key === 'bit_sp') {
    if (allAnswers['bit_sp_required'] === 'false') return null
  }
  if (field_key.startsWith('bb_corr_') && field_key !== 'bb_corrected') {
    if (allAnswers['bb_corrected'] !== 'true') return null
  }

  // ── Calculated mean field ──────────────────────────────────────────────────
  if (CALCULATED_MEANS[field_key]) {
    const sources = CALCULATED_MEANS[field_key]
    const calculated = calcMean(sources, allAnswers)

    // Keep the answer state in sync with the calculated value
    if (calculated !== String(value ?? '')) {
      setTimeout(() => onChange(calculated), 0)
    }

    const hasSpecLimit = spec_min !== null || spec_max !== null
    const numVal = parseFloat(calculated)
    const outOfSpec = hasSpecLimit && !isNaN(numVal) && (
      (spec_min !== null && numVal < spec_min) ||
      (spec_max !== null && numVal > spec_max)
    )

    return (
      <div className="form-group">
        <label>
          {label}
          {hasSpecLimit && (
            <span style={{ fontWeight: 400, color: 'var(--c-text-3)', marginLeft: 6 }}>
              ({spec_min !== null ? `min ${spec_min}` : ''}{spec_min !== null && spec_max !== null ? ', ' : ''}{spec_max !== null ? `max ${spec_max}` : ''})
            </span>
          )}
        </label>
        <div style={{
          padding: '0.5rem 0.75rem',
          background: calculated ? 'var(--c-slate-light)' : 'var(--c-surface-2)',
          border: `1px solid ${outOfSpec ? 'var(--c-warn)' : 'var(--c-border)'}`,
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9375rem',
          color: calculated ? 'var(--c-slate)' : 'var(--c-text-3)',
          fontWeight: calculated ? 600 : 400,
          minHeight: '2.375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{calculated || 'Auto-calculated'}</span>
          {calculated && (
            <span style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--c-text-3)',
            }}>
              avg
            </span>
          )}
        </div>
        {outOfSpec && (
          <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>
            ⚠ Outside specification limit
          </span>
        )}
      </div>
    )
  }

  // ── Standard fields ────────────────────────────────────────────────────────
  const strValue = Array.isArray(value) ? value : (value ?? '')
  const hasSpecLimit = spec_min !== null || spec_max !== null
  const numVal = parseFloat(String(strValue))
  const outOfSpec = hasSpecLimit && !isNaN(numVal) && (
    (spec_min !== null && numVal < spec_min) ||
    (spec_max !== null && numVal > spec_max)
  )

  const labelEl = (
    <label htmlFor={field_key}>
      {label}
      {is_required && <span className="required"> *</span>}
      {hasSpecLimit && (
        <span style={{ fontWeight: 400, color: 'var(--c-text-3)', marginLeft: 6 }}>
          ({spec_min !== null ? `min ${spec_min}` : ''}{spec_min !== null && spec_max !== null ? ', ' : ''}{spec_max !== null ? `max ${spec_max}` : ''})
        </span>
      )}
    </label>
  )

  const inputClass = error ? 'error' : ''
  const warnStyle = outOfSpec
    ? { borderColor: 'var(--c-warn)', boxShadow: '0 0 0 3px var(--c-warn-bg)' }
    : {}

  switch (question_type) {
    case 'date':
      return (
        <div className="form-group">
          {labelEl}
          <input
            id={field_key}
            type="date"
            value={String(strValue)}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {error && <FieldError msg={error} />}
        </div>
      )

    case 'time':
      return (
        <div className="form-group">
          {labelEl}
          <input
            id={field_key}
            type="time"
            value={String(strValue)}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {error && <FieldError msg={error} />}
        </div>
      )

    case 'number':
      return (
        <div className="form-group">
          {labelEl}
          <input
            id={field_key}
            type="number"
            step="any"
            value={String(strValue)}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            style={warnStyle}
          />
          {outOfSpec && (
            <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>
              ⚠ Outside specification limit
            </span>
          )}
          {error && <FieldError msg={error} />}
          {help_text && <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>{help_text}</span>}
        </div>
      )

    case 'select':
      return (
        <div className="form-group">
          {labelEl}
          <select
            id={field_key}
            value={String(strValue)}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {(options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <FieldError msg={error} />}
        </div>
      )

    case 'multiselect':
      return (
        <div className="form-group">
          {labelEl}
          <div className="checkbox-group" style={{ marginTop: 4 }}>
            {(options ?? []).map((opt) => {
              const checked = Array.isArray(value) ? value.includes(opt) : false
              return (
                <label key={opt} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        onChange([...current, opt])
                      } else {
                        onChange(current.filter((v) => v !== opt))
                      }
                    }}
                  />
                  <span>{opt}</span>
                </label>
              )
            })}
          </div>
          {error && <FieldError msg={error} />}
        </div>
      )

    case 'boolean':
      return (
        <div className="form-group">
          {labelEl}
          <div className="radio-group" style={{ marginTop: 4 }}>
            {['true', 'false'].map((v) => (
              <label key={v} className="radio-item">
                <input
                  type="radio"
                  name={field_key}
                  value={v}
                  checked={String(strValue) === v}
                  onChange={() => onChange(v)}
                />
                <span>{v === 'true' ? 'Yes' : 'No'}</span>
              </label>
            ))}
          </div>
          {error && <FieldError msg={error} />}
        </div>
      )

    case 'file':
      return (
        <div className="form-group">
          {labelEl}
          <input
            id={field_key}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            style={{ fontSize: '0.875rem', color: 'var(--c-text-2)' }}
          />
          {error && <FieldError msg={error} />}
        </div>
      )

    case 'text':
    default:
      return (
        <div className="form-group" style={{ gridColumn: strValue && String(strValue).length > 60 ? 'span 2' : undefined }}>
          {labelEl}
          <textarea
            id={field_key}
            value={String(strValue)}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            className={inputClass}
          />
          {error && <FieldError msg={error} />}
        </div>
      )
  }
}

function FieldError({ msg }: { msg: string }) {
  return <span style={{ color: 'var(--c-danger)', fontSize: '0.8125rem' }}>{msg}</span>
}

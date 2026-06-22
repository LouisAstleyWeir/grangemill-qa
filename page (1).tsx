'use client'

import type { Question } from '@/types'

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
        <div className="form-group" style={{ gridColumn: 'span 1' }}>
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

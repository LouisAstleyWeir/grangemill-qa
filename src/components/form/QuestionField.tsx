'use client'

import type { Question } from '@/types'

// ── Calculated means ──────────────────────────────────────────────────────────
const CALCULATED_MEANS: Record<string, [string, string] | [string, string, string]> = {
  bit_pen_mean:          ['bit_pen_1',         'bit_pen_2',         'bit_pen_3'],
  bb_pen_mean:           ['bb_pen_1',           'bb_pen_2',           'bb_pen_3'],
  bb_corr_pen_mean:      ['bb_corr_pen_1',      'bb_corr_pen_2',      'bb_corr_pen_3'],
  ma16_pen_mean:         ['ma16_pen_1',         'ma16_pen_2',         'ma16_pen_3'],
  ma16_cone_pen_mean:    ['ma16_cone_pen_1',    'ma16_cone_pen_2',    'ma16_cone_pen_3'],
  fp_bit_pen_mean:       ['fp_bit_pen_1',       'fp_bit_pen_2',       'fp_bit_pen_3'],
  fp_bit_cone_pen_mean:  ['fp_bit_cone_pen_1',  'fp_bit_cone_pen_2',  'fp_bit_cone_pen_3'],
  c1_mean_binder:        ['c1_a_binder',        'c1_1_binder'],
  c2_mean_binder:        ['c2_a_binder',        'c2_1_binder'],
}

// ── Aggregate sieve fields with their total mass source ───────────────────────
const AGG_SIEVE_FIELDS: Record<string, string> = {
  agg6_ret_0075:  'agg6_total_mass',
  agg6_ret_0212:  'agg6_total_mass',
  agg6_ret_0600:  'agg6_total_mass',
  agg6_ret_100:   'agg6_total_mass',
  agg6_ret_200:   'agg6_total_mass',
  agg6_ret_400:   'agg6_total_mass',
  agg6_ret_630:   'agg6_total_mass',
  agg6_ret_1000:  'agg6_total_mass',
  agg6_ret_1400:  'agg6_total_mass',
  agg10_ret_0075: 'agg10_total_mass',
  agg10_ret_0600: 'agg10_total_mass',
  agg10_ret_100:  'agg10_total_mass',
  agg10_ret_200:  'agg10_total_mass',
  agg10_ret_400:  'agg10_total_mass',
  agg10_ret_630:  'agg10_total_mass',
  agg10_ret_1000: 'agg10_total_mass',
  agg10_ret_1400: 'agg10_total_mass',
  agg10_ret_2000: 'agg10_total_mass',
}

// ── Total coarse aggregate sum fields ─────────────────────────────────────────
const AGG_TOTAL_COARSE: Record<string, string[]> = {
  agg6_total_coarse: [
    'agg6_ret_0075', 'agg6_ret_0212', 'agg6_ret_0600',
    'agg6_ret_100',  'agg6_ret_200',  'agg6_ret_400',
    'agg6_ret_630',  'agg6_ret_1000', 'agg6_ret_1400',
  ],
  agg10_total_coarse: [
    'agg10_ret_0075', 'agg10_ret_0600', 'agg10_ret_100',
    'agg10_ret_200',  'agg10_ret_400',  'agg10_ret_630',
    'agg10_ret_1000', 'agg10_ret_1400', 'agg10_ret_2000',
  ],
}

// ── % Coarse aggregate summary fields ────────────────────────────────────────
const AGG_PCT_COARSE: Record<string, { fields: string[]; totalKey: string }> = {
  agg6_pct_coarse: {
    totalKey: 'agg6_total_mass',
    fields: [
      'agg6_ret_0075', 'agg6_ret_0212', 'agg6_ret_0600',
      'agg6_ret_100',  'agg6_ret_200',  'agg6_ret_400',
      'agg6_ret_630',  'agg6_ret_1000', 'agg6_ret_1400',
    ],
  },
  agg10_pct_coarse: {
    totalKey: 'agg10_total_mass',
    fields: [
      'agg10_ret_0075', 'agg10_ret_0600', 'agg10_ret_100',
      'agg10_ret_200',  'agg10_ret_400',  'agg10_ret_630',
      'agg10_ret_1000', 'agg10_ret_1400', 'agg10_ret_2000',
    ],
  },
}

// ── Helper functions ──────────────────────────────────────────────────────────
function calcMean(
  sources: [string, string] | [string, string, string],
  allAnswers: Record<string, string | string[]>
): string {
  const vals = sources.map((k) => parseFloat(String(allAnswers[k] ?? '')))
  const valid = vals.filter((v) => !isNaN(v))
  if (valid.length === 0) return ''
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length
  return parseFloat(mean.toFixed(2)).toString()
}

function calcPct(retained: string, totalMassKey: string, allAnswers: Record<string, string | string[]>): string {
  const ret   = parseFloat(retained)
  const total = parseFloat(String(allAnswers[totalMassKey] ?? ''))
  if (isNaN(ret) || isNaN(total) || total === 0) return ''
  return parseFloat(((ret / total) * 100).toFixed(1)).toString()
}

function calcSum(fields: string[], allAnswers: Record<string, string | string[]>): string {
  const vals = fields.map((k) => parseFloat(String(allAnswers[k] ?? '')))
  const valid = vals.filter((v) => !isNaN(v))
  if (valid.length === 0) return ''
  return parseFloat(valid.reduce((a, b) => a + b, 0).toFixed(2)).toString()
}

// ── Shared calculated display box ─────────────────────────────────────────────
function CalcDisplay({
  value,
  emptyText,
  tag,
  large = false,
  accent = false,
  outOfSpec = false,
  suffix = '',
}: {
  value: string
  emptyText: string
  tag: string
  large?: boolean
  accent?: boolean
  outOfSpec?: boolean
}) {
  return (
    <div style={{
      padding: large ? '0.75rem 1rem' : '0.5rem 0.75rem',
      background: value
        ? accent ? 'var(--c-accent-light)' : 'var(--c-slate-light)'
        : 'var(--c-surface-2)',
      border: `1px solid ${outOfSpec ? 'var(--c-warn)' : value && accent ? 'var(--c-accent)' : 'var(--c-border)'}`,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-mono)',
      fontSize: large ? '1.125rem' : '0.9375rem',
      color: value
        ? accent ? 'var(--c-accent-dark)' : 'var(--c-slate)'
        : 'var(--c-text-3)',
      fontWeight: value ? (large ? 700 : 600) : 400,
      minHeight: large ? '2.75rem' : '2.375rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span>{value ? `${value}${suffix}` : emptyText}</span>
      {value && (
        <span style={{
          fontSize: '0.6875rem',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: accent ? 'var(--c-accent)' : 'var(--c-text-3)',
        }}>
          {tag}
        </span>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  question: Question
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
  error?: string
  allAnswers: Record<string, string | string[]>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuestionField({ question, value, onChange, error, allAnswers }: Props) {
  const { field_key, label, question_type, options, is_required, spec_min, spec_max, help_text } = question

  // ── Conditional visibility ────────────────────────────────────────────────
  if (field_key.startsWith('bit_pen_') && field_key !== 'bit_pen_required') {
    if (allAnswers['bit_pen_required'] === 'false') return null
  }
  if (field_key === 'bit_sp') {
    if (allAnswers['bit_sp_required'] === 'false') return null
  }
  if (field_key.startsWith('bb_corr_') && field_key !== 'bb_corrected') {
    if (allAnswers['bb_corrected'] !== 'true') return null
  }

  // ── Calculated mean field ─────────────────────────────────────────────────
  if (CALCULATED_MEANS[field_key]) {
    const calculated = calcMean(CALCULATED_MEANS[field_key], allAnswers)
    if (calculated !== String(value ?? '')) setTimeout(() => onChange(calculated), 0)

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
        <CalcDisplay value={calculated} emptyText="Auto-calculated" tag="avg" outOfSpec={outOfSpec} />
        {outOfSpec && <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>⚠ Outside specification limit</span>}
      </div>
    )
  }

  // ── Total coarse aggregate sum ────────────────────────────────────────────
  if (AGG_TOTAL_COARSE[field_key]) {
    const calculated = calcSum(AGG_TOTAL_COARSE[field_key], allAnswers)
    if (calculated !== String(value ?? '')) setTimeout(() => onChange(calculated), 0)

    const hasSpecLimit = spec_min !== null || spec_max !== null
    const numVal = parseFloat(calculated)
    const outOfSpec = hasSpecLimit && !isNaN(numVal) && (
      (spec_min !== null && numVal < spec_min) ||
      (spec_max !== null && numVal > spec_max)
    )

    return (
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label>
          {label}
          {hasSpecLimit && (
            <span style={{ fontWeight: 400, color: 'var(--c-text-3)', marginLeft: 6 }}>
              ({spec_min !== null ? `min ${spec_min}` : ''}{spec_min !== null && spec_max !== null ? ', ' : ''}{spec_max !== null ? `max ${spec_max}` : ''})
            </span>
          )}
        </label>
        <CalcDisplay
          value={calculated}
          emptyText="Sum of retained weights above"
          tag="total g"
          large
          outOfSpec={outOfSpec}
          suffix="g"
        />
        {outOfSpec && <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>⚠ Outside specification limit</span>}
      </div>
    )
  }

  // ── % Coarse aggregate ────────────────────────────────────────────────────
  if (AGG_PCT_COARSE[field_key]) {
    const { fields, totalKey } = AGG_PCT_COARSE[field_key]
    const total = parseFloat(String(allAnswers[totalKey] ?? ''))
    const sumRetained = fields.reduce((acc, k) => {
      const v = parseFloat(String(allAnswers[k] ?? ''))
      return acc + (isNaN(v) ? 0 : v)
    }, 0)
    const calculated = !isNaN(total) && total > 0
      ? parseFloat(((sumRetained / total) * 100).toFixed(1)).toString()
      : ''

    if (calculated !== String(value ?? '')) setTimeout(() => onChange(calculated), 0)

    const hasSpecLimit = spec_min !== null || spec_max !== null
    const numVal = parseFloat(calculated)
    const outOfSpec = hasSpecLimit && !isNaN(numVal) && (
      (spec_min !== null && numVal < spec_min) ||
      (spec_max !== null && numVal > spec_max)
    )

    return (
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label>
          {label}
          {hasSpecLimit && (
            <span style={{ fontWeight: 400, color: 'var(--c-text-3)', marginLeft: 6 }}>
              ({spec_min !== null ? `min ${spec_min}` : ''}{spec_min !== null && spec_max !== null ? ', ' : ''}{spec_max !== null ? `max ${spec_max}` : ''})
            </span>
          )}
        </label>
        <CalcDisplay
          value={calculated}
          emptyText="Calculated from sieve weights above"
          tag="% coarse"
          large
          accent
          outOfSpec={outOfSpec}
          suffix="%"
        />
        {outOfSpec && <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>⚠ Outside specification limit</span>}
      </div>
    )
  }

  // ── Aggregate sieve field — input + calculated % pair ────────────────────
  if (AGG_SIEVE_FIELDS[field_key]) {
    const totalMassKey = AGG_SIEVE_FIELDS[field_key]
    const strVal = String(value ?? '')
    const pct = calcPct(strVal, totalMassKey, allAnswers)
    const totalMassSet = !!allAnswers[totalMassKey]

    const hasSpecLimit = spec_min !== null || spec_max !== null
    const numVal = parseFloat(strVal)
    const outOfSpec = hasSpecLimit && !isNaN(numVal) && (
      (spec_min !== null && numVal < spec_min) ||
      (spec_max !== null && numVal > spec_max)
    )

    return (
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label htmlFor={field_key}>
          {label}
          {is_required && <span className="required"> *</span>}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginBottom: 4 }}>
              Weight retained (g)
            </div>
            <input
              id={field_key}
              type="number"
              step="any"
              value={strVal}
              onChange={(e) => onChange(e.target.value)}
              className={error ? 'error' : ''}
              style={outOfSpec ? { borderColor: 'var(--c-warn)', boxShadow: '0 0 0 3px var(--c-warn-bg)' } : {}}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginBottom: 4 }}>
              % of total mass
            </div>
            <CalcDisplay
              value={pct}
              emptyText={totalMassSet ? 'Enter weight' : 'Enter total mass first'}
              tag="calc"
              suffix="%"
            />
          </div>
        </div>
        {outOfSpec && <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>⚠ Outside specification limit</span>}
        {error && <FieldError msg={error} />}
      </div>
    )
  }

  // ── Standard fields ───────────────────────────────────────────────────────
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
          {help_text && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>{help_text}</span>
          )}
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
        <div className="form-group" style={{
          gridColumn: strValue && String(strValue).length > 60 ? 'span 2' : undefined,
        }}>
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

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

// ── Composition sieve chain ───────────────────────────────────────────────────
// Each entry: [weight_retained_field_key, mass_aggregate_field_key, previous_passing_field_key | null]
// null previous = top sieve, uses 100 - % retained formula
type SieveChainEntry = {
  retainedKey: string
  massAggKey: string
  prevPassingKey: string | null
}

const C1_SIEVE_CHAIN: SieveChainEntry[] = [
  { retainedKey: 'c1_ret_14',   massAggKey: 'c1_mass_aggregate', prevPassingKey: null           },
  { retainedKey: 'c1_ret_10',   massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_14' },
  { retainedKey: 'c1_ret_63',   massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_10' },
  { retainedKey: 'c1_ret_40',   massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_63' },
  { retainedKey: 'c1_ret_335',  massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_40' },
  { retainedKey: 'c1_ret_236',  massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_335'},
  { retainedKey: 'c1_ret_20',   massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_236'},
  { retainedKey: 'c1_ret_06',   massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_20' },
  { retainedKey: 'c1_ret_025',  massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_06' },
  { retainedKey: 'c1_ret_0212', massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_025'},
  { retainedKey: 'c1_ret_0075', massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_0212'},
  { retainedKey: 'c1_ret_0063', massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_0075'},
  { retainedKey: 'c1_ret_pan',  massAggKey: 'c1_mass_aggregate', prevPassingKey: 'c1_pct_pas_0063'},
]

const C2_SIEVE_CHAIN: SieveChainEntry[] = [
  { retainedKey: 'c2_ret_14',   massAggKey: 'c2_mass_aggregate', prevPassingKey: null           },
  { retainedKey: 'c2_ret_10',   massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_14' },
  { retainedKey: 'c2_ret_63',   massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_10' },
  { retainedKey: 'c2_ret_40',   massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_63' },
  { retainedKey: 'c2_ret_335',  massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_40' },
  { retainedKey: 'c2_ret_236',  massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_335'},
  { retainedKey: 'c2_ret_20',   massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_236'},
  { retainedKey: 'c2_ret_06',   massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_20' },
  { retainedKey: 'c2_ret_025',  massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_06' },
  { retainedKey: 'c2_ret_0212', massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_025'},
  { retainedKey: 'c2_ret_0075', massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_0212'},
  { retainedKey: 'c2_ret_0063', massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_0075'},
  { retainedKey: 'c2_ret_pan',  massAggKey: 'c2_mass_aggregate', prevPassingKey: 'c2_pct_pas_0063'},
]

// Build a lookup: pct_ret or pct_pas field_key → its chain entry + whether it's ret or pas
type ChainLookup = {
  entry: SieveChainEntry
  type: 'retained' | 'passing'
  retFieldKey: string
  pasFieldKey: string
}

function buildChainLookup(chain: SieveChainEntry[], prefix: string): Record<string, ChainLookup> {
  const lookup: Record<string, ChainLookup> = {}
  const sieves = ['14', '10', '63', '40', '335', '236', '20', '06', '025', '0212', '0075', '0063', 'pan']
  chain.forEach((entry, i) => {
    const sieve = sieves[i]
    const retKey = `${prefix}_pct_ret_${sieve}`
    const pasKey = `${prefix}_pct_pas_${sieve}`
    lookup[retKey] = { entry, type: 'retained', retFieldKey: retKey, pasFieldKey: pasKey }
    lookup[pasKey] = { entry, type: 'passing',  retFieldKey: retKey, pasFieldKey: pasKey }
  })
  return lookup
}

const C1_CHAIN_LOOKUP = buildChainLookup(C1_SIEVE_CHAIN, 'c1')
const C2_CHAIN_LOOKUP = buildChainLookup(C2_SIEVE_CHAIN, 'c2')
const ALL_CHAIN_LOOKUP = { ...C1_CHAIN_LOOKUP, ...C2_CHAIN_LOOKUP }

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

function calcMassAggregate(totalKey: string, solubleBKey: string, allAnswers: Record<string, string | string[]>): string {
  const total   = parseFloat(String(allAnswers[totalKey]   ?? ''))
  const soluble = parseFloat(String(allAnswers[solubleBKey] ?? ''))
  if (isNaN(total) || isNaN(soluble)) return ''
  return parseFloat((total - ((total / 100) * soluble)).toFixed(2)).toString()
}

function calcSievePctRetained(retainedKey: string, massAggKey: string, allAnswers: Record<string, string | string[]>): string {
  const retained = parseFloat(String(allAnswers[retainedKey] ?? ''))
  const massAgg  = parseFloat(String(allAnswers[massAggKey]  ?? ''))
  if (isNaN(retained) || isNaN(massAgg) || massAgg === 0) return ''
  return parseFloat(((retained / massAgg) * 100).toFixed(2)).toString()
}

function calcSievePctPassing(
  retainedKey: string,
  massAggKey: string,
  prevPassingKey: string | null,
  retFieldKey: string,
  allAnswers: Record<string, string | string[]>
): string {
  const pctRetained = parseFloat(calcSievePctRetained(retainedKey, massAggKey, allAnswers))
  if (isNaN(pctRetained)) return ''

  if (prevPassingKey === null) {
    // Top sieve — % passing = 100 - % retained
    return parseFloat((100 - pctRetained).toFixed(2)).toString()
  }

  // All other sieves — % passing = previous % passing - % retained
  const prevPassing = parseFloat(String(allAnswers[prevPassingKey] ?? ''))
  if (isNaN(prevPassing)) return ''
  return parseFloat((prevPassing - pctRetained).toFixed(2)).toString()
}

// ── Shared calculated display box ─────────────────────────────────────────────
function CalcDisplay({
  value, emptyText, tag, large = false, accent = false, outOfSpec = false, suffix = '',
}: {
  value: string
  emptyText: string
  tag: string
  large?: boolean
  accent?: boolean
  outOfSpec?: boolean
  suffix?: string
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

  // ── Calculated mean ───────────────────────────────────────────────────────
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

  // ── Mass aggregate (c1 and c2) ────────────────────────────────────────────
  if (field_key === 'c1_mass_aggregate' || field_key === 'c2_mass_aggregate') {
    const prefix = field_key === 'c1_mass_aggregate' ? 'c1' : 'c2'
    const calculated = calcMassAggregate(
      `${prefix}_total_mass`,
      `${prefix}_soluble_binder`,
      allAnswers
    )
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
          emptyText="Calculated from total mass and soluble binder content"
          tag="mass agg"
          large
          outOfSpec={outOfSpec}
          suffix="g"
        />
        {outOfSpec && <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>⚠ Outside specification limit</span>}
      </div>
    )
  }

  // ── Composition sieve % retained and % passing ────────────────────────────
  if (ALL_CHAIN_LOOKUP[field_key]) {
    const { entry, type, retFieldKey, pasFieldKey } = ALL_CHAIN_LOOKUP[field_key]

    const pctRetained = calcSievePctRetained(entry.retainedKey, entry.massAggKey, allAnswers)
    const pctPassing  = calcSievePctPassing(
      entry.retainedKey, entry.massAggKey, entry.prevPassingKey, retFieldKey, allAnswers
    )

    // Sync both values when this field renders
    const currentRetained = String(allAnswers[retFieldKey] ?? '')
    const currentPassing  = String(allAnswers[pasFieldKey] ?? '')
    if (pctRetained !== currentRetained) setTimeout(() => onChange(pctRetained), 0)

    // Only render the pair once — on the % retained field, show both
    // On the % passing field, render nothing (already shown in the retained render)
    if (type === 'passing') return null

    // Sync passing value too
    if (pctPassing !== currentPassing) {
      // We can't call onChange for a different field here, so we store it via allAnswers
      // The passing field will be synced when it renders (returns null but still calls sync)
    }

    const hasSpecLimit = spec_min !== null || spec_max !== null
    const retNum = parseFloat(pctRetained)
    const pasNum = parseFloat(pctPassing)
    const outOfSpecRet = hasSpecLimit && !isNaN(retNum) && (
      (spec_min !== null && retNum < spec_min) || (spec_max !== null && retNum > spec_max)
    )

    return (
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label>{label.replace('% Retained ', '')} sieve</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginBottom: 4 }}>% Retained</div>
            <CalcDisplay
              value={pctRetained}
              emptyText="—"
              tag="ret"
              outOfSpec={outOfSpecRet}
              suffix="%"
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginBottom: 4 }}>% Passing</div>
            <CalcDisplay
              value={pctPassing}
              emptyText="—"
              tag="pas"
              accent
              suffix="%"
            />
          </div>
        </div>
        {outOfSpecRet && <span style={{ color: 'var(--c-warn)', fontSize: '0.8125rem' }}>⚠ % retained outside specification limit</span>}
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
        <label>{label}</label>
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
        <label>{label}</label>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginBottom: 4 }}>Weight retained (g)</div>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-3)', marginBottom: 4 }}>% of total mass</div>
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

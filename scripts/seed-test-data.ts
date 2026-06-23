// Grangemill QA — Test data seed script
// Usage: npx tsx scripts/seed-test-data.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const errors: string[] = []

function randomDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  return d.toISOString().split('T')[0]
}

function randomTime(): string {
  const h = String(Math.floor(Math.random() * 8) + 7).padStart(2, '0')
  const m = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  return `${h}:${m}`
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

const STAFF = ['Jonathan Buist', 'Hayley Whitworth', 'Dominic Birch', 'Jonny Gregg']
const staff = () => STAFF[Math.floor(Math.random() * STAFF.length)]

// ─── Lookup helpers ──────────────────────────────────────────────────────────

async function getCategoryId(code: string): Promise<string> {
  const { data } = await db.from('sample_categories').select('id').eq('code', code).single()
  if (!data) throw new Error(`Category not found: ${code}`)
  return data.id
}

async function getMaterialId(code: string): Promise<string> {
  const { data } = await db.from('material_types').select('id').eq('code', code).single()
  if (!data) throw new Error(`Material type not found: ${code}`)
  return data.id
}

async function getProductId(code: string): Promise<string | null> {
  const { data } = await db.from('products').select('id').eq('code', code).single()
  return data?.id ?? null
}

async function getQuestionId(fieldKey: string): Promise<string | null> {
  const { data } = await db.from('questions').select('id').eq('field_key', fieldKey).single()
  return data?.id ?? null
}

// ─── Core submission builder ─────────────────────────────────────────────────

interface ResponseInput {
  field_key: string
  answer_value: string
  answer_numeric?: number | null
}

async function submitTest(label: string, payload: {
  categoryCode: string
  materialCode: string
  productCode?: string
  responses: ResponseInput[]
}): Promise<void> {
  process.stdout.write(`  ${label}… `)

  try {
    const categoryId    = await getCategoryId(payload.categoryCode)
    const materialId    = await getMaterialId(payload.materialCode)
    const productId     = payload.productCode ? await getProductId(payload.productCode) : null

    // Insert submission
    const { data: sub, error: subErr } = await db
      .from('submissions')
      .insert({
        category_id:      categoryId,
        material_type_id: materialId,
        product_id:       productId,
        unique_id:        uid('GM'),
        date_of_sample:   randomDate(30),
        time_taken:       randomTime(),
        sampled_by:       staff(),
        tested_by:        staff(),
        submitted_by:     'seed-script',
        status:           'submitted',
      })
      .select('id')
      .single()

    if (subErr || !sub) throw new Error(subErr?.message ?? 'No submission returned')

    // Build responses
    const responseRows: object[] = []
    for (const r of payload.responses) {
      const qId = await getQuestionId(r.field_key)
      if (!qId) continue
      responseRows.push({
        submission_id:  sub.id,
        question_id:    qId,
        field_key:      r.field_key,
        answer_value:   r.answer_value,
        answer_numeric: r.answer_numeric ?? (isNaN(parseFloat(r.answer_value)) ? null : parseFloat(r.answer_value)),
      })
    }

    if (responseRows.length > 0) {
      const { error: respErr } = await db.from('responses').insert(responseRows)
      if (respErr) throw new Error(`Responses: ${respErr.message}`)
    }

    // Auto-raise exceptions
    await db.rpc('raise_out_of_spec_exceptions', { p_submission_id: sub.id })

    console.log('✓')
    passed++
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`✗  ${msg}`)
    errors.push(`${label}: ${msg}`)
    failed++
  }
}

// ─── Test scenarios ──────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n🧪  Grangemill QA — Seed test data\n')

  // ── 1. Raw Material: Bitumen ───────────────────────────────────────────────
  console.log('Raw Material → Bitumen')

  await submitTest('H80/90 — pen + softening point', {
    categoryCode: 'raw_material',
    materialCode: 'rm_bitumen',
    productCode:  'bit_h8090',
    responses: [
      { field_key: 'bit_pen_required', answer_value: 'true' },
      { field_key: 'bit_pen_1',        answer_value: '82',  answer_numeric: 82  },
      { field_key: 'bit_pen_2',        answer_value: '85',  answer_numeric: 85  },
      { field_key: 'bit_pen_3',        answer_value: '83',  answer_numeric: 83  },
      { field_key: 'bit_pen_mean',     answer_value: '83.3',answer_numeric: 83.3},
      { field_key: 'bit_sp_required',  answer_value: 'true' },
      { field_key: 'bit_sp',           answer_value: '46.5',answer_numeric: 46.5},
      { field_key: 'bit_rd_informed',  answer_value: 'false'},
    ],
  })

  await submitTest('70/100 — pen only', {
    categoryCode: 'raw_material',
    materialCode: 'rm_bitumen',
    productCode:  'bit_70100',
    responses: [
      { field_key: 'bit_pen_required', answer_value: 'true' },
      { field_key: 'bit_pen_1',        answer_value: '95',  answer_numeric: 95  },
      { field_key: 'bit_pen_2',        answer_value: '98',  answer_numeric: 98  },
      { field_key: 'bit_pen_3',        answer_value: '96',  answer_numeric: 96  },
      { field_key: 'bit_pen_mean',     answer_value: '96.3',answer_numeric: 96.3},
      { field_key: 'bit_sp_required',  answer_value: 'false'},
      { field_key: 'bit_rd_informed',  answer_value: 'false'},
    ],
  })

  await submitTest('15/25 — out of spec pen (triggers exception)', {
    categoryCode: 'raw_material',
    materialCode: 'rm_bitumen',
    productCode:  'bit_1525',
    responses: [
      { field_key: 'bit_pen_required', answer_value: 'true' },
      { field_key: 'bit_pen_1',        answer_value: '999', answer_numeric: 999 },
      { field_key: 'bit_pen_2',        answer_value: '999', answer_numeric: 999 },
      { field_key: 'bit_pen_3',        answer_value: '999', answer_numeric: 999 },
      { field_key: 'bit_pen_mean',     answer_value: '999', answer_numeric: 999 },
      { field_key: 'bit_sp_required',  answer_value: 'false'},
      { field_key: 'bit_rd_informed',  answer_value: 'true' },
      { field_key: 'bit_comments',     answer_value: 'Unusually high pen — flagged for review' },
    ],
  })

  // ── 2. Raw Material: Coarse Aggregate ─────────────────────────────────────
  console.log('\nRaw Material → Coarse Aggregate')

  await submitTest('6mm Ex Bardon Hill', {
    categoryCode: 'raw_material',
    materialCode: 'rm_coarse_aggregate',
    productCode:  'agg_6mm_bardon',
    responses: [
      { field_key: 'agg6_moisture',   answer_value: '0.3',  answer_numeric: 0.3  },
      { field_key: 'agg6_water_abs',  answer_value: '0.8',  answer_numeric: 0.8  },
      { field_key: 'agg6_ret_0075',   answer_value: '0.2',  answer_numeric: 0.2  },
      { field_key: 'agg6_ret_0212',   answer_value: '0.4',  answer_numeric: 0.4  },
      { field_key: 'agg6_ret_0600',   answer_value: '1.1',  answer_numeric: 1.1  },
      { field_key: 'agg6_ret_100',    answer_value: '2.3',  answer_numeric: 2.3  },
      { field_key: 'agg6_ret_200',    answer_value: '8.7',  answer_numeric: 8.7  },
      { field_key: 'agg6_ret_400',    answer_value: '42.1', answer_numeric: 42.1 },
      { field_key: 'agg6_ret_630',    answer_value: '88.4', answer_numeric: 88.4 },
      { field_key: 'agg6_ret_1000',   answer_value: '99.1', answer_numeric: 99.1 },
      { field_key: 'agg6_ret_1400',   answer_value: '100',  answer_numeric: 100  },
      { field_key: 'agg6_comments',   answer_value: 'Normal grading curve' },
    ],
  })

  await submitTest('10mm Ex Mountsorrall', {
    categoryCode: 'raw_material',
    materialCode: 'rm_coarse_aggregate',
    productCode:  'agg_10mm_mountsorrall',
    responses: [
      { field_key: 'agg10_moisture',   answer_value: '0.4',  answer_numeric: 0.4  },
      { field_key: 'agg10_water_abs',  answer_value: '0.7',  answer_numeric: 0.7  },
      { field_key: 'agg10_ret_0075',   answer_value: '0.1',  answer_numeric: 0.1  },
      { field_key: 'agg10_ret_0600',   answer_value: '0.3',  answer_numeric: 0.3  },
      { field_key: 'agg10_ret_100',    answer_value: '0.6',  answer_numeric: 0.6  },
      { field_key: 'agg10_ret_200',    answer_value: '1.8',  answer_numeric: 1.8  },
      { field_key: 'agg10_ret_400',    answer_value: '5.2',  answer_numeric: 5.2  },
      { field_key: 'agg10_ret_630',    answer_value: '18.4', answer_numeric: 18.4 },
      { field_key: 'agg10_ret_1000',   answer_value: '72.6', answer_numeric: 72.6 },
      { field_key: 'agg10_ret_1400',   answer_value: '97.3', answer_numeric: 97.3 },
      { field_key: 'agg10_ret_2000',   answer_value: '100',  answer_numeric: 100  },
    ],
  })

  await submitTest('Other supplier — new supplier notification', {
    categoryCode: 'raw_material',
    materialCode: 'rm_coarse_aggregate',
    productCode:  'agg_other',
    responses: [
      { field_key: 'agg_other_supplier',  answer_value: 'Tarmac Ltd' },
      { field_key: 'agg_other_type',      answer_value: '6mm aggregate' },
      { field_key: 'agg_mgmt_informed',   answer_value: 'true' },
      { field_key: 'agg6_moisture',       answer_value: '0.5',  answer_numeric: 0.5  },
      { field_key: 'agg6_water_abs',      answer_value: '1.0',  answer_numeric: 1.0  },
      { field_key: 'agg6_ret_0075',       answer_value: '0.3',  answer_numeric: 0.3  },
      { field_key: 'agg6_ret_0212',       answer_value: '0.5',  answer_numeric: 0.5  },
      { field_key: 'agg6_ret_0600',       answer_value: '1.2',  answer_numeric: 1.2  },
      { field_key: 'agg6_ret_100',        answer_value: '2.8',  answer_numeric: 2.8  },
      { field_key: 'agg6_ret_200',        answer_value: '9.1',  answer_numeric: 9.1  },
      { field_key: 'agg6_ret_400',        answer_value: '44.3', answer_numeric: 44.3 },
      { field_key: 'agg6_ret_630',        answer_value: '90.1', answer_numeric: 90.1 },
      { field_key: 'agg6_ret_1000',       answer_value: '99.4', answer_numeric: 99.4 },
      { field_key: 'agg6_ret_1400',       answer_value: '100',  answer_numeric: 100  },
    ],
  })

  // ── 3. Raw Material: Mastic Filler ────────────────────────────────────────
  console.log('\nRaw Material → Mastic Filler')

  await submitTest('Mastic filler ex Longcliffe — delivery', {
    categoryCode: 'raw_material',
    materialCode: 'rm_mastic_filler',
    productCode:  'mf_longcliffe',
    responses: [
      { field_key: 'mf_sample_type',  answer_value: 'Delivery (raw material)' },
      { field_key: 'mf_moisture',     answer_value: '0.1',  answer_numeric: 0.1  },
      { field_key: 'mf_water_abs',    answer_value: '0.05', answer_numeric: 0.05 },
      { field_key: 'mf_ret_0075',     answer_value: '2.1',  answer_numeric: 2.1  },
      { field_key: 'mf_ret_gt0075',   answer_value: '97.9', answer_numeric: 97.9 },
      { field_key: 'mf_ret_gt0212',   answer_value: '45.3', answer_numeric: 45.3 },
      { field_key: 'mf_ret_gt0600',   answer_value: '8.2',  answer_numeric: 8.2  },
      { field_key: 'mf_ret_gt236',    answer_value: '0.4',  answer_numeric: 0.4  },
    ],
  })

  // ── 4. Raw Material: Rubber Crumb ─────────────────────────────────────────
  console.log('\nRaw Material → Rubber Crumb')

  await submitTest('Rubber crumb grading', {
    categoryCode: 'raw_material',
    materialCode: 'rm_rubber_crumb',
    responses: [
      { field_key: 'rc_mass',         answer_value: '100',  answer_numeric: 100  },
      { field_key: 'rc_passing_1mm',  answer_value: '94.2', answer_numeric: 94.2 },
      { field_key: 'rc_retained_1mm', answer_value: '5.8',  answer_numeric: 5.8  },
      { field_key: 'rc_comments',     answer_value: 'Good grading' },
    ],
  })

  // ── 5. In Process: Bitumen Blend ──────────────────────────────────────────
  console.log('\nIn Process → Bitumen Blend')

  await submitTest('Blend 3 — no correction', {
    categoryCode: 'in_process',
    materialCode: 'ip_bitumen_blend',
    productCode:  'blend_3',
    responses: [
      { field_key: 'bb_pen_1',    answer_value: '55',   answer_numeric: 55   },
      { field_key: 'bb_pen_2',    answer_value: '57',   answer_numeric: 57   },
      { field_key: 'bb_pen_3',    answer_value: '56',   answer_numeric: 56   },
      { field_key: 'bb_pen_mean', answer_value: '56',   answer_numeric: 56   },
      { field_key: 'bb_corrected',answer_value: 'false' },
    ],
  })

  await submitTest('Blend 7 — blend corrected', {
    categoryCode: 'in_process',
    materialCode: 'ip_bitumen_blend',
    productCode:  'blend_7',
    responses: [
      { field_key: 'bb_pen_1',         answer_value: '40',   answer_numeric: 40   },
      { field_key: 'bb_pen_2',         answer_value: '38',   answer_numeric: 38   },
      { field_key: 'bb_pen_3',         answer_value: '39',   answer_numeric: 39   },
      { field_key: 'bb_pen_mean',      answer_value: '39',   answer_numeric: 39   },
      { field_key: 'bb_corrected',     answer_value: 'true'  },
      { field_key: 'bb_corr_pen_1',    answer_value: '54',   answer_numeric: 54   },
      { field_key: 'bb_corr_pen_2',    answer_value: '55',   answer_numeric: 55   },
      { field_key: 'bb_corr_pen_3',    answer_value: '54',   answer_numeric: 54   },
      { field_key: 'bb_corr_pen_mean', answer_value: '54.3', answer_numeric: 54.3 },
    ],
  })

  // ── 6. In Process: Mastic Asphalt (standard) ──────────────────────────────
  console.log('\nIn Process → Mastic Asphalt')

  await submitTest('MA 103 — no composition', {
    categoryCode: 'in_process',
    materialCode: 'ip_mastic_asphalt',
    productCode:  'ma_103',
    responses: [
      { field_key: 'ma_hardness',       answer_value: '72',    answer_numeric: 72    },
      { field_key: 'ma_working_temp',   answer_value: '220',   answer_numeric: 220   },
      { field_key: 'ma_float',          answer_value: 'Okay'   },
      { field_key: 'ma_comp_required',  answer_value: 'false'  },
    ],
  })

  await submitTest('MA 217 — composition required', {
    categoryCode: 'in_process',
    materialCode: 'ip_mastic_asphalt',
    productCode:  'ma_217',
    responses: [
      { field_key: 'ma_hardness',        answer_value: '68',    answer_numeric: 68    },
      { field_key: 'ma_working_temp',    answer_value: '215',   answer_numeric: 215   },
      { field_key: 'ma_float',           answer_value: 'Okay'   },
      { field_key: 'ma_comp_required',   answer_value: 'true'   },
      // Composition 1
      { field_key: 'c1_total_mass',      answer_value: '1250',  answer_numeric: 1250  },
      { field_key: 'c1_aliquot_vol',     answer_value: '312.5', answer_numeric: 312.5 },
      { field_key: 'c1_a_flask_binder',  answer_value: '185.4', answer_numeric: 185.4 },
      { field_key: 'c1_a_binder',        answer_value: '42.1',  answer_numeric: 42.1  },
      { field_key: 'c1_1_flask',         answer_value: '143.2', answer_numeric: 143.2 },
      { field_key: 'c1_1_flask_binder',  answer_value: '185.6', answer_numeric: 185.6 },
      { field_key: 'c1_1_binder',        answer_value: '42.4',  answer_numeric: 42.4  },
      { field_key: 'c1_mean_binder',     answer_value: '42.25', answer_numeric: 42.25 },
      { field_key: 'c1_soluble_binder',  answer_value: '13.5',  answer_numeric: 13.5  },
      { field_key: 'c1_ret_14',          answer_value: '0',     answer_numeric: 0     },
      { field_key: 'c1_ret_10',          answer_value: '0',     answer_numeric: 0     },
      { field_key: 'c1_ret_63',          answer_value: '2.1',   answer_numeric: 2.1   },
      { field_key: 'c1_ret_40',          answer_value: '8.4',   answer_numeric: 8.4   },
      { field_key: 'c1_ret_335',         answer_value: '15.2',  answer_numeric: 15.2  },
      { field_key: 'c1_ret_236',         answer_value: '22.8',  answer_numeric: 22.8  },
      { field_key: 'c1_ret_20',          answer_value: '31.4',  answer_numeric: 31.4  },
      { field_key: 'c1_ret_06',          answer_value: '52.6',  answer_numeric: 52.6  },
      { field_key: 'c1_ret_025',         answer_value: '71.3',  answer_numeric: 71.3  },
      { field_key: 'c1_ret_0212',        answer_value: '78.9',  answer_numeric: 78.9  },
      { field_key: 'c1_ret_0075',        answer_value: '94.2',  answer_numeric: 94.2  },
      { field_key: 'c1_ret_0063',        answer_value: '97.8',  answer_numeric: 97.8  },
      { field_key: 'c1_ret_pan',         answer_value: '100',   answer_numeric: 100   },
    ],
  })

  await submitTest('MA Option 16 — extended pen + cone pen', {
    categoryCode: 'in_process',
    materialCode: 'ip_mastic_asphalt',
    productCode:  'ma_Option_16',
    responses: [
      { field_key: 'ma_hardness',         answer_value: '70',   answer_numeric: 70   },
      { field_key: 'ma_working_temp',     answer_value: '218',  answer_numeric: 218  },
      { field_key: 'ma_float',            answer_value: 'Okay'  },
      { field_key: 'ma_comp_required',    answer_value: 'false' },
      { field_key: 'ma16_pen_1',          answer_value: '22',   answer_numeric: 22   },
      { field_key: 'ma16_pen_2',          answer_value: '23',   answer_numeric: 23   },
      { field_key: 'ma16_pen_3',          answer_value: '22',   answer_numeric: 22   },
      { field_key: 'ma16_pen_mean',       answer_value: '22.3', answer_numeric: 22.3 },
      { field_key: 'ma16_cone_pen_1',     answer_value: '48',   answer_numeric: 48   },
      { field_key: 'ma16_cone_pen_2',     answer_value: '49',   answer_numeric: 49   },
      { field_key: 'ma16_cone_pen_3',     answer_value: '48',   answer_numeric: 48   },
      { field_key: 'ma16_cone_pen_mean',  answer_value: '48.3', answer_numeric: 48.3 },
      { field_key: 'ma16_sp',             answer_value: '58.5', answer_numeric: 58.5 },
      { field_key: 'ma16_float',          answer_value: 'Okay'  },
      { field_key: 'ma16_resilience',     answer_value: '52',   answer_numeric: 52   },
    ],
  })

  // ── 7. In Process: Mastic Filler ──────────────────────────────────────────
  console.log('\nIn Process → Mastic Filler')

  await submitTest('Mastic filler — screw in process', {
    categoryCode: 'in_process',
    materialCode: 'ip_mastic_filler',
    responses: [
      { field_key: 'mf_sample_type',  answer_value: 'Screw (in process)' },
      { field_key: 'mf_moisture',     answer_value: '0.08', answer_numeric: 0.08 },
      { field_key: 'mf_water_abs',    answer_value: '0.04', answer_numeric: 0.04 },
      { field_key: 'mf_ret_0075',     answer_value: '1.8',  answer_numeric: 1.8  },
      { field_key: 'mf_ret_gt0075',   answer_value: '98.2', answer_numeric: 98.2 },
      { field_key: 'mf_ret_gt0212',   answer_value: '46.1', answer_numeric: 46.1 },
      { field_key: 'mf_ret_gt0600',   answer_value: '7.9',  answer_numeric: 7.9  },
      { field_key: 'mf_ret_gt236',    answer_value: '0.3',  answer_numeric: 0.3  },
    ],
  })

  // ── 8. Finished Product: Bituminous ───────────────────────────────────────
  console.log('\nFinished Product → Bituminous')

  await submitTest('Permatec LI — full results', {
    categoryCode: 'finished_product',
    materialCode: 'fp_bituminous',
    productCode:  'fp_permatec_li',
    responses: [
      { field_key: 'fp_bit_pen_1',         answer_value: '28',   answer_numeric: 28   },
      { field_key: 'fp_bit_pen_2',         answer_value: '29',   answer_numeric: 29   },
      { field_key: 'fp_bit_pen_3',         answer_value: '28',   answer_numeric: 28   },
      { field_key: 'fp_bit_pen_mean',      answer_value: '28.3', answer_numeric: 28.3 },
      { field_key: 'fp_bit_cone_pen_1',    answer_value: '52',   answer_numeric: 52   },
      { field_key: 'fp_bit_cone_pen_2',    answer_value: '53',   answer_numeric: 53   },
      { field_key: 'fp_bit_cone_pen_3',    answer_value: '52',   answer_numeric: 52   },
      { field_key: 'fp_bit_cone_pen_mean', answer_value: '52.3', answer_numeric: 52.3 },
      { field_key: 'fp_bit_sp',            answer_value: '62',   answer_numeric: 62   },
      { field_key: 'fp_bit_float',         answer_value: 'Okay'  },
      { field_key: 'fp_bit_resilience',    answer_value: '58',   answer_numeric: 58   },
    ],
  })

  await submitTest('PSB — sticky float flag', {
    categoryCode: 'finished_product',
    materialCode: 'fp_bituminous',
    productCode:  'fp_psb',
    responses: [
      { field_key: 'fp_bit_pen_1',         answer_value: '31',   answer_numeric: 31   },
      { field_key: 'fp_bit_pen_2',         answer_value: '30',   answer_numeric: 30   },
      { field_key: 'fp_bit_pen_3',         answer_value: '31',   answer_numeric: 31   },
      { field_key: 'fp_bit_pen_mean',      answer_value: '30.7', answer_numeric: 30.7 },
      { field_key: 'fp_bit_cone_pen_1',    answer_value: '55',   answer_numeric: 55   },
      { field_key: 'fp_bit_cone_pen_2',    answer_value: '56',   answer_numeric: 56   },
      { field_key: 'fp_bit_cone_pen_3',    answer_value: '55',   answer_numeric: 55   },
      { field_key: 'fp_bit_cone_pen_mean', answer_value: '55.3', answer_numeric: 55.3 },
      { field_key: 'fp_bit_sp',            answer_value: '59',   answer_numeric: 59   },
      { field_key: 'fp_bit_float',         answer_value: 'Sticky'},
      { field_key: 'fp_bit_resilience',    answer_value: '55',   answer_numeric: 55   },
    ],
  })

  // ── 9. Finished Product: Mastic Asphalt Paving ────────────────────────────
  console.log('\nFinished Product → Mastic Asphalt Paving')

  await submitTest('Permapark Paving 35% 6mm — composition 2', {
    categoryCode: 'finished_product',
    materialCode: 'fp_ma_paving',
    productCode:  'fp_permapark_35_6',
    responses: [
      { field_key: 'c2_indentation',    answer_value: '1.2',   answer_numeric: 1.2   },
      { field_key: 'c2_total_mass',     answer_value: '1000',  answer_numeric: 1000  },
      { field_key: 'c2_aliquot_vol',    answer_value: '250',   answer_numeric: 250   },
      { field_key: 'c2_a_flask_binder', answer_value: '182.3', answer_numeric: 182.3 },
      { field_key: 'c2_a_binder',       answer_value: '38.7',  answer_numeric: 38.7  },
      { field_key: 'c2_1_flask',        answer_value: '143.5', answer_numeric: 143.5 },
      { field_key: 'c2_1_flask_binder', answer_value: '182.1', answer_numeric: 182.1 },
      { field_key: 'c2_1_binder',       answer_value: '38.6',  answer_numeric: 38.6  },
      { field_key: 'c2_mean_binder',    answer_value: '38.65', answer_numeric: 38.65 },
      { field_key: 'c2_soluble_binder', answer_value: '15.46', answer_numeric: 15.46 },
      { field_key: 'c2_ret_14',         answer_value: '0',     answer_numeric: 0     },
      { field_key: 'c2_ret_10',         answer_value: '0',     answer_numeric: 0     },
      { field_key: 'c2_ret_63',         answer_value: '3.2',   answer_numeric: 3.2   },
      { field_key: 'c2_ret_40',         answer_value: '12.1',  answer_numeric: 12.1  },
      { field_key: 'c2_ret_335',        answer_value: '24.5',  answer_numeric: 24.5  },
      { field_key: 'c2_ret_236',        answer_value: '38.2',  answer_numeric: 38.2  },
      { field_key: 'c2_ret_20',         answer_value: '48.7',  answer_numeric: 48.7  },
      { field_key: 'c2_ret_06',         answer_value: '68.4',  answer_numeric: 68.4  },
      { field_key: 'c2_ret_025',        answer_value: '82.1',  answer_numeric: 82.1  },
      { field_key: 'c2_ret_0212',       answer_value: '86.3',  answer_numeric: 86.3  },
      { field_key: 'c2_ret_0075',       answer_value: '96.8',  answer_numeric: 96.8  },
      { field_key: 'c2_ret_0063',       answer_value: '98.9',  answer_numeric: 98.9  },
      { field_key: 'c2_ret_pan',        answer_value: '100',   answer_numeric: 100   },
    ],
  })

  // ── 10. Finished Product: Roofing ─────────────────────────────────────────
  console.log('\nFinished Product → Mastic Asphalt Roofing')

  await submitTest('Roofstar — no composition', {
    categoryCode: 'finished_product',
    materialCode: 'fp_ma_roofing',
    productCode:  'fp_roofstar',
    responses: [
      { field_key: 'fp_ma_hardness',       answer_value: '74',   answer_numeric: 74  },
      { field_key: 'fp_ma_float',          answer_value: 'Okay'  },
      { field_key: 'fp_ma_comp_required',  answer_value: 'false' },
    ],
  })

  await submitTest('Permaphalt LI — composition required', {
    categoryCode: 'finished_product',
    materialCode: 'fp_ma_roofing',
    productCode:  'fp_permaphalt_li',
    responses: [
      { field_key: 'fp_ma_hardness',       answer_value: '71',   answer_numeric: 71   },
      { field_key: 'fp_ma_float',          answer_value: 'Okay'  },
      { field_key: 'fp_ma_comp_required',  answer_value: 'true'  },
      { field_key: 'c1_total_mass',        answer_value: '1200',  answer_numeric: 1200  },
      { field_key: 'c1_aliquot_vol',       answer_value: '300',   answer_numeric: 300   },
      { field_key: 'c1_a_flask_binder',    answer_value: '183.2', answer_numeric: 183.2 },
      { field_key: 'c1_a_binder',          answer_value: '40.1',  answer_numeric: 40.1  },
      { field_key: 'c1_1_flask',           answer_value: '143.0', answer_numeric: 143.0 },
      { field_key: 'c1_1_flask_binder',    answer_value: '183.4', answer_numeric: 183.4 },
      { field_key: 'c1_1_binder',          answer_value: '40.4',  answer_numeric: 40.4  },
      { field_key: 'c1_mean_binder',       answer_value: '40.25', answer_numeric: 40.25 },
      { field_key: 'c1_soluble_binder',    answer_value: '13.4',  answer_numeric: 13.4  },
      { field_key: 'c1_ret_14',            answer_value: '0',     answer_numeric: 0     },
      { field_key: 'c1_ret_10',            answer_value: '0',     answer_numeric: 0     },
      { field_key: 'c1_ret_63',            answer_value: '1.8',   answer_numeric: 1.8   },
      { field_key: 'c1_ret_40',            answer_value: '7.2',   answer_numeric: 7.2   },
      { field_key: 'c1_ret_335',           answer_value: '14.6',  answer_numeric: 14.6  },
      { field_key: 'c1_ret_236',           answer_value: '21.3',  answer_numeric: 21.3  },
      { field_key: 'c1_ret_20',            answer_value: '30.1',  answer_numeric: 30.1  },
      { field_key: 'c1_ret_06',            answer_value: '51.4',  answer_numeric: 51.4  },
      { field_key: 'c1_ret_025',           answer_value: '70.8',  answer_numeric: 70.8  },
      { field_key: 'c1_ret_0212',          answer_value: '77.2',  answer_numeric: 77.2  },
      { field_key: 'c1_ret_0075',          answer_value: '93.8',  answer_numeric: 93.8  },
      { field_key: 'c1_ret_0063',          answer_value: '97.4',  answer_numeric: 97.4  },
      { field_key: 'c1_ret_pan',           answer_value: '100',   answer_numeric: 100   },
    ],
  })

  // ── 11. Finished Product: Flooring ────────────────────────────────────────
  console.log('\nFinished Product → Mastic Asphalt Flooring')

  await submitTest('Floorstar 2', {
    categoryCode: 'finished_product',
    materialCode: 'fp_ma_flooring',
    productCode:  'fp_floorstar_2',
    responses: [
      { field_key: 'fp_ma_hardness',      answer_value: '68',  answer_numeric: 68  },
      { field_key: 'fp_ma_float',         answer_value: 'Okay' },
      { field_key: 'fp_ma_comp_required', answer_value: 'false'},
    ],
  })

  // ── 12. Finished Product: Tanking ─────────────────────────────────────────
  console.log('\nFinished Product → Mastic Asphalt Tanking')

  await submitTest('Tankstar', {
    categoryCode: 'finished_product',
    materialCode: 'fp_ma_tanking',
    productCode:  'fp_tankstar',
    responses: [
      { field_key: 'fp_ma_hardness',      answer_value: '73',  answer_numeric: 73  },
      { field_key: 'fp_ma_float',         answer_value: 'Okay' },
      { field_key: 'fp_ma_comp_required', answer_value: 'false'},
      { field_key: 'fp_ma_comments',      answer_value: 'Standard batch' },
    ],
  })

  // ── 13. Other category ────────────────────────────────────────────────────
  console.log('\nOther')

  await submitTest('Other — management notification', {
    categoryCode: 'other',
    materialCode: 'rm_other',
    responses: [
      { field_key: 'other_explanation', answer_value: 'Unusual sample received from site — not covered by standard categories' },
      { field_key: 'mgmt_information',  answer_value: 'Site manager notified via email at 09:45' },
    ],
  })

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log(`✓ Passed: ${passed}`)
  console.log(`✗ Failed: ${failed}`)

  if (errors.length > 0) {
    console.log('\nFailed tests:')
    errors.forEach((e) => console.log(`  • ${e}`))
  } else {
    console.log('\n🎉  All test submissions created successfully!')
    console.log('    Open the dashboard to see the data.')
  }

  console.log('')
}

runAllTests().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

// @ts-nocheck
import { supabaseAdmin } from './supabase'
import type {
  SampleCategory,
  MaterialType,
  Product,
  TestSection,
  Question,
  BranchRule,
  FormState,
} from '@/types'

// ─── Reference data ──────────────────────────────────────────────────────────

export async function getCategories(): Promise<SampleCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('sample_categories')
    .select('*')
    .order('label')
  if (error) throw error
  return data
}

export async function getMaterialTypes(categoryId: string): Promise<MaterialType[]> {
  const { data, error } = await supabaseAdmin
    .from('material_types')
    .select('*')
    .eq('category_id', categoryId)
    .order('label')
  if (error) throw error
  return data
}

export async function getProducts(materialTypeId: string): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('material_type_id', materialTypeId)
    .eq('is_active', true)
    .order('label')
  if (error) throw error
  return data
}

// ─── Form structure ──────────────────────────────────────────────────────────

export async function getAllSectionsWithQuestions(): Promise<TestSection[]> {
  const { data, error } = await supabaseAdmin
    .from('test_sections')
    .select(`
      *,
      questions (*)
    `)
    .order('display_order')
  if (error) throw error

  return (data as TestSection[]).map((section) => ({
    ...section,
    questions: (section.questions ?? [])
      .filter((q) => q.is_active !== false)
      .sort((a, b) => a.display_order - b.display_order),
  }))
}

export async function getBranchRules(): Promise<BranchRule[]> {
  const { data, error } = await supabaseAdmin
    .from('branch_rules')
    .select('*')
  if (error) throw error
  return data
}

// ─── Branch resolution ───────────────────────────────────────────────────────

export function resolveVisibleSections(
  rules: BranchRule[],
  state: Pick<FormState, 'category_id' | 'material_type_id' | 'product_id' | 'answers'>,
  categoryCode: string,
  materialCode: string,
  productCode: string,
): Set<string> {
  const visible = new Set<string>()
  for (const rule of rules) {
    const categoryMatch = !rule.category_code || rule.category_code === categoryCode
    const materialMatch = !rule.material_code || rule.material_code === materialCode
    const productMatch = !rule.product_code || rule.product_code === productCode
    let conditionMatch = true
    if (rule.condition_field && rule.condition_value) {
      const answer = state.answers[rule.condition_field]
      conditionMatch = String(answer) === rule.condition_value
    }
    if (categoryMatch && materialMatch && productMatch && conditionMatch) {
      visible.add(rule.section_id)
    }
  }
  return visible
}

// ─── Submission queries ──────────────────────────────────────────────────────

export async function getSubmissions(filters?: {
  from?: string
  to?: string
  category_id?: string
  status?: string
}) {
  let query = supabaseAdmin
    .from('submissions')
    .select(`
      id,
      unique_id,
      date_of_sample,
      submitted_at,
      status,
      sample_categories!category_id ( label ),
      material_types!material_type_id ( label ),
      products!product_id ( label ),
      users!submitted_by ( full_name )
    `)
    .order('submitted_at', { ascending: false })
    .limit(200)

  if (filters?.from) query = query.gte('date_of_sample', filters.from)
  if (filters?.to) query = query.lte('date_of_sample', filters.to)
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Full read model for a single submission: header + all captured responses
// grouped by their test section (with real question labels and order), any
// exceptions raised against the batch, and any certificates issued for it.
// Used by the submission detail view (/submissions/[id]).
export async function getSubmissionDetail(submissionId: string) {
  // 1. Submission header + reference joins
  const { data: sub, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      *,
      sample_categories!category_id ( label, code ),
      material_types!material_type_id ( label, code ),
      products!product_id ( label, code )
    `)
    .eq('id', submissionId)
    .maybeSingle()
  if (error) throw error
  if (!sub) return null

  // 2. Captured responses
  const { data: resp } = await supabaseAdmin
    .from('responses')
    .select('field_key, answer_value, answer_numeric')
    .eq('submission_id', submissionId)
  const respByKey = Object.fromEntries((resp ?? []).map((r) => [r.field_key, r]))

  // 3. Section/question structure for labels, ordering, and grouping
  const sections = await getAllSectionsWithQuestions()

  const groups: any[] = []
  const usedKeys = new Set<string>()

  for (const section of sections) {
    // Header fields are shown in the header card, not as a data group
    if (section.code === 'header') {
      for (const q of section.questions ?? []) usedKeys.add(q.field_key)
      continue
    }
    const rows: any[] = []
    for (const q of section.questions ?? []) {
      const r = respByKey[q.field_key]
      if (r === undefined) continue
      usedKeys.add(q.field_key)
      rows.push({
        field_key: q.field_key,
        label: q.label ?? q.field_key,
        answer_value: r.answer_value ?? null,
        answer_numeric: r.answer_numeric ?? null,
        question_type: q.question_type ?? null,
        display_order: q.display_order ?? 999,
      })
    }
    if (rows.length) {
      groups.push({
        section_id: section.id,
        section_code: section.code,
        section_label: section.label,
        display_order: section.display_order ?? 999,
        rows: rows.sort((a, b) => a.display_order - b.display_order),
      })
    }
  }

  // Any responses with no matching question (legacy / branch drift) — keep visible
  const orphans = (resp ?? []).filter((r) => !usedKeys.has(r.field_key))
  if (orphans.length) {
    groups.push({
      section_id: '_other',
      section_code: 'other',
      section_label: 'Other captured fields',
      display_order: 9999,
      rows: orphans.map((r) => ({
        field_key: r.field_key,
        label: r.field_key,
        answer_value: r.answer_value ?? null,
        answer_numeric: r.answer_numeric ?? null,
        question_type: null,
        display_order: 999,
      })),
    })
  }

  groups.sort((a, b) => a.display_order - b.display_order)

  // 4. Exceptions raised against this submission
  const { data: exc } = await supabaseAdmin
    .from('exceptions')
    .select(`
      id, field_key, answer_value, spec_min, spec_max,
      severity, trigger_type, resolved, created_at,
      questions!question_id ( label )
    `)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })

  // 5. Certificates issued for this submission
  const { data: certs } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_number, overall_pass, version, superseded, issued_at, issued_by')
    .eq('submission_id', submissionId)
    .order('version', { ascending: false })

  return {
    submission: {
      ...sub,
      submitted_by_name: sub.submitted_by ?? null,
      category: sub.sample_categories?.label ?? null,
      category_code: sub.sample_categories?.code ?? null,
      material: sub.material_types?.label ?? null,
      material_code: sub.material_types?.code ?? null,
      product: sub.products?.label ?? null,
      product_code: sub.products?.code ?? null,
    },
    groups,
    exceptions: exc ?? [],
    certificates: certs ?? [],
    response_count: (resp ?? []).length,
  }
}

// Loads a submission in a shape ready to re-populate the form: the cascading
// selection (ids + codes for branch resolution) plus a flat answers map merged
// from the captured responses and the authoritative header columns. Used by the
// submit page when resuming a draft (?draft=) or editing a record (?edit=).
export async function getSubmissionForEdit(submissionId: string) {
  const { data: sub, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      id, status, category_id, material_type_id, product_id,
      unique_id, date_of_sample, time_taken, sampled_by, tested_by,
      sample_categories!category_id ( code ),
      material_types!material_type_id ( code ),
      products!product_id ( code )
    `)
    .eq('id', submissionId)
    .maybeSingle()
  if (error) throw error
  if (!sub) return null

  const { data: resp } = await supabaseAdmin
    .from('responses')
    .select('field_key, answer_value')
    .eq('submission_id', submissionId)

  const answers: Record<string, string> = {}
  for (const r of resp ?? []) {
    if (r.answer_value !== null && r.answer_value !== undefined) {
      answers[r.field_key] = r.answer_value
    }
  }

  // Header columns are authoritative over any duplicated response rows
  answers['date_of_sample'] = sub.date_of_sample ?? ''
  answers['time_taken'] = sub.time_taken ?? ''
  answers['sampled_by'] = sub.sampled_by ?? ''
  answers['tested_by'] = sub.tested_by ?? ''

  // A draft's auto-generated placeholder id shouldn't be shown back to the user
  const isPlaceholder =
    sub.status === 'draft' &&
    typeof sub.unique_id === 'string' &&
    sub.unique_id.startsWith('DRAFT-')
  answers['unique_id'] = isPlaceholder ? '' : (sub.unique_id ?? '')

  return {
    submissionId: sub.id,
    status: sub.status,
    categoryId: sub.category_id ?? '',
    categoryCode: sub.sample_categories?.code ?? '',
    materialTypeId: sub.material_type_id ?? '',
    materialCode: sub.material_types?.code ?? '',
    productId: sub.product_id ?? '',
    productCode: sub.products?.code ?? '',
    answers,
  }
}

// Edit audit trail for a submission. Returns [] (rather than throwing) if the
// submission_edits table has not yet been created, so the detail view is safe
// to deploy before the migration is run.
export async function getSubmissionEdits(submissionId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('submission_edits')
      .select('id, edited_by, comment, prev_status, edited_at')
      .eq('submission_id', submissionId)
      .order('edited_at', { ascending: false })
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getExceptions(filters?: { resolved?: boolean; severity?: string }) {
  let query = supabaseAdmin
    .from('exceptions')
    .select(`
      *,
      questions!question_id ( label ),
      submissions!submission_id ( unique_id, date_of_sample )
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (filters?.resolved !== undefined) query = query.eq('resolved', filters.resolved)
  if (filters?.severity) query = query.eq('severity', filters.severity)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getDashboardSummary(from?: string, to?: string) {
  const { data, error } = await supabaseAdmin.rpc('get_submission_summary', {
    p_from: from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    p_to: to ?? new Date().toISOString().split('T')[0],
  })
  if (error) throw error
  return data
}

// ─── Moisture series (raw deliveries) ────────────────────────────────────────

export async function getMoistureSeries(from?: string, to?: string) {
  const f = from ?? '2026-01-01'
  const t = to ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabaseAdmin
    .from('responses')
    .select(`
      answer_numeric,
      field_key,
      submissions (
        date_of_sample,
        material_types!material_type_id ( label, code ),
        products!product_id ( label, code )
      )
    `)
    .in('field_key', ['agg6_moisture', 'agg10_moisture', 'mf_moisture'])
    .not('answer_numeric', 'is', null)

  if (error) throw error

  return (data ?? [])
    .map((r: any) => ({
      date: r.submissions?.date_of_sample as string,
      material: r.submissions?.material_types?.label ?? '—',
      material_code: r.submissions?.material_types?.code ?? '',
      product: r.submissions?.products?.label ?? '—',
      product_code: r.submissions?.products?.code ?? '',
      value: Number(r.answer_numeric),
    }))
    .filter((r) => r.date && r.date >= f && r.date <= t)
}

// ─── Certificates ────────────────────────────────────────────────────────────

function buildParam(field_key, spec_min, spec_max, standard, qByKey, respByKey) {
  const q = qByKey[field_key]
  const r = respByKey[field_key]
  const value = r && r.answer_numeric != null ? Number(r.answer_numeric) : null
  let pass = null
  if (value != null) {
    const okMin = spec_min == null || value >= Number(spec_min)
    const okMax = spec_max == null || value <= Number(spec_max)
    pass = okMin && okMax
  }
  return {
    field_key,
    label: q?.label ?? field_key,
    value,
    answer_value: r?.answer_value ?? null,
    spec_min: spec_min != null ? Number(spec_min) : null,
    spec_max: spec_max != null ? Number(spec_max) : null,
    standard: standard ?? null,
    display_order: q?.display_order ?? 999,
    pass,
  }
}

// Builds the full Certificate-of-Analysis model for one submission (one batch):
// its product's specs (with governing standard) joined to the captured results,
// grouped by standard, with pass/fail per parameter and an overall verdict.
export async function getCertificateModel(submissionId: string) {
  const { data: sub, error: e1 } = await supabaseAdmin
    .from('submissions')
    .select(`
      id, unique_id, date_of_sample, time_taken, sampled_by, tested_by, reviewed_by,
      customer, site, batch_number, ticket_url, analysis_type, category_hc, type_pv, delivery_temp, status,
      sample_categories!category_id ( label ),
      material_types!material_type_id ( label, code ),
      products!product_id ( code, label )
    `)
    .eq('id', submissionId)
    .single()
  if (e1) throw e1
  if (!sub) return null

  const productCode = sub.products?.code ?? null

  const { data: resp } = await supabaseAdmin
    .from('responses')
    .select('field_key, answer_value, answer_numeric')
    .eq('submission_id', submissionId)
  const respByKey = Object.fromEntries((resp ?? []).map((r) => [r.field_key, r]))

  let pspecs: any[] = []
  if (productCode) {
    const { data } = await supabaseAdmin
      .from('product_specs')
      .select('field_key, spec_min, spec_max, standard')
      .eq('product_code', productCode)
    pspecs = data ?? []
  }

  const fieldKeys = Array.from(new Set([
    ...pspecs.map((p) => p.field_key),
    ...(resp ?? []).map((r) => r.field_key),
  ]))
  const { data: qs } = await supabaseAdmin
    .from('questions')
    .select('field_key, label, spec_min, spec_max, display_order')
    .in('field_key', fieldKeys.length ? fieldKeys : ['__none__'])
  const qByKey = Object.fromEntries((qs ?? []).map((q) => [q.field_key, q]))

  const pspecKeys = new Set(pspecs.map((p) => p.field_key))
  const params: any[] = []

  // Product-specific specs (carry the standard) take precedence
  for (const ps of pspecs) {
    params.push(buildParam(ps.field_key, ps.spec_min, ps.spec_max, ps.standard, qByKey, respByKey))
  }
  // Global question specs (aggregate/filler/rubber) for any fields not product-specced
  for (const q of qs ?? []) {
    if (pspecKeys.has(q.field_key)) continue
    if (q.spec_min == null && q.spec_max == null) continue
    params.push(buildParam(q.field_key, q.spec_min, q.spec_max, null, qByKey, respByKey))
  }

  const groupsMap: Record<string, any[]> = {}
  for (const p of params) {
    const key = p.standard ?? 'Other tests'
    ;(groupsMap[key] ??= []).push(p)
  }
  const groups = Object.entries(groupsMap).map(([standard, list]) => ({
    standard,
    params: list.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)),
  }))

  const tested = params.filter((p) => p.value != null)
  const failures = tested.filter((p) => p.pass === false).length
  const overall_pass = tested.length > 0 && failures === 0
  const incomplete = params.some((p) => p.value == null)

  const byKey = {}
  for (const r of resp ?? []) {
    byKey[r.field_key] = {
      label: qByKey[r.field_key]?.label ?? r.field_key,
      value: r.answer_numeric != null ? Number(r.answer_numeric) : null,
      answer_value: r.answer_value ?? null,
    }
  }
  const paramByKey = {}
  for (const p of params) {
    paramByKey[p.field_key] = { spec_min: p.spec_min, spec_max: p.spec_max, pass: p.pass, label: p.label, standard: p.standard }
  }
  const compositionPrefix = byKey['c1_total_mass'] ? 'c1' : byKey['c2_total_mass'] ? 'c2' : null

  return {
    submission: {
      id: sub.id,
      unique_id: sub.unique_id,
      batch_number: sub.batch_number ?? sub.ticket_url ?? null,
      date_of_sample: sub.date_of_sample,
      time_taken: sub.time_taken,
      sampled_by: sub.sampled_by,
      tested_by: sub.tested_by,
      reviewed_by: sub.reviewed_by,
      customer: sub.customer,
      site: sub.site,
      analysis_type: sub.analysis_type,
      category_hc: sub.category_hc,
      type_pv: sub.type_pv,
      delivery_temp: sub.delivery_temp,
      status: sub.status,
      category: sub.sample_categories?.label ?? null,
      material: sub.material_types?.label ?? null,
      material_code: sub.material_types?.code ?? null,
      product_code: productCode,
      product: sub.products?.label ?? null,
    },
    groups,
    overall_pass,
    failures,
    incomplete,
    param_count: params.length,
    tested_count: tested.length,
    byKey,
    paramByKey,
    compositionPrefix,
  }
}

// Recent finished-product submissions, with any issued certificate numbers,
// to drive the "certify a batch" list.
export async function getCertifiableSubmissions() {
  const { data } = await supabaseAdmin
    .from('submissions')
    .select(`
      id, unique_id, batch_number, date_of_sample, status,
      material_types!material_type_id ( label ),
      products!product_id ( label, code ),
      sample_categories!category_id ( code, label ),
      certificates ( certificate_number )
    `)
    .order('submitted_at', { ascending: false })
    .limit(150)
  return (data ?? []).filter((s) => s.sample_categories?.code === 'finished_product')
}

export async function getCertificates() {
  const { data } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_number, product_label, batch_number, overall_pass, issued_at, issued_by, submission_id, version, superseded')
    .order('issued_at', { ascending: false })
    .limit(300)
  return data ?? []
}

export async function getCertificatesForSubmission(submissionId: string) {
  const { data } = await supabaseAdmin
    .from('certificates')
    .select('id, certificate_number, overall_pass, version, superseded, issued_at, issued_by')
    .eq('submission_id', submissionId)
    .order('version', { ascending: false })
  return data ?? []
}

// Current (non-superseded) certificate for a submission, including its immutable
// snapshot — used to render the issued PDF document.
export async function getCurrentCertificate(submissionId: string) {
  const { data } = await supabaseAdmin
    .from('certificates')
    .select('certificate_number, issued_at, issued_by, overall_pass, version, snapshot')
    .eq('submission_id', submissionId)
    .eq('superseded', false)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

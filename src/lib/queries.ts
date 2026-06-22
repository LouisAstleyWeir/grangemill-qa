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

  // Sort questions within each section
  return (data as TestSection[]).map((section) => ({
    ...section,
    questions: (section.questions ?? []).sort((a, b) => a.display_order - b.display_order),
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
// Given the current form state, returns the set of section codes that should be visible

export function resolveVisibleSections(
  rules: BranchRule[],
  state: Pick<FormState, 'category_id' | 'material_type_id' | 'product_id' | 'answers'>,
  categoryCode: string,
  materialCode: string,
  productCode: string,
): Set<string> {
  // We need the section_id → code mapping, so this is done in the component
  // This helper returns visible section IDs
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

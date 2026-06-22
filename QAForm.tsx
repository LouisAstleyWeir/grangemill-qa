// ─── Reference types ────────────────────────────────────────────────────────

export interface SampleCategory {
  id: string
  code: string
  label: string
}

export interface MaterialType {
  id: string
  category_id: string
  code: string
  label: string
}

export interface Product {
  id: string
  material_type_id: string
  code: string
  label: string
}

// ─── Form structure ──────────────────────────────────────────────────────────

export type QuestionType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'boolean'

export interface Question {
  id: string
  section_id: string
  form_q_number: number | null
  field_key: string
  label: string
  question_type: QuestionType
  options: string[] | null
  is_required: boolean
  spec_min: number | null
  spec_max: number | null
  display_order: number
  help_text: string | null
}

export interface TestSection {
  id: string
  code: string
  label: string
  display_order: number
  questions?: Question[]
}

export interface BranchRule {
  id: string
  section_id: string
  category_code: string | null
  material_code: string | null
  product_code: string | null
  condition_field: string | null
  condition_value: string | null
  notes: string | null
}

// ─── Submission types ────────────────────────────────────────────────────────

export interface SubmissionPayload {
  category_id: string
  material_type_id: string
  product_id: string | null
  unique_id: string
  date_of_sample: string
  time_taken: string | null
  sampled_by: string
  tested_by: string
  ticket_url: string | null
  notes: string | null
}

export interface ResponsePayload {
  question_id: string
  field_key: string
  answer_value: string | null
  answer_numeric: number | null
}

export interface SubmissionWithMeta {
  id: string
  unique_id: string
  date_of_sample: string
  submitted_at: string
  status: string
  category: { label: string }
  material_type: { label: string }
  product: { label: string } | null
  submitted_by_user: { full_name: string } | null
  exception_count: number
}

// ─── Exception types ─────────────────────────────────────────────────────────

export interface Exception {
  id: string
  submission_id: string
  field_key: string
  trigger_type: 'out_of_spec' | 'manual_flag'
  severity: 'low' | 'medium' | 'high'
  answer_value: string | null
  spec_min: number | null
  spec_max: number | null
  notes: string | null
  resolved: boolean
  created_at: string
  question: { label: string } | null
  submission: { unique_id: string; date_of_sample: string } | null
}

// ─── Form state (client) ─────────────────────────────────────────────────────

export interface FormState {
  category_id: string
  material_type_id: string
  product_id: string
  answers: Record<string, string | string[]>
}

// ─── Database placeholder (expand with Supabase CLI generate) ────────────────

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>
    Functions: Record<string, unknown>
  }
}

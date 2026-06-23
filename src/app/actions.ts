// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export interface SubmitFormData {
  submission: {
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
  responses: {
    question_id: string
    field_key: string
    answer_value: string | null
    answer_numeric: number | null
  }[]
}

export interface SubmitResult {
  success: boolean
  submissionId?: string
  error?: string
}

export async function submitQAForm(data: SubmitFormData): Promise<SubmitResult> {
  try {
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .insert(data.submission)
      .select('id')
      .single()

    if (subError || !submission) {
      console.error('Submission insert error:', subError)
      return { success: false, error: 'Failed to save submission. Please try again.' }
    }

    const submissionId = submission.id

    const responsesWithId = data.responses
      .filter((r) => r.answer_value !== null && r.answer_value !== '')
      .map((r) => ({
        submission_id: submissionId,
        question_id: r.question_id,
        field_key: r.field_key,
        answer_value: r.answer_value,
        answer_numeric: r.answer_numeric,
      }))

    if (responsesWithId.length > 0) {
      const { error: respError } = await supabaseAdmin
        .from('responses')
        .insert(responsesWithId)

      if (respError) {
        console.error('Response insert error:', respError)
        await supabaseAdmin.from('submissions').delete().eq('id', submissionId)
        return { success: false, error: 'Failed to save test results. Please try again.' }
      }
    }

    const { error: excError } = await supabaseAdmin.rpc(
      'raise_out_of_spec_exceptions',
      { p_submission_id: submissionId }
    )

    if (excError) {
      console.error('Exception detection error:', excError)
    }

    revalidatePath('/')
    revalidatePath('/submissions')
    revalidatePath('/exceptions')
    revalidatePath('/reports')

    return { success: true, submissionId }
  } catch (err) {
    console.error('Unexpected submission error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

export async function resolveException(
  exceptionId: string,
  resolvedBy: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('exceptions')
    .update({
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', exceptionId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/exceptions')

  return { success: true }
}

export async function logReportRun(
  runBy: string,
  reportType: string,
  filters: Record<string, unknown>,
  rowCount: number
) {
  await supabaseAdmin.from('report_runs').insert({
    run_by: runBy,
    report_type: reportType,
    filters_json: filters,
    row_count: rowCount,
  })
}

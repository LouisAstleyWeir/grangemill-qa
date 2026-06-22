'use server'

import { supabaseAdmin } from '@/lib/supabase'
import type { ResponsePayload, SubmissionPayload } from '@/types'

export interface SubmitFormData {
  submission: SubmissionPayload
  responses: ResponsePayload[]
}

export interface SubmitResult {
  success: boolean
  submissionId?: string
  error?: string
}

export async function submitQAForm(data: SubmitFormData): Promise<SubmitResult> {
  try {
    // 1. Insert submission
    const { data: submission, error: subError } = await supabaseAdmin
  .from('submissions')
  .insert(data.submission as never)
  .select('id')
  .single()

    if (subError || !submission) {
      console.error('Submission insert error:', subError)
      return { success: false, error: 'Failed to save submission. Please try again.' }
    }

    const submissionId = submission.id

    // 2. Insert all responses
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
  .insert(responsesWithId as never)

      if (respError) {
        console.error('Response insert error:', respError)
        // Roll back submission
        await supabaseAdmin.from('submissions').delete().eq('id', submissionId)
        return { success: false, error: 'Failed to save test results. Please try again.' }
      }
    }

    // 3. Auto-raise out-of-spec exceptions
    const { error: excError } = await supabaseAdmin.rpc(
      'raise_out_of_spec_exceptions',
      { p_submission_id: submissionId }
    )

    if (excError) {
      // Non-fatal — submission saved, exceptions can be reviewed manually
      console.error('Exception detection error:', excError)
    }

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


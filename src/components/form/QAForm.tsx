'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { TestSection, BranchRule, SampleCategory, Question } from '@/types'
import { submitQAForm, saveDraft, updateSubmission } from '@/app/actions'
import QuestionField from './QuestionField'
import SampleSelector from './SampleSelector'

type FormMode = 'new' | 'draft' | 'edit'

interface InitialData {
  submissionId: string
  status: string
  categoryId: string
  categoryCode: string
  materialTypeId: string
  materialCode: string
  productId: string
  productCode: string
  answers: Record<string, string>
}

interface Props {
  sections: TestSection[]
  branchRules: BranchRule[]
  categories: SampleCategory[]
  initialData?: InitialData | null
  mode?: FormMode
}

export default function QAForm({
  sections,
  branchRules,
  categories,
  initialData = null,
  mode = 'new',
}: Props) {
  const router = useRouter()

  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initialData?.answers ?? {})
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '')
  const [materialTypeId, setMaterialTypeId] = useState(initialData?.materialTypeId ?? '')
  const [productId, setProductId] = useState(initialData?.productId ?? '')
  const [categoryCode, setCategoryCode] = useState(initialData?.categoryCode ?? '')
  const [materialCode, setMaterialCode] = useState(initialData?.materialCode ?? '')
  const [productCode, setProductCode] = useState(initialData?.productCode ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Identity of the record being worked on (if any)
  const loadedId = initialData?.submissionId ?? null
  const editId = mode === 'edit' ? loadedId : null

  // Draft id drives "update this row" for draft saves and "promote not insert"
  // for final submission.
  const [draftId, setDraftId] = useState<string | null>(mode === 'draft' ? loadedId : null)

  // Edit-mode audit fields
  const [editorName, setEditorName] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editErrors, setEditErrors] = useState<{ editorName?: string; editComment?: string }>({})

  const visibleSectionIds = useCallback((): Set<string> => {
    const visible = new Set<string>()
    for (const rule of branchRules) {
      const catMatch = !rule.category_code || rule.category_code === categoryCode
      const matMatch = !rule.material_code || rule.material_code === materialCode

      const prodMatch = !rule.product_code
        ? true
        : productCode !== '' && rule.product_code === productCode

      let condMatch = true
      if (rule.condition_field && rule.condition_value) {
        const ans = answers[rule.condition_field]
        condMatch = String(ans) === rule.condition_value
      }

      if (catMatch && matMatch && prodMatch && condMatch) {
        visible.add(rule.section_id)
      }
    }
    return visible
  }, [branchRules, categoryCode, materialCode, productCode, answers])

  const visibleIds = visibleSectionIds()

  const visibleSections = sections.filter(
    (s) => s.code === 'header' || visibleIds.has(s.id)
  )

  const handleAnswer = (fieldKey: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }))
    setErrors((prev) => { const n = { ...prev }; delete n[fieldKey]; return n })
  }

  const buildPayload = () => {
    const allQuestions: Question[] = visibleSections.flatMap((s) => s.questions ?? [])
    const responses = allQuestions
      .filter((q) => q.field_key !== 'ticket_upload')
      .map((q) => {
        const val = answers[q.field_key]
        const strVal = Array.isArray(val) ? val.join(', ') : (val ?? null)
        const numVal = q.question_type === 'number' && strVal ? parseFloat(strVal) : null
        return {
          question_id: q.id,
          field_key: q.field_key,
          answer_value: strVal,
          answer_numeric: isNaN(numVal as number) ? null : numVal,
        }
      })
      .filter((r) => r.answer_value !== null)

    return {
      submission: {
        category_id: categoryId,
        material_type_id: materialTypeId,
        product_id: productId || null,
        unique_id: String(answers['unique_id'] ?? ''),
        date_of_sample: String(answers['date_of_sample'] ?? ''),
        time_taken: String(answers['time_taken'] ?? '') || null,
        sampled_by: String(answers['sampled_by'] ?? ''),
        tested_by: String(answers['tested_by'] ?? ''),
        ticket_url: null,
        notes: null,
      },
      responses,
    }
  }

  const resetForm = () => {
    setAnswers({})
    setCategoryId(''); setCategoryCode('')
    setMaterialTypeId(''); setMaterialCode('')
    setProductId(''); setProductCode('')
    setDraftId(null)
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    const headerRequired: Record<string, string> = {
      date_of_sample: 'Date of sample',
      time_taken: 'Time taken',
      sampled_by: 'Sampled by',
      tested_by: 'Tested by',
      unique_id: 'Unique identification number',
    }
    for (const [key, label] of Object.entries(headerRequired)) {
      const val = answers[key]
      if (!val || val === '') newErrors[key] = `${label} is required`
    }

    if (!categoryId)     newErrors['_category'] = 'Please select a category'
    if (!materialTypeId) newErrors['_material'] = 'Please select a material type'

    for (const section of visibleSections) {
      if (section.code === 'header') continue
      for (const q of section.questions ?? []) {
        if (!q.is_required) continue
        if (q.field_key === 'ticket_upload') continue

        if (q.field_key.startsWith('bit_pen_') && q.field_key !== 'bit_pen_required') {
          if (answers['bit_pen_required'] === 'false') continue
        }
        if (q.field_key === 'bit_sp') {
          if (answers['bit_sp_required'] === 'false') continue
        }
        if (q.field_key.startsWith('bb_corr_') && q.field_key !== 'bb_corrected') {
          if (answers['bb_corrected'] !== 'true') continue
        }

        if (Object.keys(headerRequired).includes(q.field_key)) continue

        const val = answers[q.field_key]
        const isEmpty = val === undefined || val === null || val === '' ||
          (Array.isArray(val) && val.length === 0)

        if (isEmpty) {
          newErrors[q.field_key] = `${q.label} is required`
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!categoryId || !materialTypeId) {
      setResult({ success: false, message: 'Choose a category and material type before saving a draft.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSavingDraft(true)
    setResult(null)

    const res = await saveDraft(buildPayload(), draftId || undefined)

    setSavingDraft(false)

    if (res.success) {
      setDraftId(res.submissionId ?? null)
      setResult({ success: true, message: 'Draft saved — you can leave this and finish it later from Submissions.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setResult({ success: false, message: res.error ?? 'Failed to save draft.' })
    }
  }

  const handleSaveChanges = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const ae: { editorName?: string; editComment?: string } = {}
    if (!editorName.trim()) ae.editorName = 'Required'
    if (!editComment.trim()) ae.editComment = 'Required'
    setEditErrors(ae)
    if (Object.keys(ae).length > 0) {
      setResult({ success: false, message: 'Add your name and a reason for the edit before saving.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setResult(null)

    const res = await updateSubmission(editId as string, buildPayload(), {
      editorName: editorName.trim(),
      comment: editComment.trim(),
    })

    setSubmitting(false)

    if (res.success) {
      router.push(`/submissions/${editId}`)
    } else {
      setResult({ success: false, message: res.error ?? 'Failed to save the edit.' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'edit') {
      await handleSaveChanges()
      return
    }

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setResult(null)

    const res = await submitQAForm(buildPayload(), draftId || undefined)

    setSubmitting(false)

    if (res.success) {
      if (loadedId) {
        router.push(`/submissions/${res.submissionId}`)
        return
      }
      setResult({ success: true, message: `Submission saved · ID: ${res.submissionId}` })
      resetForm()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setResult({ success: false, message: res.error ?? 'Unknown error' })
    }
  }

  const errorCount = Object.keys(errors).length
  const busy = submitting || savingDraft
  const primaryLabel = mode === 'edit' ? 'Save changes' : 'Save submission'

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 'var(--max-w-form)' }} noValidate>
      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: '1.5rem' }}>
          {result.success ? '✓ ' : '✕ '}{result.message}
        </div>
      )}

      {mode === 'draft' && (
        <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
          Finishing a saved draft. It won’t become a finished submission until you select “Save submission”.
        </div>
      )}

      {mode === 'edit' && (
        <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
          Editing a finished submission. Your name and the reason for the change will be recorded against this record.
        </div>
      )}

      {errorCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {errorCount} field{errorCount > 1 ? 's' : ''} need attention before saving.
        </div>
      )}

      {mode === 'edit' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="section-header" style={{ margin: 0, flex: 1 }}>
              <div className="section-number">!</div>
              <h2>Edit details (required)</h2>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Edited by <span className="required">*</span></label>
                <input
                  type="text"
                  value={editorName}
                  onChange={(e) => { setEditorName(e.target.value); setEditErrors((p) => ({ ...p, editorName: undefined })) }}
                  placeholder="Your name"
                  className={editErrors.editorName ? 'error' : ''}
                />
                {editErrors.editorName && <span style={{ color: 'var(--c-danger)', fontSize: '0.8125rem' }}>{editErrors.editorName}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Reason for edit <span className="required">*</span></label>
                <textarea
                  value={editComment}
                  onChange={(e) => { setEditComment(e.target.value); setEditErrors((p) => ({ ...p, editComment: undefined })) }}
                  placeholder="Why is this record being amended?"
                  className={editErrors.editComment ? 'error' : ''}
                />
                {editErrors.editComment && <span style={{ color: 'var(--c-danger)', fontSize: '0.8125rem' }}>{editErrors.editComment}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <SampleSelector
        categories={categories}
        categoryId={categoryId}
        materialTypeId={materialTypeId}
        productId={productId}
        answers={answers}
        onAnswer={(key, val) => handleAnswer(key, val)}
        onCategoryChange={(id, code) => {
          setCategoryId(id); setCategoryCode(code)
          setMaterialTypeId(''); setMaterialCode('')
          setProductId(''); setProductCode('')
        }}
        onMaterialChange={(id, code) => {
          setMaterialTypeId(id); setMaterialCode(code)
          setProductId(''); setProductCode('')
        }}
        onProductChange={(id, code) => {
          setProductId(id); setProductCode(code)
        }}
        errors={errors}
      />

      {visibleSections.map((section, idx) => {
        if (section.code === 'header') return null

        const questions = section.questions ?? []
        if (questions.length === 0) return null

        return (
          <div key={section.id} className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="section-header" style={{ margin: 0, flex: 1 }}>
                <div className="section-number">{idx + 1}</div>
                <h2>{section.label}</h2>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {questions.map((q) => (
                  <QuestionField
                    key={q.id}
                    question={q}
                    value={answers[q.field_key]}
                    onChange={(val) => handleAnswer(q.field_key, val)}
                    error={errors[q.field_key]}
                    allAnswers={answers}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {categoryId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '3rem' }}>
          {mode === 'edit' ? (
            <Link
              href={`/submissions/${editId}`}
              className="btn btn-secondary btn-lg"
            >
              Cancel
            </Link>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  if (confirm('Clear all answers and start again?')) {
                    resetForm()
                  }
                }}
                disabled={busy}
              >
                Clear form
              </button>
              <button
                type="button"
                className="btn btn-navy btn-lg"
                onClick={handleSaveDraft}
                disabled={busy}
                title="Save progress and finish later"
              >
                {savingDraft ? 'Saving…' : 'Save draft'}
              </button>
            </>
          )}
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {submitting ? 'Saving…' : primaryLabel}
          </button>
        </div>
      )}
    </form>
  )
}

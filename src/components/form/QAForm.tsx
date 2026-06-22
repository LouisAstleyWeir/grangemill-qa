'use client'

import { useState, useCallback } from 'react'
import type { TestSection, BranchRule, SampleCategory, Question } from '@/types'
import { submitQAForm } from '@/app/actions'
import QuestionField from './QuestionField'
import SampleSelector from './SampleSelector'

interface Props {
  sections: TestSection[]
  branchRules: BranchRule[]
  categories: SampleCategory[]
}

export default function QAForm({ sections, branchRules, categories }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [categoryId, setCategoryId] = useState('')
  const [materialTypeId, setMaterialTypeId] = useState('')
  const [productId, setProductId] = useState('')
  const [categoryCode, setCategoryCode] = useState('')
  const [materialCode, setMaterialCode] = useState('')
  const [productCode, setProductCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const visibleSectionIds = useCallback((): Set<string> => {
    const visible = new Set<string>()
    for (const rule of branchRules) {
      const catMatch  = !rule.category_code  || rule.category_code  === categoryCode
      const matMatch  = !rule.material_code  || rule.material_code  === materialCode
      const prodMatch = !rule.product_code   || rule.product_code   === productCode

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Header fields always required
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

    // Validate visible section questions
    for (const section of visibleSections) {
      if (section.code === 'header') continue
      for (const q of section.questions ?? []) {
        if (!q.is_required) continue
        if (q.field_key === 'ticket_upload') continue

        // Skip conditionally hidden sub-questions
        if (q.field_key.startsWith('bit_pen_') && q.field_key !== 'bit_pen_required') {
          if (answers['bit_pen_required'] === 'false') continue
        }
        if (q.field_key === 'bit_sp') {
          if (answers['bit_sp_required'] === 'false') continue
        }
        if (q.field_key.startsWith('bb_corr_') && q.field_key !== 'bb_corrected') {
          if (answers['bb_corrected'] !== 'true') continue
        }

        // Skip header field keys already validated above
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setResult(null)

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

    const res = await submitQAForm({
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
    })

    setSubmitting(false)

    if (res.success) {
      setResult({ success: true, message: `Submission saved · ID: ${res.submissionId}` })
      setAnswers({})
      setCategoryId(''); setCategoryCode('')
      setMaterialTypeId(''); setMaterialCode('')
      setProductId(''); setProductCode('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setResult({ success: false, message: res.error ?? 'Unknown error' })
    }
  }

  const errorCount = Object.keys(errors).length

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 'var(--max-w-form)' }} noValidate>
      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: '1.5rem' }}>
          {result.success ? '✓ ' : '✕ '}{result.message}
        </div>
      )}

      {errorCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {errorCount} field{errorCount > 1 ? 's' : ''} need attention before saving.
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
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => {
              if (confirm('Clear all answers and start again?')) {
                setAnswers({})
                setCategoryId(''); setCategoryCode('')
                setMaterialTypeId(''); setMaterialCode('')
                setProductId(''); setProductCode('')
                setErrors({})
              }
            }}
          >
            Clear form
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save submission'}
          </button>
        </div>
      )}
    </form>
  )
}

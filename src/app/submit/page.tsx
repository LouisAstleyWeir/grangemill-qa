// @ts-nocheck
import {
  getAllSectionsWithQuestions,
  getBranchRules,
  getCategories,
  getSubmissionForEdit,
} from '@/lib/queries'
import QAForm from '@/components/form/QAForm'

export const dynamic = 'force-dynamic'

export default async function SubmitPage({ searchParams }) {
  const params = await searchParams
  const draftId = params?.draft ?? null
  const editId = params?.edit ?? null
  const loadId = draftId || editId

  const [sections, branchRules, categories] = await Promise.all([
    getAllSectionsWithQuestions(),
    getBranchRules(),
    getCategories(),
  ])

  let initialData = null
  if (loadId) initialData = await getSubmissionForEdit(loadId)

  // Decide the mode. An ?edit on a non-draft record is a true (audited) edit;
  // anything that loads a draft (or ?draft) resumes the draft flow.
  let mode: 'new' | 'draft' | 'edit' = 'new'
  if (initialData) {
    mode = editId && initialData.status !== 'draft' ? 'edit' : 'draft'
  }

  const heading =
    mode === 'edit' ? 'Edit submission' :
    mode === 'draft' ? 'Continue draft' :
    'New sample submission'

  const subtitle =
    mode === 'edit' ? 'Grangemill · Amend a finished record (an audit entry is required)' :
    mode === 'draft' ? 'Grangemill · Finish a saved draft' :
    'Grangemill · Sample registration and test results'

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      {loadId && !initialData ? (
        <div className="alert alert-danger">
          That submission could not be found. It may have been removed.
        </div>
      ) : (
        <QAForm
          sections={sections}
          branchRules={branchRules}
          categories={categories}
          initialData={initialData}
          mode={mode}
        />
      )}
    </>
  )
}

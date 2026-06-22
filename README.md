import { getAllSectionsWithQuestions, getBranchRules, getCategories } from '@/lib/queries'
import QAForm from '@/components/form/QAForm'

export default async function SubmitPage() {
  const [sections, branchRules, categories] = await Promise.all([
    getAllSectionsWithQuestions(),
    getBranchRules(),
    getCategories(),
  ])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>New sample submission</h1>
          <p>Grangemill · Sample registration and test results</p>
        </div>
      </div>

      <QAForm
        sections={sections}
        branchRules={branchRules}
        categories={categories}
      />
    </>
  )
}

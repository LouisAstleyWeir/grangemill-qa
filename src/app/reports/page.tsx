import { getDashboardSummary, getCategories } from '@/lib/queries'
import ReportsClient from '@/components/dashboard/ReportsClient'

export default async function ReportsPage() {
  const [summary, categories] = await Promise.all([
    getDashboardSummary(),
    getCategories(),
  ])

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Reports</h1>
          <p>On-demand analysis · Last 30 days</p>
        </div>
      </div>
      <ReportsClient summary={summary ?? []} categories={categories} />
    </>
  )
}

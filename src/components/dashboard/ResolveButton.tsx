'use client'

import { useState } from 'react'
import { resolveException } from '@/app/actions'
import { useRouter } from 'next/navigation'

export default function ResolveButton({ exceptionId }: { exceptionId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleResolve = async () => {
    const notes = prompt('Add a resolution note (optional):')
    if (notes === null) return // user cancelled
    setLoading(true)
    // In production replace 'system' with actual user ID from auth
    const res = await resolveException(exceptionId, 'system', notes || undefined)
    setLoading(false)
    if (res.success) {
      router.refresh()
    } else {
      alert(`Failed to resolve: ${res.error}`)
    }
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={handleResolve}
      disabled={loading}
    >
      {loading ? '…' : 'Resolve'}
    </button>
  )
}

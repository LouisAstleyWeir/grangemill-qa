'use client'

import { useEffect, useState } from 'react'
import LabLoader from '@/components/ui/LabLoader'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {showLoader && <LabLoader />}
      <div style={{
        opacity: showLoader ? 0 : 1,
        transition: 'opacity 0.4s ease 0.1s',
      }}>
        {children}
      </div>
    </>
  )
}

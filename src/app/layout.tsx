import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/ui/Sidebar'

export const metadata: Metadata = {
  title: 'Grangemill QA',
  description: 'Sample registration and quality assurance system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',           label: 'Dashboard',        icon: '▦' },
  { href: '/submit',     label: 'New submission',   icon: '+' },
  { href: '/submissions',label: 'Submissions',      icon: '≡' },
  { href: '/exceptions', label: 'Exceptions',       icon: '⚠' },
  { href: '/reports',    label: 'Reports',          icon: '↗' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span>IKo Platforms</span>
        <strong>Grangemill QA<span className="accent-dot" /></strong>
      </div>

      <div className="nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span style={{ fontSize: '1rem', width: 18, textAlign: 'center' }}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
          Grangemill<br />Sample Registration
        </p>
      </div>
    </nav>
  )
}

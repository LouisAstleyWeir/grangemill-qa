'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',            label: 'Dashboard',      icon: '▦' },
  { href: '/submit',      label: 'New submission',  icon: '+' },
  { href: '/submissions', label: 'Submissions',     icon: '≡' },
  { href: '/exceptions',  label: 'Exceptions',      icon: '⚠' },
  { href: '/reports',     label: 'Reports',         icon: '↗' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="iko-wordmark">
          <span className="iko-letters">IK<span>O</span></span>
        </div>
        <span className="site-name">Grangemill</span>
        <span className="site-sub">QA &amp; Sample Registration</span>
      </div>

      <div className="nav-links">
        <div className="nav-section-label">Navigation</div>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
        IKO Platforms · Grangemill<br />
        QA System v1.0
      </div>
    </nav>
  )
}

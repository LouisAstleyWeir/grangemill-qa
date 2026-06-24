'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import IKOLogo from './IKOLogo'

const links = [
  { href: '/',             label: 'Dashboard',       icon: '▦' },
  { href: '/submit',       label: 'New submission',  icon: '+' },
  { href: '/submissions',  label: 'Submissions',     icon: '≡' },
  { href: '/exceptions',   label: 'Exceptions',      icon: '⚠' },
  { href: '/reports',      label: 'Reports',         icon: '↗' },
  { href: '/certificates', label: 'Certificates',    icon: '◆' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div style={{ marginBottom: '10px' }}>
          <IKOLogo width={90} height={30} />
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
            className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Sidebar link that highlights itself when its section is open.
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link href={href} className={active ? 'nav-link nav-link-active' : 'nav-link'} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  )
}

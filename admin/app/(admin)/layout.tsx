import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NavLink } from '@/components/NavLink'
import { Icon } from '@/components/ui'
import { requireAdmin, signOut } from '@/lib/auth'

async function logout() {
  'use server'
  await signOut()
  redirect('/login')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span>
            Copalat <small>Admin</small>
          </span>
        </Link>
        <nav className="side-nav" aria-label="Main">
          <NavLink href="/">
            <Icon name="home" /> Overview
          </NavLink>
          <NavLink href="/users">
            <Icon name="users" /> Users
          </NavLink>
          <NavLink href="/proposals">
            <Icon name="file" /> Proposals
          </NavLink>
          <NavLink href="/settings">
            <Icon name="settings" /> Settings
          </NavLink>
        </nav>
        <form action={logout} className="side-foot">
          <button type="submit" className="nav-link">
            <Icon name="logout" /> Sign out
          </button>
        </form>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}

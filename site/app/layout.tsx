import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { ChromeMark } from '@/components/Icon'
import { site } from '@/lib/site'
import './globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  keywords: [
    'Upwork proposal writer',
    'Upwork cover letter generator',
    'AI proposal generator',
    'Upwork bid writer',
    'Upwork proposal template',
    'freelance proposal AI',
    'Chrome extension for Upwork',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070b0a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <header className="header">
          <div className="wrap header-inner">
            <Link href="/" className="brand">
              <img src="/logo.svg" alt="" width={28} height={28} />
              {site.name}
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/#how">How it works</Link>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
            </nav>
            <a href={site.storeUrl} className="btn btn-small" target="_blank" rel="noreferrer">
              <ChromeMark size={16} />
              Add to Chrome
            </a>
          </div>
        </header>

        {children}

        <footer className="footer">
          <div className="wrap footer-inner">
            <div className="footer-brand">
              <div className="brand">
                <img src="/logo.svg" alt="" width={26} height={26} />
                {site.name}
              </div>
              <p>The AI Upwork proposal writer and cover letter generator for Chrome.</p>
            </div>
            <nav className="footer-nav" aria-label="Product">
              <strong>Product</strong>
              <Link href="/#how">How it works</Link>
              <Link href="/#features">Features</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/#faq">FAQ</Link>
            </nav>
            <nav className="footer-nav" aria-label="Company">
              <strong>Company</strong>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href={`mailto:${site.supportEmail}`}>Contact</a>
            </nav>
          </div>
          <div className="wrap footer-legal">
            <p>
              © {new Date().getFullYear()} {site.name}. Not affiliated with or endorsed by Upwork. Upwork is a
              trademark of Upwork Inc.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}

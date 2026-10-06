import type { Metadata } from 'next'
import { Celebration } from '@/components/Celebration'
import { Icon } from '@/components/Icon'
import { site } from '@/lib/site'

// Opened by the extension once, right after it is installed (see WELCOME_URL in
// extenison/lib/config.js). Kept out of search results and the sitemap.
export const metadata: Metadata = {
  title: 'Welcome',
  description: `${site.name} is installed. Three steps to your first proposal.`,
  robots: { index: false, follow: false },
  alternates: { canonical: '/welcome' },
}

const STEPS = [
  {
    title: 'Pin Copalat to your toolbar',
    text: 'Click the puzzle icon at the top right of Chrome, then the pin next to Copalat. That keeps your usage, profile and past proposals one click away.',
  },
  {
    title: 'Add your profile',
    text: 'Open Copalat from the toolbar, sign in with Google, and write a few lines about your skills and results. Proposals only claim what you put there, so specifics and numbers make them stronger.',
  },
  {
    title: 'Open a job and click Apply',
    text: 'On Upwork’s proposal page Copalat appears in the bottom-right corner. Pick a tone and length, generate, then insert the cover letter and answers with one click.',
  },
]

export default function WelcomePage() {
  return (
    <main>
      <Celebration />
      <p className="pin-hint" aria-hidden="true">
        <Icon name="arrow" size={16} />
        Pin Copalat up here
      </p>
      <section className="hero welcome">
        <div className="hero-bg" aria-hidden="true" />
        <div className="wrap hero-copy">
          <p className="eyebrow">
            <Icon name="check" size={14} />
            Copalat is installed
          </p>
          <h1>
            Welcome aboard{' '}
            <span className="wave" aria-hidden="true">
              👋
            </span>
            <br />
            You’re <em>three steps</em> from your first proposal.
          </h1>
          <p className="lead">
            Your first {site.freeProposals} proposals are free and need no card. Here’s how to write one in the next
            two minutes.
          </p>
        </div>

        <div className="wrap">
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="welcome-actions">
            <a href="https://www.upwork.com/nx/find-work/" className="btn btn-large btn-pulse">
              Find a job on Upwork
              <Icon name="arrow" size={16} />
            </a>
            <a href="/#faq" className="btn btn-ghost btn-large">
              Read the FAQ
            </a>
          </div>
          <p className="welcome-note">
            <Icon name="shield" size={14} /> Copalat only drafts and fills in text. Nothing is submitted until you press
            Upwork’s own button.
          </p>
        </div>
      </section>
    </main>
  )
}

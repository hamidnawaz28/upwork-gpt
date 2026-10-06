import type { Metadata } from 'next'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `What ${site.name} collects, why, and who it is shared with.`,
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className="legal">
      <div className="wrap wrap-narrow">
        <h1>Privacy Policy</h1>
        <p>Last updated: October 6, 2026</p>

        <p>
          {site.name} is a Chrome extension that drafts Upwork proposals. This page explains what data it handles. It
          collects only what it needs to write your proposals and manage your plan.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details.</strong> When you sign in with Google we receive your name, email address and
            profile picture.
          </li>
          <li>
            <strong>Your freelancer profile.</strong> The skills and experience text you choose to save, and your
            default tone and length.
          </li>
          <li>
            <strong>Job content you generate from.</strong> When you click Generate, the extension reads the job title,
            description, skill tags and screening questions from the Upwork page you are on and sends them to our
            server to write the draft.
          </li>
          <li>
            <strong>Generated proposals.</strong> The cover letters and answers written for you, with the path of the
            job page and the date, so you can see your history.
          </li>
          <li>
            <strong>Usage and plan.</strong> How many proposals you have used, your plan, and its billing period.
          </li>
        </ul>

        <h2>What we do not collect</h2>
        <ul>
          <li>Your Upwork password, messages, earnings or any page other than the proposal page you generate from.</li>
          <li>Your browsing history. The extension only runs on Upwork’s proposal pages.</li>
          <li>Your card details. Payments are entered on Stripe’s pages and never reach our servers.</li>
        </ul>

        <h2>Who processes your data</h2>
        <ul>
          <li>
            <strong>Supabase</strong> stores your account, profile, usage and proposals, and handles sign-in.
          </li>
          <li>
            <strong>OpenAI</strong> receives the job content, your saved profile and your instructions in order to
            write each draft.
          </li>
          <li>
            <strong>Stripe</strong> processes payments and holds your billing details.
          </li>
          <li>
            <strong>Google</strong> confirms your identity when you sign in.
          </li>
        </ul>
        <p>We do not sell your data or use it for advertising.</p>

        <h2>How long we keep it</h2>
        <p>
          We keep your data while your account exists. Ask us to delete your account and we will remove your profile,
          usage and proposals. Stripe keeps payment records as the law requires.
        </p>

        <h2>Your choices</h2>
        <p>
          You can edit your profile in the extension at any time, sign out, uninstall the extension, or ask us for a
          copy or deletion of your data.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests: <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>
      </div>
    </main>
  )
}

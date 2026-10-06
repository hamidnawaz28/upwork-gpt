import { HeroDemo } from '@/components/HeroDemo'
import { ChromeMark, Icon, type IconName } from '@/components/Icon'
import { faqs, features, plans, site, steps } from '@/lib/site'

// Structured data so search engines can show the price and the FAQ in results.
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: site.name,
    description: site.description,
    url: site.url,
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Chrome',
    offers: [
      { '@type': 'Offer', name: 'Free trial', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Starter', price: '9', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Pro', price: '15', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Unlimited', price: '99', priceCurrency: 'USD' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  },
]

// One icon per entry of `features`, in order.
const FEATURE_ICONS: IconName[] = ['target', 'shield', 'question', 'cursor', 'sliders', 'history']

const FACTS = [
  { value: `${site.freeProposals}`, label: 'proposals free, no card' },
  { value: '4', label: 'tones to match your voice' },
  { value: '3', label: 'lengths, short to detailed' },
  { value: '0', label: 'proposals sent without you' },
]

function AddToChrome({ label = 'Add to Chrome', large = false }: { label?: string; large?: boolean }) {
  return (
    <a href={site.storeUrl} className={large ? 'btn btn-large' : 'btn'} target="_blank" rel="noreferrer">
      <ChromeMark />
      {label}
    </a>
  )
}

export default function HomePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="wrap hero-copy">
          <p className="eyebrow">
            <Icon name="sparkles" size={14} />
            AI Upwork proposal writer for Chrome
          </p>
          <h1>
            Write Upwork proposals that <em>get opened</em>, in seconds.
          </h1>
          <p className="lead">
            Copalat reads the job post, drafts a cover letter written for that client, answers their screening
            questions and drops it all into Upwork’s form. You review and send.
          </p>
          <div className="actions">
            <AddToChrome label={`Add to Chrome, ${site.freeProposals} proposals free`} large />
            <a href="#how" className="btn btn-ghost btn-large">
              See how it works
              <Icon name="arrow" size={16} />
            </a>
          </div>
          <ul className="assurances">
            <li>
              <Icon name="check" size={14} /> No card needed
            </li>
            <li>
              <Icon name="check" size={14} /> Sign in with Google
            </li>
            <li>
              <Icon name="check" size={14} /> Nothing is sent without you
            </li>
          </ul>
        </div>
        <div className="wrap">
          <HeroDemo />
        </div>
      </section>

      <section className="facts" aria-label="At a glance">
        <div className="wrap facts-inner">
          {FACTS.map((fact) => (
            <div key={fact.label} className="fact">
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Why it works</p>
          <h2>Clients read two lines. Make them count.</h2>
          <p className="section-lead">
            In a client’s inbox your proposal is a two-line preview among dozens. Templates waste those lines. Copalat
            spends them on the client’s problem.
          </p>
          <div className="compare">
            <article className="compare-card compare-bad reveal">
              <header>
                <span className="tag tag-bad">
                  <Icon name="x" size={13} /> Template
                </span>
                <span className="compare-note">Skipped</span>
              </header>
              <p className="compare-preview">
                Dear Hiring Manager, I hope this message finds you well. I am a highly skilled developer with 7+ years
                of experience and I am very interested in your project…
              </p>
              <ul>
                <li>Could be sent to any job</li>
                <li>Says nothing about their store</li>
                <li>Talks about you before them</li>
              </ul>
            </article>
            <article className="compare-card compare-good reveal">
              <header>
                <span className="tag tag-good">
                  <Icon name="sparkles" size={13} /> Copalat
                </span>
                <span className="compare-note">Opened</span>
              </header>
              <p className="compare-preview">
                Your product pages are losing mobile buyers before the gallery finishes loading, and that is fixable
                without a redesign. I’d start with a speed audit of the theme…
              </p>
              <ul>
                <li>Opens with their problem</li>
                <li>Shows a plan in one sentence</li>
                <li>Uses only experience you gave it</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="how" className="section section-tint">
        <div className="wrap">
          <p className="kicker">How it works</p>
          <h2>From job post to proposal in three steps</h2>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title} className="step reveal">
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="section">
        <div className="wrap">
          <p className="kicker">Features</p>
          <h2>A cover letter generator built for how clients read</h2>
          <p className="section-lead">
            Everything you need to bid faster without sounding like everyone else, and nothing that puts your account
            at risk.
          </p>
          <div className="bento">
            {features.map((feature, index) => (
              <article key={feature.title} className="bento-card reveal">
                <span className="bento-icon">
                  <Icon name={FEATURE_ICONS[index]} size={20} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section section-tint">
        <div className="wrap">
          <p className="kicker">Pricing</p>
          <h2>Start free. Pay when it’s winning you work.</h2>
          <p className="section-lead">
            Try every feature on {site.freeProposals} proposals. When the trial runs out, pick a plan inside the
            extension. Cancel any time.
          </p>
          <div className="plans">
            {plans.map((plan) => (
              <article key={plan.id} className={plan.featured ? 'plan plan-featured reveal' : 'plan reveal'}>
                {plan.featured && <span className="plan-tag">Best to start</span>}
                <h3>{plan.name}</h3>
                <p className="price">
                  {plan.price}
                  <span>{plan.period}</span>
                </p>
                <p className="plan-quota">{plan.proposals}</p>
                <ul>
                  {plan.points.map((point) => (
                    <li key={point}>
                      <Icon name="check" size={15} />
                      {point}
                    </li>
                  ))}
                </ul>
                <a
                  href={site.storeUrl}
                  className={plan.featured ? 'btn' : 'btn btn-ghost'}
                  target="_blank"
                  rel="noreferrer"
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
          <p className="plans-note">
            <Icon name="lock" size={14} /> Payments are handled by Stripe. Copalat never sees your card.
          </p>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="wrap faq-layout">
          <div>
            <p className="kicker">FAQ</p>
            <h2>Questions freelancers ask</h2>
            <p className="section-lead">
              Something else on your mind? <a href={`mailto:${site.supportEmail}`}>Write to us.</a>
            </p>
          </div>
          <div className="faq">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="cta">
            <div className="cta-bg" aria-hidden="true" />
            <h2>Write your next {site.freeProposals} proposals free.</h2>
            <p>Install the extension, open any Upwork job, and have a tailored draft before your coffee cools.</p>
            <AddToChrome large />
          </div>
        </div>
      </section>
    </main>
  )
}

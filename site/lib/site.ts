// Everything about the product that the pages show. Edit here, not in the pages.

// NEXT_PUBLIC_SITE_URL may be typed with or without "https://" (e.g. "example.com").
// Anything that still is not a valid address falls back, so a typo cannot fail the build.
function siteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim()
  const fallback = 'http://localhost:3000'
  if (!raw) return fallback
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin
  } catch {
    return fallback
  }
}

export const site = {
  name: 'Copalat',
  title: 'Copalat: AI Upwork Proposal Writer & Cover Letter Generator',
  description:
    'Write winning Upwork proposals in seconds. Copalat is a Chrome extension that drafts a cover letter tailored to each job post, answers screening questions and inserts them for you. 5 proposals free.',
  // Public address of this site, used for canonical links, the sitemap and social previews.
  url: siteUrl(),
  // Copalat's Chrome Web Store listing.
  storeUrl: 'https://chromewebstore.google.com/detail/pegclbgggajipbeekkdgmpccojjcjedd',
  // TODO: the address shown on the privacy, terms and contact links.
  supportEmail: 'support@your-domain.com',
  freeProposals: 5,
}

// Prices and quotas must match the server (Stripe + copalat_plan_limit in supabase/).
export const plans = [
  {
    id: 'free',
    name: 'Free trial',
    price: '$0',
    period: '',
    proposals: `${site.freeProposals} proposals, once`,
    cta: 'Add to Chrome',
    featured: false,
    points: ['No card needed', 'Every feature included', 'Sign in with Google'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$9',
    period: '/month',
    proposals: '30 proposals every month',
    cta: 'Start free, upgrade later',
    featured: true,
    points: ['30 cents a proposal', 'Screening answers included', 'Cancel any time'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$15',
    period: '/month',
    proposals: '60 proposals every month',
    cta: 'Start free, upgrade later',
    featured: false,
    points: ['25 cents a proposal', 'For freelancers who bid daily', 'Cancel any time'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$99',
    period: '/month',
    proposals: 'Unlimited proposals',
    cta: 'Start free, upgrade later',
    featured: false,
    points: ['No monthly cap', 'For agencies and heavy bidders', 'Cancel any time'],
  },
]

export const steps = [
  {
    title: 'Open a job and click Apply',
    text: 'Copalat appears in the corner of Upwork’s proposal page. It reads the job description, the skills the client asked for and their screening questions.',
  },
  {
    title: 'Pick a tone and generate',
    text: 'Choose professional, friendly, confident or concise, and a short, medium or detailed length. Add anything you want mentioned. Your draft is ready in a few seconds.',
  },
  {
    title: 'Insert, review, submit',
    text: 'One click puts the cover letter and each answer into Upwork’s form. Read it, adjust it, and send it yourself.',
  },
]

export const features = [
  {
    title: 'Written for this job, not a template',
    text: 'Every proposal opens with the client’s actual problem, because the first two lines are all a client sees before deciding to open it.',
  },
  {
    title: 'Your experience, never invented',
    text: 'Save your skills and results once. Copalat only claims what you wrote, with no made-up clients, numbers or links.',
  },
  {
    title: 'Screening questions answered',
    text: 'It finds the client’s extra questions on the page and drafts an answer for each one alongside the cover letter.',
  },
  {
    title: 'One-click insert',
    text: 'Send the cover letter and answers straight into Upwork’s fields, or copy them. Nothing is submitted until you press the button.',
  },
  {
    title: 'Tone and length control',
    text: 'Four tones and three lengths, with your defaults remembered. Regenerate until it sounds like you.',
  },
  {
    title: 'History of what you sent',
    text: 'Your recent proposals stay in the extension so you can reuse a strong opening on the next similar job.',
  },
]

export const faqs = [
  {
    question: 'How does Copalat write an Upwork proposal?',
    answer:
      'On Upwork’s “submit a proposal” page it reads the job description, required skills and screening questions, combines them with the profile you saved, and asks an AI model to draft a cover letter and answers in the tone and length you chose.',
  },
  {
    question: 'Does it submit proposals for me?',
    answer:
      'No. Copalat only drafts text and fills the fields when you click Insert. You review everything and submit the proposal yourself, and it never spends Connects or acts on your account.',
  },
  {
    question: 'What counts as one proposal?',
    answer:
      'Each time you click Generate or Regenerate, one proposal is used. If the AI fails to produce a draft, nothing is deducted.',
  },
  {
    question: 'What happens after the 5 free proposals?',
    answer:
      'You choose a plan inside the extension: Starter is $9 a month for 30 proposals, Pro is $15 a month for 60, and Unlimited is $99 a month with no cap. Payment is handled by Stripe.',
  },
  {
    question: 'Can I cancel?',
    answer:
      'Yes, at any time from “Manage subscription” in the extension. Your plan stays active until the end of the period you paid for. Unused proposals do not roll over to the next month.',
  },
  {
    question: 'Will it invent experience I don’t have?',
    answer:
      'It is instructed to use only what you put in your profile and to stay general when it has nothing to go on. You should still read every draft before sending it.',
  },
  {
    question: 'What data do you store?',
    answer:
      'Your Google name, email and picture, the profile you write, your usage count and the proposals generated for you. The job text is sent to the AI provider to write the draft. Details are in the privacy policy.',
  },
  {
    question: 'Is Copalat made by Upwork?',
    answer:
      'No. Copalat is an independent tool and is not affiliated with or endorsed by Upwork. You are responsible for following Upwork’s terms when you use it.',
  },
]

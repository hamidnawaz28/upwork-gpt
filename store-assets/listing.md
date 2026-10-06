# Chrome Web Store listing — Copalat

Everything to paste into the developer dashboard for item `pegclbgggajipbeekkdgmpccojjcjedd`.
The images in this folder are made by `node store-assets/render.mjs`.

## Package (comes from the extension, not typed in the dashboard)

- **Title:** Copalat: AI Upwork Proposal Writer & Cover Letter Generator
- **Summary:** Write winning Upwork proposals in seconds. AI cover letter generator and bid writer tailored to each job. 5 free proposals.

These replace the old "Copalat - A GPT for freelance" text when version 1.2.0 is uploaded.

## Store listing tab

**Category:** Tools (or Workflow & Planning)

**Description**

```
Write Upwork proposals that get opened, in seconds.

Copalat reads the job post you are applying to and drafts a cover letter written for that client: it opens with their problem, shows how you would approach it, and ends with one easy question. It also answers the client's screening questions and puts everything into Upwork's form with one click. You review it and press submit yourself.

WHY IT WORKS
Clients skim dozens of proposals and see only the first two lines of each. Templates waste those lines on "Dear Hiring Manager". Copalat spends them on the client's actual problem.

HOW IT WORKS
1. Open a job on Upwork and click Apply. Copalat appears in the corner of the proposal page.
2. Pick a profile, a tone and a length, then click Generate.
3. Click Insert to place the cover letter and each answer in the form. Read it, adjust it, send it.

FEATURES
✓ Cover letters tailored to each job post, not a template
✓ Screening questions answered alongside the cover letter
✓ One-click insert into Upwork's proposal form, or copy
✓ Four tones: professional, friendly, confident, concise
✓ Three lengths: short, medium, detailed
✓ Several saved profiles, one per kind of work, with a default
✓ Uses only the experience you wrote in your profile. No invented clients, numbers or links
✓ Follows instructions hidden in the job post, such as "start your proposal with the word..."
✓ Regenerate as often as you like, with a note for anything you want mentioned
✓ Your recent proposals saved, ready to copy again
✓ Writes in the language of the job post

YOU STAY IN CONTROL
Copalat only drafts text and fills in the fields when you click Insert. It never submits a proposal, never spends Connects and never acts on your account.

PRICING
• Free: 5 proposals, no card needed
• Starter: $9 a month for 30 proposals
• Pro: $15 a month for 60 proposals
• Unlimited: $99 a month, no monthly cap
Cancel any time. Payments are handled by Stripe.

PRIVACY
Copalat runs only on Upwork's proposal pages. When you click Generate, the job title, description, skills and screening questions on that page are sent to our server to write the draft. We store your Google name and email, the profiles you save, your usage and the proposals written for you. We do not sell your data. Full policy: https://upwork-gpt-lyart.vercel.app/privacy

Copalat is an independent tool and is not affiliated with or endorsed by Upwork.
```

**Graphic assets**

| Field | File |
|---|---|
| Store icon (128x128) | `store-icon-128.png` |
| Screenshot 1 | `screenshot-1-hero.png` |
| Screenshot 2 | `screenshot-2-tone-and-length.png` |
| Screenshot 3 | `screenshot-3-screening-answers.png` |
| Screenshot 4 | `screenshot-4-profiles.png` |
| Screenshot 5 | `screenshot-5-pricing.png` |
| Small promo tile (440x280) | `small-promo-tile-440x280.png` |
| Marquee promo tile (1400x560) | `marquee-promo-tile-1400x560.png` |

**Additional fields**

- **Homepage URL:** https://upwork-gpt-lyart.vercel.app/
- **Support URL:** https://upwork-gpt-lyart.vercel.app/#faq
- **Mature content:** No

## Privacy tab

**Single purpose**

```
Copalat writes proposals for Upwork jobs. On Upwork's "submit a proposal" page it drafts a cover letter and answers to the client's screening questions from the job post, and inserts them into the form when the user asks.
```

**Permission justifications**

- **identity:** `Used to sign the user in with their Google account, so their free trial, plan, saved profiles and past proposals belong to them.`
- **storage:** `Stores the user's sign-in session on their device so they stay signed in between visits.`
- **Host permission (mivnbjtehikrqxooogcs.supabase.co):** `The extension's own backend. It checks the signed-in user, writes the proposal and stores the user's profiles, usage and proposals.`
- **Content script on www.upwork.com proposal pages:** `Reads the job post on the proposal page the user is on and shows the Copalat panel there. It fills the cover letter and question fields only when the user clicks Insert.`

**Remote code:** No, the extension does not use remote code. All scripts are in the package.

**Data usage** — tick these and nothing else:

- Personally identifiable information (name, email address from Google sign-in)
- Authentication information (the sign-in session)
- Website content (the job post text on the proposal page, sent to write the draft)
- User activity: not collected

Tick all three certifications (no selling data, no unrelated use, no creditworthiness use).

**Privacy policy URL:** https://upwork-gpt-lyart.vercel.app/privacy

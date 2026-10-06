import { Icon } from './Icon'

// The product shot in the hero: Upwork's proposal page inside a browser window with the
// Copalat widget in the corner. Built from markup so it stays sharp and themes with the
// page. Purely illustrative, so it is hidden from assistive technology.
export function HeroDemo() {
  return (
    <div className="shot" aria-hidden="true">
      <div className="shot-glow" />
      <div className="browser">
        <div className="browser-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="address">
            <Icon name="lock" size={12} />
            upwork.com/nx/proposals/job/apply
          </span>
        </div>

        <div className="browser-body">
          <div className="job">
            <p className="job-kicker">Submit a proposal</p>
            <h3>Shopify developer to speed up our product pages</h3>
            <p className="job-meta">Fixed price · Intermediate · Posted 2 hours ago</p>
            <p className="job-text">
              Our store’s product pages load slowly on mobile and we are losing buyers before the gallery appears. We
              need someone who knows Liquid and Core Web Vitals to audit the theme and rebuild the product template.
            </p>
            <div className="job-tags">
              <span>Shopify</span>
              <span>Liquid</span>
              <span>Page speed</span>
              <span>Core Web Vitals</span>
            </div>

            <p className="job-label">Cover Letter</p>
            <div className="job-field">
              <p className="type type-1">
                Your product pages are losing mobile buyers before the gallery finishes loading, and that is fixable
                without a redesign.
              </p>
              <p className="type type-2">
                I’d start with a speed audit of the theme, remove the scripts that block rendering, then rebuild the
                product template in clean Liquid.
              </p>
              <p className="type type-3">Which theme is the store on right now?</p>
            </div>
          </div>

          <div className="widget">
            <div className="widget-head">
              <img src="/logo.svg" alt="" width={26} height={26} />
              <strong>Copalat</strong>
              <span className="pill">3 of 5 free left</span>
            </div>
            <p className="widget-label">Tone</p>
            <div className="chips">
              <span>Professional</span>
              <span>Friendly</span>
              <span className="on">Confident</span>
              <span>Concise</span>
            </div>
            <p className="widget-label">Length</p>
            <div className="segments">
              <span className="on">Short</span>
              <span>Medium</span>
              <span>Detailed</span>
            </div>
            <div className="widget-button">
              <Icon name="sparkles" size={15} />
              Generate proposal
            </div>
            <div className="widget-done">
              <Icon name="check" size={14} />
              Inserted into the cover letter
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { createRoot } from 'react-dom/client'
import Browser from 'webextension-polyfill'
import '../../base.css'
import { CONTENT_SCRIPT } from '../common/messaging'
import ResponseContainer from './components/ResponseContainer'

const renderBidButton = () => {
  let coverLetterArea = null
  let mainContainer = null
  const timeInterval = setInterval(() => {
    coverLetterArea = document.querySelector('#cover_letter_label')
    mainContainer = document.querySelector('#main')
    if (coverLetterArea !== null && mainContainer !== null) {
      clearInterval(timeInterval)
      const responseContainer = document.createElement('div')
      mainContainer.append(responseContainer)
      const moreDescription = document.querySelector('.up-truncation-label') as HTMLElement

      if (moreDescription) {
        moreDescription.click()
      }
      const description = document?.querySelector('.description') as HTMLElement
      const skillBadge = document?.querySelector('.up-skill-badge') as HTMLElement

      const jobTitle = ''
      const jobTags = Array.from(document?.querySelectorAll('[data-test="skill"]')).map(
        (el: any) => el.innerText,
      )
      const freelancerRef = Array.from(document.querySelectorAll('[data-cy="menu-item-trigger"]'))
      let freelancer = ''
      if (freelancerRef.length) {
        freelancer =
          freelancerRef.find((el: any) => el.innerText.includes(`Profile`))?.getAttribute('href') ||
          ''
      }

      const details = {
        jobUrl: window.location.pathname,
        freelancer: freelancer,
        jobTitle: jobTitle,
        jobDescription: description?.innerText || '',
        skillBadge: skillBadge?.innerText || '',
        jobTags: jobTags || [],
      }

      Browser.runtime.sendMessage({
        action: CONTENT_SCRIPT.GENERATE_BID,
        jobDetails: details,
      })
      const root = createRoot(responseContainer)
      root.render(<ResponseContainer />)
    }
  }, 1000)
}

renderBidButton()

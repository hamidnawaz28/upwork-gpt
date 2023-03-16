import { render } from 'react-dom'
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
      const details = {
        freelancerName: '',
        jobTitle: '',
        jobDescription: description?.innerText || '',
        skillBadge: skillBadge?.innerText || '',
        jobTags: [],
        experienceLevel: '',
        projectDuration: '',
      }

      Browser.runtime.sendMessage({
        action: CONTENT_SCRIPT.GENERATE_BID,
        jobDetails: details,
      })

      render(<ResponseContainer />, responseContainer)
    }
  }, 1000)
}

renderBidButton()

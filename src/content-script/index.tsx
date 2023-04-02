import { createRoot } from 'react-dom/client'
import '../../base.css'
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

      const root = createRoot(responseContainer)
      root.render(<ResponseContainer />)
    }
  }, 1000)
}

renderBidButton()

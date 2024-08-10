import { createRoot } from 'react-dom/client'
import ResponseContainer from './ResponseContainer'
import { clickButton } from '../../common/utils'

const renderBidButton = () => {
  const timeInterval = setInterval(() => {
    let mainContainer = document.querySelector('body')
    if (mainContainer == null) return

    clearInterval(timeInterval)
    clickButton(".up-truncation-label")
    const responseContainer = document.createElement('div')
    mainContainer.append(responseContainer)
    const root = createRoot(responseContainer)
    root.render(<ResponseContainer />)
  }, 1000)
}

renderBidButton()

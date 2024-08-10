import { createRoot } from 'react-dom/client'
import { RssButton } from './RssButton'

const renderBidButton = () => {
    let saveSearchButton = null

    const timeHandler = () => {
        saveSearchButton = document.querySelector("[data-test='SaveSearchButtonEmphasized']")
        if (saveSearchButton) {
            clearInterval(timeInterval)
            const responseContainer = document.createElement('div')
            saveSearchButton?.append(responseContainer)
            const root = createRoot(responseContainer)
            root.render(<RssButton />)
        }
    }

    const timeInterval = setInterval(timeHandler, 1000)

}

renderBidButton()

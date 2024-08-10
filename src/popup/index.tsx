import { createRoot } from 'react-dom/client'
import '../../base.css'
import App from './App'

const renderBidButton = () => {
  const rootRef = document.getElementById('root') as HTMLElement
  const root = createRoot(rootRef)
  root.render(<App />)
}

renderBidButton()

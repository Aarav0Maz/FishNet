import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import { installGlobalTapSound } from './lib/sound'
import { captureInvite } from './lib/party'

installGlobalTapSound()
captureInvite()

createRoot(document.getElementById('root')!).render(
  <StrictMode><ErrorBoundary><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></ErrorBoundary></StrictMode>,
)

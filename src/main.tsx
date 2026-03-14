import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

async function mount() {
  const root = createRoot(document.getElementById('root')!)

  if (GOOGLE_CLIENT_ID) {
    const { GoogleOAuthProvider } = await import('@react-oauth/google')
    root.render(
      <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </StrictMode>
    )
  } else {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  }
}

mount()
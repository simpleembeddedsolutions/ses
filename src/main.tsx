import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { staticInit } from './staticStore.ts'

// Static demo build (GitHub Pages): seed the browser store + auto-open the demo.
if (typeof __STATIC__ !== 'undefined' && __STATIC__) staticInit()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

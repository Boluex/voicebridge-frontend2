import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import OverviewPage from './pages/OverviewPage'
import KnowledgePage from './pages/KnowledgePage'
import BillingPage from './pages/BillingPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

// Clerk is optional — only wraps if key is provided
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

function AppRoutes() {
  const hydrate = useAuthStore(s => s.hydrate)
  const token = useAuthStore(s => s.token)

  useEffect(() => { hydrate() }, [hydrate])

  function Private({ children }: { children: React.ReactNode }) {
    return token ? <>{children}</> : <Navigate to="/login" replace />
  }
  function Public({ children }: { children: React.ReactNode }) {
    return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
  }

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<Public><LoginPage /></Public>} />
        <Route path="/register" element={<Public><RegisterPage /></Public>} />
        <Route path="/dashboard" element={<Private><DashboardPage /></Private>}>
          <Route index           element={<OverviewPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="billing"   element={<BillingPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  // If Clerk key is set, wrap with ClerkProvider for Google OAuth
  if (CLERK_KEY) {
    // Dynamic import avoids crashing when package isn't installed
    const { ClerkProvider } = require('@clerk/clerk-react') as typeof import('@clerk/clerk-react')
    return (
      <ClerkProvider publishableKey={CLERK_KEY}>
        <AppRoutes />
      </ClerkProvider>
    )
  }
  return <AppRoutes />
}

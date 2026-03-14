import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import OverviewPage from './pages/OverviewPage'
import KnowledgePage from './pages/KnowledgePage'
import BillingPage from './pages/BillingPage'
import AgentPage from './pages/AgentPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

export default function App() {
  const hydrate = useAuthStore(s => s.hydrate)
  const token   = useAuthStore(s => s.token)

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
          <Route path="agent"     element={<AgentPage />} />
          <Route path="billing"   element={<BillingPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
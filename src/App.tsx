import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './pages/AuthPage'
import AppLayout from './pages/AppLayout'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import { Loader2 } from 'lucide-react'

function SubApp() {
  const { user, loading } = useAuth()
  const path = window.location.pathname

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d1f15',
        color: '#e8f5ee',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Wczytywanie Twojego warsztatu...</span>
      </div>
    )
  }

  // Prosty routing oparty na ścieżce url
  if (path === '/admin-login') {
    return <AdminLogin />
  }

  if (path === '/admin') {
    return <AdminDashboard />
  }

  if (path === '/reset-password' || window.location.hash.includes('type=recovery')) {
    return <AuthPage initialMode="update-password" />
  }

  // W innym wypadku (standardowa ścieżka aplikacji)
  if (!user) {
    return <AuthPage />
  }

  return <AppLayout />
}

import { NotificationProvider } from './contexts/NotificationContext'
import DevConsoleAndToasts from './components/ui/DevConsoleAndToasts'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProjectProvider>
          <ThemeProvider>
            <NotificationProvider>
              <SubApp />
              <DevConsoleAndToasts />
            </NotificationProvider>
          </ThemeProvider>
        </ProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

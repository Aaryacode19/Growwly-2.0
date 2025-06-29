import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { AuthForm } from './components/AuthForm'
import { Community } from './pages/Community'
import { AddProgress } from './pages/AddProgress'
import { UserProfile } from './pages/UserProfile'
import { Pomodoro } from './pages/Pomodoro'
import { BotButton } from './components/BotButton'
import { LoadingScreen } from './components/LoadingScreen'

function AppContent() {
  const { user, loading } = useAuth()
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)

  // Show loading screen on initial app load
  if (showLoadingScreen) {
    return <LoadingScreen onLoadingComplete={() => setShowLoadingScreen(false)} />
  }

  // Show loading screen for auth loading
  if (loading) {
    return <LoadingScreen onLoadingComplete={() => {}} />
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Community />} />
        <Route path="/add" element={<AddProgress />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
      </Routes>
      
      {/* Bot Button - Rendered at App level, outside of Layout */}
      <BotButton />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
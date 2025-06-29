import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { LogOut, Users, Moon, Sun, Lock, Menu, X, User, Timer } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ChangePasswordModal } from './ChangePasswordModal'
import { Footer } from './Footer'
import { MinimizedGrowwly } from './MinimizedGrowwly'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const location = useLocation()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // PERSISTENT STATE FOR GROWWLY - This will maintain state across re-renders
  const [growwlyHeaderVisible, setGrowwlyHeaderVisible] = useState(false)

  // Listen for Growwly events and manage state at Layout level
  useEffect(() => {
    const handleMinimize = () => {
      console.log('🔽 Layout: Growwly minimize event - showing in header PERMANENTLY')
      setGrowwlyHeaderVisible(true)
    }

    const handleCloseAll = () => {
      console.log('❌ Layout: Growwly close all event - hiding header')
      setGrowwlyHeaderVisible(false)
    }

    // Listen for Growwly events
    window.addEventListener('growwly-minimize', handleMinimize)
    window.addEventListener('growwly-close-all', handleCloseAll)

    return () => {
      window.removeEventListener('growwly-minimize', handleMinimize)
      window.removeEventListener('growwly-close-all', handleCloseAll)
    }
  }, [])

  // Debug logging for Growwly state
  useEffect(() => {
    console.log('🔍 Layout: Growwly header visibility:', growwlyHeaderVisible)
  }, [growwlyHeaderVisible])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (mobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
    }
  }, [mobileMenuOpen])

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors flex flex-col">
      <header className="border-b border-black dark:border-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            {/* Logo with Growwly mascot */}
            <Link 
              to="/" 
              className="flex items-center gap-3 hover:underline transition-all duration-200"
              onClick={closeMobileMenu}
            >
              {/* Growwly mascot in header */}
              <div 
                className="w-8 h-8 relative overflow-hidden rounded-lg shadow-md hover:scale-110 transition-transform duration-300"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
                }}
              >
                <div 
                  className="w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
                    imageRendering: 'pixelated',
                    backgroundSize: 'contain'
                  }}
                />
                
                {/* White backgrounds for eyes */}
                <div className="absolute inset-0 pointer-events-none">
                  <div 
                    className="absolute bg-white rounded-sm"
                    style={{
                      left: '25%',
                      top: '35%',
                      width: '15%',
                      height: '15%',
                      zIndex: 1
                    }}
                  />
                  <div 
                    className="absolute bg-white rounded-sm"
                    style={{
                      right: '25%',
                      top: '35%',
                      width: '15%',
                      height: '15%',
                      zIndex: 1
                    }}
                  />
                </div>
                
                {/* Growwly face overlay */}
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
                    imageRendering: 'pixelated',
                    backgroundSize: 'contain',
                    zIndex: 2,
                    mixBlendMode: 'multiply'
                  }}
                />
              </div>
              
              <span className="text-lg sm:text-xl font-semibold">Growwly</span>
            </Link>
            
            {/* Center space for minimized Growwly - Desktop only */}
            <div className="hidden md:flex flex-1 justify-center px-8">
              {/* PERSISTENT GROWWLY HEADER - Controlled by Layout state */}
              {growwlyHeaderVisible && (
                <div 
                  className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 dark:from-green-900/30 dark:via-blue-900/30 dark:to-purple-900/30 rounded-full border border-green-300 dark:border-green-700 shadow-lg backdrop-blur-sm cursor-pointer hover:scale-105 transition-all duration-500 animate-slide-in-from-right"
                  onClick={() => {
                    console.log('🔼 Layout: Expanding Growwly from header...')
                    setGrowwlyHeaderVisible(false)
                    window.dispatchEvent(new CustomEvent('growwly-expand-from-header'))
                  }}
                  style={{
                    // FORCE VISIBILITY - prevent any CSS from hiding this
                    display: 'flex !important',
                    visibility: 'visible !important',
                    opacity: '1 !important'
                  }}
                >
                  {/* Growwly Face */}
                  <div className="w-8 h-8 relative overflow-hidden rounded-lg shadow-lg">
                    <div className="w-full h-full bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <div 
                        className="w-7 h-7 bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
                          imageRendering: 'pixelated',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                      
                      {/* White backgrounds for eyes */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-7 h-7">
                          <div 
                            className="absolute bg-white rounded-sm"
                            style={{
                              left: '28%',
                              top: '38%',
                              width: '12%',
                              height: '12%',
                              zIndex: 1
                            }}
                          />
                          <div 
                            className="absolute bg-white rounded-sm"
                            style={{
                              right: '28%',
                              top: '38%',
                              width: '12%',
                              height: '12%',
                              zIndex: 1
                            }}
                          />
                          
                          <div 
                            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                            style={{
                              backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
                              imageRendering: 'pixelated',
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              zIndex: 2,
                              mixBlendMode: 'multiply'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-black bg-green-500 animate-pulse" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Growwly AI
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Ready to help you grow! ✨
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('❌ Layout: Closing Growwly from header...')
                      setGrowwlyHeaderVisible(false)
                      window.dispatchEvent(new CustomEvent('growwly-close-all'))
                    }}
                    className="p-1.5 hover:bg-white/50 dark:hover:bg-black/50 rounded-full transition-all duration-200 hover:scale-110 hover:text-red-500"
                    title="Close Growwly"
                  >
                    <X size={12} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              )}
            </div>
            
            {user && (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2 lg:gap-3">
                  <button
                    onClick={toggleTheme}
                    disabled={isTransitioning}
                    className={`btn-secondary flex items-center gap-2 relative overflow-hidden px-3 py-2 ${
                      isTransitioning ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    <div className={`transition-transform duration-300 ${isTransitioning ? 'scale-110' : ''}`}>
                      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                    <span className="hidden xl:inline text-sm">
                      {theme === 'light' ? 'Dark' : 'Light'}
                    </span>
                    {isTransitioning && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    )}
                  </button>

                  <Link 
                    to="/pomodoro" 
                    className={`btn-secondary flex items-center gap-2 px-3 py-2 ${
                      location.pathname === '/pomodoro' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : ''
                    }`}
                  >
                    <Timer size={16} />
                    <span className="hidden xl:inline text-sm">Timer</span>
                  </Link>
                  
                  <Link 
                    to="/" 
                    className={`btn-secondary flex items-center gap-2 px-3 py-2 ${
                      location.pathname === '/' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : ''
                    }`}
                  >
                    <Users size={16} />
                    <span className="hidden lg:inline text-sm">Community</span>
                  </Link>
                  
                  <Link 
                    to="/profile" 
                    className={`btn-secondary flex items-center gap-2 px-3 py-2 ${
                      location.pathname === '/profile' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                    }`}
                  >
                    <User size={16} />
                    <span className="hidden xl:inline text-sm">Profile</span>
                  </Link>
                  
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn-secondary flex items-center gap-2 px-3 py-2"
                    title="Change Password"
                  >
                    <Lock size={16} />
                    <span className="hidden xl:inline text-sm">Password</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="btn-secondary flex items-center gap-2 px-3 py-2"
                  >
                    <LogOut size={16} />
                    <span className="hidden lg:inline text-sm">Sign Out</span>
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMobileMenuOpen(!mobileMenuOpen)
                  }}
                  className="md:hidden btn-secondary flex items-center gap-2 mobile-menu-button z-50 relative px-3 py-2"
                >
                  {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                  <span className="text-sm">Menu</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {user && mobileMenuOpen && (
          <>
            {/* Enhanced Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Enhanced Menu */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-black border-l border-black dark:border-white md:hidden z-50 mobile-menu shadow-2xl">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">Menu</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Menu Content */}
              <div className="p-6 space-y-1">
                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    toggleTheme()
                    closeMobileMenu()
                  }}
                  disabled={isTransitioning}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                    isTransitioning ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Switch Theme</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Change to {theme === 'light' ? 'dark' : 'light'} mode
                    </div>
                  </div>
                </button>

                {/* Pomodoro Timer */}
                <Link 
                  to="/pomodoro" 
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    location.pathname === '/pomodoro'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    location.pathname === '/pomodoro'
                      ? 'bg-red-200 dark:bg-red-800'
                      : 'bg-red-100 dark:bg-red-900'
                  }`}>
                    <Timer size={18} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Pomodoro Timer</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Focus with timed work sessions
                    </div>
                  </div>
                </Link>
                
                {/* Community */}
                <Link 
                  to="/" 
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    location.pathname === '/'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    location.pathname === '/'
                      ? 'bg-purple-200 dark:bg-purple-800'
                      : 'bg-purple-100 dark:bg-purple-900'
                  }`}>
                    <Users size={18} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Community</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      View community feed and chat
                    </div>
                  </div>
                </Link>

                {/* Profile */}
                <Link 
                  to="/profile" 
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    location.pathname === '/profile'
                      ? 'bg-blue-200 dark:bg-blue-800'
                      : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    <User size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Your Profile</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      View and edit your profile
                    </div>
                  </div>
                </Link>
                
                {/* Change Password */}
                <button
                  onClick={() => {
                    setShowPasswordModal(true)
                    closeMobileMenu()
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Lock size={18} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Update your account security
                    </div>
                  </div>
                </button>
                
                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-400"
                >
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <LogOut size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Sign Out</div>
                    <div className="text-sm text-red-500 dark:text-red-400">
                      End your session
                    </div>
                  </div>
                </button>
              </div>

              {/* Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Signed in as
                  </div>
                  <div className="font-medium text-sm truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full">
        {children}
      </main>

      <Footer />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { AccessRequestForm } from './AccessRequestForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { Footer } from './Footer'
import { Moon, Sun, TrendingUp, Users, Target, Zap, Shield, Sparkles } from 'lucide-react'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAccessRequest, setShowAccessRequest] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const { signIn } = useAuth()
  const { theme, toggleTheme, isTransitioning } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await signIn(email, password)
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (showAccessRequest) {
    return <AccessRequestForm onBack={() => setShowAccessRequest(false)} />
  }

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-black dark:border-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mini Growwly in header */}
            <div 
              className="w-8 h-8 relative overflow-hidden rounded-lg"
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
            </div>
            <div className="text-lg sm:text-xl font-semibold">
              Growwly
            </div>
          </div>
          
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
            <span className="hidden sm:inline text-sm">
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
            {isTransitioning && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:py-12 sm:px-6 lg:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Mobile: Sign In Form First (order-1) */}
            {/* Desktop: Right Side - Sign In Form (order-2) */}
            <div className="w-full max-w-md mx-auto lg:mx-0 order-1 lg:order-2">
              <div className="card">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">Welcome Back</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Sign in to continue tracking your progress
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="text-center">
                    <button
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm hover:underline text-gray-600 dark:text-gray-400"
                    >
                      Forgot your password?
                    </button>
                  </div>
                  
                  <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Don't have access yet?
                    </p>
                    <button
                      onClick={() => setShowAccessRequest(true)}
                      className="text-sm hover:underline font-medium"
                    >
                      Request Access
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Hero Content Second (order-2) */}
            {/* Desktop: Left Side - Hero Content (order-1) */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="mb-6">
                {/* Integrated title with inline Growwly mascot */}
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                    <span className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                      <span>Track Your Daily</span>
                      {/* Inline Growwly mascot - perfectly sized */}
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 relative overflow-hidden rounded-xl shadow-lg transform hover:scale-110 transition-all duration-300 animate-float flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
                        }}
                      >
                        {/* Growwly's pixelated face */}
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

                        {/* Subtle floating particles */}
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(2)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-40"
                              style={{
                                top: `${20 + Math.random() * 60}%`,
                                left: `${20 + Math.random() * 60}%`,
                                animationDelay: `${i * 1.2}s`,
                                animationDuration: `${2.5 + Math.random() * 1}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                      Progress & Growth
                    </span>
                  </h1>
                </div>
                
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  Meet <span className="font-semibold text-green-600 dark:text-green-400">Growwly</span>, your AI companion! 
                  Document achievements, build streaks, and connect with a community of achievers. 
                  Turn small daily wins into life-changing momentum.
                </p>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:scale-105 transition-transform duration-300">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Progress Tracking</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Visual analytics & streaks</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:scale-105 transition-transform duration-300">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Community</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Connect & get inspired</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:scale-105 transition-transform duration-300">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">AI Goal Setting</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Growwly-powered guidance</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:scale-105 transition-transform duration-300">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Productivity Tools</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Pomodoro & focus aids</div>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Privacy First</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Community Driven</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
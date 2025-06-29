import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader, Sparkles, Target, TrendingUp, MessageCircle, X, Minimize2, Maximize2, AlertCircle, Zap, Heart, Star } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'progress_analysis' | 'goal_setting' | 'motivation' | 'general'
  isFallback?: boolean
}

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
}

const QUICK_PROMPTS = [
  {
    icon: <TrendingUp size={14} />,
    text: "Analyze progress",
    type: "progress_analysis" as const,
    prompt: "Can you help me analyze my recent progress and suggest what I should focus on next?",
    emoji: "📊"
  },
  {
    icon: <Target size={14} />,
    text: "Set goals",
    type: "goal_setting" as const,
    prompt: "I need help setting achievable goals and breaking them into daily actions.",
    emoji: "🎯"
  },
  {
    icon: <Sparkles size={14} />,
    text: "Motivate me",
    type: "motivation" as const,
    prompt: "I'm feeling unmotivated today. Can you help me get back on track?",
    emoji: "💪"
  },
  {
    icon: <MessageCircle size={14} />,
    text: "Productivity tips",
    type: "general" as const,
    prompt: "What are some practical productivity tips for staying consistent with daily progress?",
    emoji: "💡"
  }
]

const GROWWLY_ANIMATIONS = ["🌱", "🌿", "🌳", "🚀", "⭐", "✨", "💫", "🎯", "💪", "🔥"]

// Function to parse and render markdown-like text
const parseMarkdown = (text: string) => {
  // Split text by ** for bold formatting
  const parts = text.split(/(\*\*.*?\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** and make bold
      const boldText = part.slice(2, -2)
      return <strong key={index} className="font-semibold">{boldText}</strong>
    }
    return part
  })
}

// Component to render message content with markdown support
const MessageContent = ({ content }: { content: string }) => {
  const lines = content.split('\n')
  
  return (
    <div className="space-y-1">
      {lines.map((line, lineIndex) => {
        if (line.trim() === '') {
          return <br key={lineIndex} />
        }
        
        return (
          <div key={lineIndex} className="leading-relaxed">
            {parseMarkdown(line)}
          </div>
        )
      })}
    </div>
  )
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'fallback' | 'error'>('connected')
  const [isTyping, setIsTyping] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState(0)
  const [showSparkles, setShowSparkles] = useState(false)
  const [isMinimizing, setIsMinimizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debug logging
  useEffect(() => {
    console.log('AIAssistant isOpen changed:', isOpen)
  }, [isOpen])

  // Add welcome message when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      console.log('Adding welcome message...')
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi there! 👋 I'm **Growwly**, your personal growth companion! 🌱\n\nI'm here to help you:\n\n🎯 **Analyze your progress** and identify patterns\n💪 **Set achievable goals** and break them down\n🚀 **Stay motivated** on your journey\n💡 **Share productivity tips** and strategies\n\nWhat would you like to work on today? Let's grow together! ✨`,
        timestamp: new Date(),
        type: 'general'
      }
      setMessages([welcomeMessage])
      // Trigger sparkles animation for welcome
      setShowSparkles(true)
      setTimeout(() => setShowSparkles(false), 2000)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Animation cycle for Growwly avatar
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentAnimation(prev => (prev + 1) % GROWWLY_ANIMATIONS.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (content: string, type: string = 'general') => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      type: type as any
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setConnectionStatus('connected')

    try {
      console.log('Sending request to Growwly AI...')
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            context: `User is using Growwly progress tracking app. They have been tracking their daily achievements.`,
            type: type
          }),
        }
      )

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Response data:', data)

      const assistantResponse = data.response || "I'm here to help! Try asking me about goal setting, motivation, or productivity tips."
      
      // Create the final message with complete response
      const finalMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        type: type as any,
        isFallback: data.fallback || false
      }

      // Add the complete message directly (no typing animation)
      setMessages(prev => [...prev, finalMessage])
      
      if (data.fallback) {
        setConnectionStatus('fallback')
      } else {
        setConnectionStatus('connected')
        // Trigger success animation
        setShowSparkles(true)
        setTimeout(() => setShowSparkles(false), 1500)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setConnectionStatus('error')
      
      const errorResponse = "I'm having some technical difficulties, but I'm still here to help! 🤖 Try asking me about setting goals, staying motivated, or productivity strategies. I'll do my best to provide helpful guidance!"
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorResponse,
        timestamp: new Date(),
        type: type as any,
        isFallback: true
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handleQuickPrompt = (prompt: typeof QUICK_PROMPTS[0]) => {
    sendMessage(prompt.prompt, prompt.type)
  }

  const handleMinimize = () => {
    console.log('🔽 AIAssistant: Minimizing to header...')
    setIsMinimizing(true)
    
    // Dispatch event to show minimized version in header
    window.dispatchEvent(new CustomEvent('growwly-minimize'))
    
    // Close the modal after animation
    setTimeout(() => {
      onClose()
      setIsMinimizing(false)
    }, 600)
  }

  const handleClose = () => {
    console.log('❌ AIAssistant: Closing completely (X button clicked)')
    // Dispatch event to close everything including header
    window.dispatchEvent(new CustomEvent('growwly-close-all'))
    onClose()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 dark:text-green-400'
      case 'fallback': return 'text-yellow-600 dark:text-yellow-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Growwly is online'
      case 'fallback': return 'Offline mode'
      case 'error': return 'Connection issues'
      default: return 'Ready to help you grow'
    }
  }

  // Growwly Face Component with proper sizing and white eye backgrounds
  const GrowwlyFace = ({ size = 'w-12 h-12', className = '' }) => (
    <div className={`${size} ${className} relative overflow-hidden rounded-lg`}>
      {/* Background container */}
      <div className="w-full h-full bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center">
        {/* Growwly's pixelated face with proper sizing */}
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
            imageRendering: 'pixelated',
            backgroundSize: 'contain'
          }}
        />
        
        {/* White backgrounds for eyes - positioned over the black eye areas */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left eye white background */}
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
          {/* Right eye white background */}
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
        
        {/* Growwly face overlay to show on top of white backgrounds */}
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
    </div>
  )

  console.log('AIAssistant render - isOpen:', isOpen)

  if (!isOpen) return null

  // Full modal view with minimize animation - MOBILE RESPONSIVE
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-all duration-600 ${
        isMinimizing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        // Mobile: full screen padding
        padding: window.innerWidth <= 768 ? '8px' : '16px'
      }}
    >
      <div className={`bg-white dark:bg-black border border-black dark:border-white mx-auto relative flex flex-col transition-all duration-600 ${
        isMinimizing 
          ? 'transform scale-50 translate-y-[-200px] translate-x-[-300px] opacity-0' 
          : 'animate-fade-in-up scale-100 translate-y-0 translate-x-0 opacity-100'
      } ${
        // Mobile: full screen, Desktop: constrained
        window.innerWidth <= 768 
          ? 'w-full h-full max-w-none max-h-none' 
          : 'w-full max-w-2xl h-[90vh] max-h-[600px]'
      }`}>
        {/* Header with Growwly branding - MOBILE RESPONSIVE */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative">
              {/* Growwly's Face with proper sizing and white eye backgrounds */}
              <GrowwlyFace 
                size="w-10 h-10 sm:w-12 sm:h-12"
                className={`transition-all duration-500 ${
                  isLoading ? 'animate-pulse scale-110' : 'hover:scale-105'
                }`}
              />
              
              {/* Status indicator */}
              <div className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-black transition-all duration-300 ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'fallback' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              
              {/* Sparkles animation */}
              {showSparkles && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent truncate">
                Growwly AI Assistant
              </h2>
              <p className={`text-xs transition-all duration-300 ${getStatusColor()} truncate`}>
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader size={8} className="sm:w-2.5 sm:h-2.5 animate-spin" />
                    <span className="hidden sm:inline">Thinking...</span>
                    <span className="sm:hidden">...</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline">{getStatusText()}</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {connectionStatus === 'fallback' && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 animate-pulse">
                <AlertCircle size={10} className="sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}
            
            {/* Desktop only minimize button */}
            <button
              onClick={handleMinimize}
              className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110"
              title="Minimize to header"
            >
              <Minimize2 size={16} />
            </button>
            
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110 hover:text-red-500"
              title="Close completely"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Messages - MOBILE RESPONSIVE */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-3 animate-fade-in-up ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                  : ''
              }`}>
                {message.role === 'user' ? (
                  <User size={12} className="sm:w-4 sm:h-4 text-white" />
                ) : (
                  <GrowwlyFace size="w-6 h-6 sm:w-8 sm:h-8" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-2 sm:p-3 rounded-lg transition-all duration-300 hover:shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : message.isFallback
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 text-gray-900 dark:text-gray-100 border border-yellow-200 dark:border-yellow-700'
                    : 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-gray-900 dark:text-gray-100 border border-green-200 dark:border-green-700'
                }`}>
                  <div className="text-xs sm:text-sm">
                    {/* FIXED: Use MessageContent component to properly render markdown */}
                    <MessageContent content={message.content} />
                  </div>
                  {message.isFallback && (
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 flex items-center gap-1">
                      <AlertCircle size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span className="hidden sm:inline">Offline response</span>
                      <span className="sm:hidden">Offline</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* FIXED: Only show loading indicator when actually loading, no double typing */}
          {isLoading && (
            <div className="flex gap-2 sm:gap-3 animate-fade-in-up">
              <GrowwlyFace size="w-6 h-6 sm:w-8 sm:h-8" />
              <div className="flex-1">
                <div className="inline-block p-2 sm:p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="hidden sm:inline">Growwly is thinking...</span>
                      <span className="sm:hidden">Thinking...</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts - MOBILE RESPONSIVE */}
        {messages.length <= 1 && (
          <div className="px-3 sm:px-4 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 flex items-center gap-1">
              <Zap size={10} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Quick actions to get started:</span>
              <span className="sm:hidden">Quick actions:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {QUICK_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 hover:from-green-200 hover:to-blue-200 dark:hover:from-green-800/30 dark:hover:to-blue-800/30 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 border border-green-200 dark:border-green-700 min-h-[36px] sm:min-h-[40px]"
                >
                  <span className="text-xs sm:text-sm flex-shrink-0">{prompt.emoji}</span>
                  <span className="flex-1 text-left truncate text-xs sm:text-sm">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - MOBILE RESPONSIVE */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={window.innerWidth <= 768 ? "Ask Growwly..." : "Ask Growwly about goals, motivation, or productivity..."}
              className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 hover:scale-105 shadow-lg"
            >
              {isLoading ? (
                <Loader size={14} className="sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Send size={14} className="sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline text-sm">Send</span>
            </button>
          </form>
          
          {connectionStatus === 'fallback' && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1 animate-pulse">
              <AlertCircle size={8} className="sm:w-2.5 sm:h-2.5" />
              <span className="hidden sm:inline">Growwly is offline, but still providing helpful guidance!</span>
              <span className="sm:hidden">Offline mode active</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            💚 <span className="hidden sm:inline">Growwly is here to help you grow every day</span>
            <span className="sm:hidden">Here to help you grow</span>
          </div>
        </div>
      </div>
    </div>
  )
}
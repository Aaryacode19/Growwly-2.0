import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Bot, Sparkles, Zap } from 'lucide-react'
import { AIAssistant } from './AIAssistant'

export function BotButton() {
  const [showAssistant, setShowAssistant] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Listen for events from header
  useEffect(() => {
    const handleExpandFromHeader = () => {
      console.log('🔼 BotButton: Expand from header event received')
      setShowAssistant(true)
    }

    const handleCloseFromHeader = () => {
      console.log('❌ BotButton: Close from header event received')
      setShowAssistant(false)
    }

    window.addEventListener('growwly-expand-from-header', handleExpandFromHeader)
    window.addEventListener('growwly-close-all', handleCloseFromHeader)
    
    return () => {
      window.removeEventListener('growwly-expand-from-header', handleExpandFromHeader)
      window.removeEventListener('growwly-close-all', handleCloseFromHeader)
    }
  }, [])

  // Growwly Face Component for floating button
  const GrowwlyFaceButton = () => (
    <div 
      style={{
        width: '64px',
        height: '64px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '50%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Background container */}
      <div 
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Growwly's face */}
        <div 
          style={{
            width: '56px',
            height: '56px',
            backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated'
          }}
        />
        
        {/* White backgrounds for eyes */}
        <div 
          style={{
            position: 'absolute',
            inset: '0',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '56px', height: '56px' }}>
            {/* Left eye white background */}
            <div 
              style={{
                position: 'absolute',
                left: '28%',
                top: '38%',
                width: '12%',
                height: '12%',
                backgroundColor: 'white',
                borderRadius: '2px',
                zIndex: 1
              }}
            />
            {/* Right eye white background */}
            <div 
              style={{
                position: 'absolute',
                right: '28%',
                top: '38%',
                width: '12%',
                height: '12%',
                backgroundColor: 'white',
                borderRadius: '2px',
                zIndex: 1
              }}
            />
            
            {/* Growwly face overlay */}
            <div 
              style={{
                position: 'absolute',
                inset: '0',
                width: '100%',
                height: '100%',
                backgroundImage: `url('/ChatGPT Image Jun 29, 2025, 11_39_23 AM.png')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                zIndex: 2,
                mixBlendMode: 'multiply'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const handleCloseAssistant = () => {
    console.log('🔽 BotButton: Assistant closed - minimizing to header')
    setShowAssistant(false)
    // Notify Layout to show header version
    window.dispatchEvent(new CustomEvent('growwly-minimize'))
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Floating Growwly Button - Simple Fixed Position */}
      <div 
        ref={buttonRef}
        className="fixed bottom-6 right-6 z-[9999]"
        style={{
          // Ensure it stays in place during theme changes
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
      >
        {/* Floating particles animation */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )}
        
        <button
          onClick={() => setShowAssistant(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative block bg-transparent border-0 p-0 m-0 cursor-pointer transition-transform duration-500 overflow-hidden hover:scale-110"
          title="Chat with Growwly AI"
        >
          {/* Background glow effect */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 rounded-full transition-opacity duration-500 ${
              isHovered ? 'opacity-20 animate-pulse' : 'opacity-0'
            }`}
          />
          
          {/* Main Growwly Face */}
          <div className="relative z-10">
            <GrowwlyFaceButton />
          </div>
          
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-500 rounded-full opacity-20 animate-ping" />
            <div 
              className="absolute inset-2 bg-gradient-to-br from-green-400 to-blue-400 rounded-full opacity-30 animate-ping"
              style={{ animationDelay: '0.5s' }}
            />
          </div>
          
          {/* Sparkle effect on hover */}
          {isHovered && (
            <div className="absolute inset-0 pointer-events-none">
              <Sparkles 
                className="absolute top-1 right-1 w-3 h-3 text-yellow-300 animate-pulse"
              />
              <Zap 
                className="absolute bottom-1 left-1 w-3 h-3 text-blue-300 animate-bounce"
              />
            </div>
          )}
        </button>

        {/* Tooltip */}
        <div 
          className={`absolute bottom-full right-0 mb-2 px-3 py-1 bg-black text-white text-xs rounded whitespace-nowrap transition-all duration-300 pointer-events-none ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          Chat with Growwly AI 🌱
          <div className="absolute top-full right-4 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black" />
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={showAssistant} 
        onClose={handleCloseAssistant} 
      />
    </>
  )
}
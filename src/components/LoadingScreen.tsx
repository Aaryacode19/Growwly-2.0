import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  onLoadingComplete: () => void
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Simulate loading time (you can adjust this or make it depend on actual loading)
    const timer = setTimeout(() => {
      setIsVisible(false)
      // Wait for fade out animation to complete
      setTimeout(() => {
        onLoadingComplete()
      }, 500)
    }, 2000) // Show for 2 seconds

    return () => clearTimeout(timer)
  }, [onLoadingComplete])

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-black z-[10000] flex items-center justify-center transition-opacity duration-500 opacity-0 pointer-events-none">
        <div className="text-center">
          <h1 className="text-2xl font-semibold font-mono mb-6">Growwly</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-[10000] flex items-center justify-center transition-opacity duration-500">
      <div className="text-center">
        <h1 className="text-2xl font-semibold font-mono mb-6">Growwly</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-black dark:bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
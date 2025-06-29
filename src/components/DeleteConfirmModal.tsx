import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  progressEntry: {
    heading: string
    date: string
  }
}

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading, 
  progressEntry 
}: DeleteConfirmModalProps) {
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%' })

  // Position modal based on current scroll position
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Calculate optimal position based on scroll and viewport
      const topPosition = Math.max(scrollY + 100, scrollY + (viewportHeight * 0.1))
      
      setModalPosition({
        top: `${topPosition}px`,
        left: '50%'
      })
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      // Restore body scroll when modal closes
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-start justify-center"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div 
        className="bg-white dark:bg-black border border-black dark:border-white p-4 sm:p-6 w-full max-w-md mx-4 relative animate-fade-in-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: modalPosition.top,
          left: modalPosition.left,
          transform: 'translateX(-50%)',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50 z-10"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-2">Delete Progress Entry</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Are you sure you want to delete this progress entry? This action cannot be undone.
          </p>
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-left">
            <p className="font-medium text-sm truncate">{progressEntry.heading}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {progressEntry.date}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 sm:py-3 border border-red-600 hover:bg-red-700 hover:border-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
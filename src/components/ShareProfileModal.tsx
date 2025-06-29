import { useState, useEffect } from 'react'
import { X, Share2, Copy, Check, Twitter, Facebook, Linkedin } from 'lucide-react'
import { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ShareProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  stats: {
    totalEntries: number
    currentStreak: number
    uniqueDays: number
    totalPoints: number
  }
}

export function ShareProfileModal({ isOpen, onClose, profile, stats }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Capture scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      setScrollPosition(window.scrollY)
    }
  }, [isOpen])

  // Generate the correct profile URL
  const profileUrl = `${window.location.origin}/profile/${profile.id}`
  
  const shareText = `Check out my progress on Growwly! 🚀\n\n` +
    `📊 ${stats.totalEntries} total entries\n` +
    `🔥 ${stats.currentStreak} day streak\n` +
    `🎯 ${stats.uniqueDays} active days\n` +
    `🏆 ${stats.totalPoints} achievement points\n\n` +
    `Join me in tracking daily progress: ${profileUrl}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = profileUrl
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleSocialShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText)
    const encodedUrl = encodeURIComponent(profileUrl)
    
    let shareUrl = ''
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(shareText)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name || 'User'}'s Progress on Growwly`,
          text: shareText,
          url: profileUrl,
        })
      } catch (error) {
        // User cancelled or error occurred, fallback to copy
        handleCopyLink()
      }
    } else {
      // Fallback to copy
      handleCopyLink()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4"
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
        className="w-full h-full flex items-start justify-center overflow-y-auto"
        style={{
          paddingTop: `${Math.max(scrollPosition + 20, 20)}px`,
          paddingBottom: '20px'
        }}
      >
        <div className="card w-full max-w-md relative my-8 mx-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Share Your Profile</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Show others your progress and achievements
            </p>
          </div>

          {/* Profile Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg mb-6">
            <div className="text-center">
              <div className="font-semibold text-lg mb-2">
                {profile.full_name || 'Anonymous User'}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalEntries}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Entries</div>
                </div>
                <div>
                  <div className="font-bold text-orange-600 dark:text-orange-400">
                    {stats.currentStreak}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
                <div>
                  <div className="font-bold text-green-600 dark:text-green-400">
                    {stats.uniqueDays}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Active Days</div>
                </div>
                <div>
                  <div className="font-bold text-purple-600 dark:text-purple-400">
                    {stats.totalPoints}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Share Button (Mobile-friendly) */}
          <div className="mb-6">
            <button
              onClick={handleNativeShare}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
            >
              <Share2 size={16} />
              Share Profile
            </button>
          </div>

          {/* Copy Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Profile Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="input-field flex-1 text-sm"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopyLink}
                className="btn-secondary flex items-center gap-2 px-3 py-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Share on Social Media
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocialShare('twitter')}
                className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Twitter size={20} className="text-blue-500" />
                <span className="text-xs">Twitter</span>
              </button>
              
              <button
                onClick={() => handleSocialShare('facebook')}
                className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Facebook size={20} className="text-blue-600" />
                <span className="text-xs">Facebook</span>
              </button>
              
              <button
                onClick={() => handleSocialShare('linkedin')}
                className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Linkedin size={20} className="text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Share Text Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Share Message Preview
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {shareText}
              </pre>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

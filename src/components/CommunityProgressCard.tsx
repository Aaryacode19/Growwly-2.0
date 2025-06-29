import { useState, useEffect } from 'react'
import { Database } from '../lib/database.types'
import { Calendar, ExternalLink, ChevronDown, ChevronUp, Heart, MessageCircle, User, MoreHorizontal, Share2, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

type ProgressEntry = Database['public']['Tables']['daily_progress']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Interaction = Database['public']['Tables']['community_interactions']['Row']

interface CommunityProgressCardProps {
  progress: ProgressEntry & { profiles: Profile }
  showUserInfo?: boolean
  allowSharing?: boolean
}

export function CommunityProgressCard({ progress, showUserInfo = true, allowSharing = false }: CommunityProgressCardProps) {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [userLike, setUserLike] = useState<Interaction | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (progress.visibility === 'public') {
      fetchInteractions()
    }
  }, [progress.id])

  const fetchInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('community_interactions')
        .select('*')
        .eq('progress_id', progress.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setInteractions(data || [])
      
      // Find user's like if they're authenticated
      if (user) {
        const like = data?.find(i => i.user_id === user.id && i.type === 'like')
        setUserLike(like || null)
      }
    } catch (error) {
      console.error('Error fetching interactions:', error)
    }
  }

  const handleLike = async () => {
    if (!user || progress.visibility !== 'public') return

    setLoading(true)
    try {
      if (userLike) {
        // Unlike
        const { error } = await supabase
          .from('community_interactions')
          .delete()
          .eq('id', userLike.id)

        if (error) throw error
        setUserLike(null)
      } else {
        // Like
        const { data, error } = await supabase
          .from('community_interactions')
          .insert({
            user_id: user.id,
            progress_id: progress.id,
            type: 'like'
          })
          .select()
          .single()

        if (error) throw error
        setUserLike(data)
      }

      await fetchInteractions()
    } catch (error) {
      console.error('Error handling like:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim() || progress.visibility !== 'public') return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('community_interactions')
        .insert({
          user_id: user.id,
          progress_id: progress.id,
          type: 'comment',
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await fetchInteractions()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?post=${progress.id}`
    const shareText = `Check out this progress update: "${progress.heading}" on Growwly!`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: progress.heading,
          text: shareText,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
    setShowShareMenu(false)
  }

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/?post=${progress.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
    setShowShareMenu(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const shouldTruncate = progress.description && progress.description.length > 200
  const likes = interactions.filter(i => i.type === 'like')
  const comments = interactions.filter(i => i.type === 'comment')

  return (
    <article className="card mb-4 sm:mb-6 group hover:shadow-lg transition-all duration-300 relative">
      {/* User Info Header - Responsive */}
      {showUserInfo && (
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Link 
            to={`/profile/${progress.profiles.id}`}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {progress.profiles.avatar_url ? (
                <img
                  src={progress.profiles.avatar_url}
                  alt={progress.profiles.full_name || 'User'}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
              ) : (
                <User size={16} className="sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-xs sm:text-sm">
                {progress.profiles.full_name || 'Anonymous User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(progress.created_at)}
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Share Button - Smaller on Mobile */}
            {(allowSharing || progress.visibility === 'public') && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Share this post"
                >
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                </button>
                
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-black border border-black dark:border-white shadow-lg rounded z-10 min-w-[120px] sm:min-w-[140px]">
                    <button 
                      onClick={handleShare}
                      className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                      <Share2 size={12} className="sm:w-3.5 sm:h-3.5" />
                      Share Post
                    </button>
                    <button 
                      onClick={handleCopyLink}
                      className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check size={12} className="sm:w-3.5 sm:h-3.5" /> : <Copy size={12} className="sm:w-3.5 sm:h-3.5" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* More Menu - Smaller on Mobile */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <MoreHorizontal size={14} className="sm:w-4 sm:h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-black border border-black dark:border-white shadow-lg rounded z-10 min-w-[100px] sm:min-w-[120px]">
                    <button className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      Report
                    </button>
                    <button className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      Block User
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <Calendar size={14} className="sm:w-4 sm:h-4" />
        <span>{formatDate(progress.date)}</span>
        {progress.visibility === 'private' && (
          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Private</span>
        )}
      </div>
      
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        {progress.heading}
      </h2>
      
      {progress.description && (
        <div className="mb-3 sm:mb-4">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {isExpanded || !shouldTruncate 
              ? progress.description 
              : truncateText(progress.description, 200)
            }
          </p>
          
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} className="sm:w-4 sm:h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {progress.image_url && (
        <div className="mb-3 sm:mb-4">
          <img
            src={progress.image_url}
            alt="Progress image"
            className="w-full max-h-64 sm:max-h-96 object-cover border border-black dark:border-white rounded hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
            onClick={() => window.open(progress.image_url!, '_blank')}
          />
        </div>
      )}
      
      {progress.video_url && (
        <div className="mb-3 sm:mb-4">
          <a
            href={progress.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-black dark:text-white hover:underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium text-sm sm:text-base"
          >
            <ExternalLink size={14} className="sm:w-4 sm:h-4" />
            View Link
          </a>
        </div>
      )}

      {/* Interaction Bar - Only for public posts or when sharing is allowed */}
      {(progress.visibility === 'public' || allowSharing) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mt-3 sm:mt-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span>{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
              <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && progress.visibility === 'public' && (
              <button
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors text-xs sm:text-sm ${
                  userLike
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Heart size={14} className={`sm:w-4 sm:h-4 ${userLike ? 'fill-current' : ''}`} />
                <span>Like</span>
              </button>
            )}

            {user && progress.visibility === 'public' && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs sm:text-sm"
              >
                <MessageCircle size={14} className="sm:w-4 sm:h-4" />
                <span>Comment</span>
              </button>
            )}
          </div>

          {/* Comments Section - Only for public posts */}
          {showComments && progress.visibility === 'public' && (
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={12} className="sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                      <div className="font-medium text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Anonymous User
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        {comment.content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(comment.created_at)}
                    </div>
                  </div>
                </div>
              ))}

              {user && (
                <form onSubmit={handleComment} className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={12} className="sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 flex gap-1 sm:gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    <button
                      type="submit"
                      disabled={loading || !newComment.trim()}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
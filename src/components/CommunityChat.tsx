import { useState, useEffect, useRef } from 'react'
import { Database } from '../lib/database.types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Send, User, Trash2, Menu, Smile } from 'lucide-react'

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface ChatMessageWithProfile extends ChatMessage {
  profiles: Profile
}

export function CommunityChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageWithProfile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMobileActions, setShowMobileActions] = useState<string | null>(null)
  const [deletingMessages, setDeletingMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new message to the list
            fetchMessages()
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted message from the list instantly
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            // Update existing message
            fetchMessages()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  // Close mobile actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileActions && !(event.target as Element).closest('.message-actions')) {
        setShowMobileActions(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMobileActions])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      
      setMessages(data as ChatMessageWithProfile[] || [])
    } catch (error) {
      // Silent error handling for production
    }
  }

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || loading) return

    const messageText = newMessage.trim()
    
    // Clear input immediately and add optimistic message
    setNewMessage('')
    
    // Add optimistic message to UI
    const optimisticMessage: ChatMessageWithProfile = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'You',
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null,
        location: null,
        website: null,
        profile_visibility: 'public',
        show_join_date: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: messageText
        })

      if (error) throw error

      // Focus back to input on mobile after sending
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 100)
      }
      
      // Fetch fresh messages to replace optimistic update
      setTimeout(() => {
        fetchMessages()
      }, 500)
      
    } catch (error) {
      // Remove optimistic message and restore input on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      setNewMessage(messageText)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    // Add to deleting set for UI feedback
    setDeletingMessages(prev => new Set(prev).add(messageId))
    setShowMobileActions(null)
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      
      // Remove message from UI immediately (don't wait for real-time update)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      
    } catch (error) {
      // Silent error handling for production
    } finally {
      // Remove from deleting set
      setDeletingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const isOwnMessage = (message: ChatMessageWithProfile) => {
    return user?.id === message.user_id
  }

  const handleMessageLongPress = (messageId: string) => {
    if (window.innerWidth <= 768) {
      setShowMobileActions(showMobileActions === messageId ? null : messageId)
    }
  }

  // Quick emoji reactions for mobile
  const quickEmojis = ['👍', '❤️', '😊', '🎉', '👏']

  // Dynamic height based on screen size
  const getChatHeight = () => {
    if (window.innerWidth <= 768) {
      return '75vh' // Larger on mobile
    }
    return '70vh' // Desktop size
  }

  const getMaxHeight = () => {
    if (window.innerWidth <= 768) {
      return '600px' // Larger max height on mobile
    }
    return '600px'
  }

  const getMinHeight = () => {
    if (window.innerWidth <= 768) {
      return '450px' // Larger min height on mobile
    }
    return '400px'
  }

  return (
    <div className="card !p-0 flex flex-col" style={{ 
      height: getChatHeight(),
      maxHeight: getMaxHeight(),
      minHeight: getMinHeight()
    }}>
      {/* Chat Header - Compact for Mobile */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base sm:text-lg">Community Chat</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="hidden sm:inline">Connect with fellow achievers • </span>
              {messages.length} messages
            </p>
          </div>
          
          {/* Mobile Chat Info */}
          <div className="sm:hidden">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length > 0 && `${messages.length} msgs`}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - NO SCROLLBAR */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-hide"
        style={{ 
          scrollBehavior: 'smooth',
          overflowAnchor: 'auto',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">
              No messages yet. Start the conversation!
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Share your thoughts or encourage others
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isDeleting = deletingMessages.has(message.id)
            
            return (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 group relative transition-all duration-300 ${
                  isOwnMessage(message) ? 'flex-row-reverse' : ''
                } ${isDeleting ? 'opacity-50 scale-95' : ''}`}
                onTouchStart={() => {
                  // Handle long press on mobile for own messages only
                  if (isOwnMessage(message)) {
                    const timer = setTimeout(() => {
                      handleMessageLongPress(message.id)
                    }, 500)
                    
                    const cleanup = () => {
                      clearTimeout(timer)
                      document.removeEventListener('touchend', cleanup)
                      document.removeEventListener('touchmove', cleanup)
                    }
                    
                    document.addEventListener('touchend', cleanup)
                    document.addEventListener('touchmove', cleanup)
                  }
                }}
              >
                {/* Avatar - Responsive Size */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  {message.profiles.avatar_url ? (
                    <img
                      src={message.profiles.avatar_url}
                      alt={message.profiles.full_name || 'User'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User size={14} className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>

                {/* Message Content - Better Mobile Sizing */}
                <div className={`flex-1 max-w-[85%] sm:max-w-[70%] ${isOwnMessage(message) ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-1 sm:gap-2 mb-1 ${isOwnMessage(message) ? 'justify-end' : ''}`}>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] sm:max-w-none">
                      {isOwnMessage(message) ? 'You' : (message.profiles.full_name || 'Anonymous')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatTime(message.created_at)}
                    </span>
                    
                    {/* Desktop Message Actions - ONLY DELETE */}
                    {isOwnMessage(message) && (
                      <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1">
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={isDeleting}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble - Better Mobile Sizing */}
                  <div
                    className={`inline-block px-3 sm:px-4 py-2 rounded-lg text-sm break-words leading-relaxed ${
                      isOwnMessage(message)
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    } ${message.id.startsWith('temp-') ? 'opacity-70' : ''}`}
                  >
                    {message.message}
                    {message.updated_at !== message.created_at && (
                      <span className="text-xs opacity-60 ml-2">(edited)</span>
                    )}
                  </div>

                  {/* Mobile Actions Menu - ONLY DELETE */}
                  {showMobileActions === message.id && isOwnMessage(message) && (
                    <div className="sm:hidden absolute top-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 message-actions">
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 w-full text-left disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Better Mobile Layout */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* Quick Emoji Bar for Mobile - Better Sizing */}
        <div className="sm:hidden flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setNewMessage(prev => prev + emoji)}
              className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 self-end mb-1">
            <User size={14} className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                maxLength={500}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              
              {/* Character Counter for Mobile */}
              {newMessage.length > 400 && (
                <div className="absolute -top-6 right-0 text-xs text-gray-500 dark:text-gray-400">
                  {newMessage.length}/500
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
            >
              <Send size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm">Send</span>
            </button>
          </div>
        </form>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center sm:text-left">
          <span className="hidden sm:inline">Press Enter to send • </span>
          Be respectful and encouraging
        </div>
      </div>
    </div>
  )
}
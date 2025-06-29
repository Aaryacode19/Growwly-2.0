import { useState } from 'react'
import { Database } from '../lib/database.types'
import { Calendar, ExternalLink, ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DeleteConfirmModal } from './DeleteConfirmModal'

type ProgressEntry = Database['public']['Tables']['daily_progress']['Row']

interface ProgressCardProps {
  progress: ProgressEntry
  onDelete?: (id: string) => void
}

export function ProgressCard({ progress, onDelete }: ProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

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

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    
    try {
      const { error } = await supabase
        .from('daily_progress')
        .delete()
        .eq('id', progress.id)

      if (error) throw error

      // Call the onDelete callback to update the parent component
      if (onDelete) {
        onDelete(progress.id)
      }
    } catch (error) {
      setError('Failed to delete progress entry. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const shouldTruncate = progress.description && progress.description.length > 200

  return (
    <>
      <article className="card mb-4 sm:mb-6 group hover:shadow-lg transition-all duration-300 relative">
        {/* Visibility Indicator & Delete Button - Responsive */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1 sm:gap-2">
          {/* Visibility indicator */}
          <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-xs ${
            progress.visibility === 'public' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {progress.visibility === 'public' ? (
              <>
                <Eye size={10} className="sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Public</span>
              </>
            ) : (
              <>
                <EyeOff size={10} className="sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Private</span>
              </>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 z-10"
            title="Delete this progress entry"
          >
            <Trash2 size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} className="sm:w-4 sm:h-4" />
          <span>{formatDate(progress.date)}</span>
          <span className="text-xs opacity-60 ml-1 sm:ml-2">
            {formatTime(progress.created_at)}
          </span>
        </div>
        
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 hover:text-gray-700 dark:hover:text-gray-300 transition-colors pr-16 sm:pr-24">
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

        {error && (
          <div className="text-red-600 text-xs sm:text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded mt-3 sm:mt-4">
            {error}
          </div>
        )}
      </article>

      {/* Delete Confirmation Modal - Rendered at root level */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        progressEntry={{
          heading: progress.heading,
          date: formatDate(progress.date)
        }}
      />
    </>
  )
}
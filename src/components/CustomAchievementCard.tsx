import { useState } from 'react'
import { Calendar, ExternalLink, Award, Edit3, Trash2, Star, StarOff } from 'lucide-react'

interface CustomAchievement {
  id: string
  title: string
  description: string
  date_earned: string
  certificate_id?: string
  external_link?: string
  category: string
  issuer: string
  skills: string[]
  is_featured: boolean
  created_at: string
}

interface CustomAchievementCardProps {
  achievement: CustomAchievement
  onEdit?: () => void
  onDelete?: () => void
  onToggleFeatured?: () => void
  showActions?: boolean
}

export function CustomAchievementCard({ 
  achievement, 
  onEdit, 
  onDelete, 
  onToggleFeatured,
  showActions = false 
}: CustomAchievementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Education': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'Certification': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'Competition': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'Project': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'Skill': 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      'Award': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'Course': 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
      'Workshop': 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      'Conference': 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
      'Other': 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
    }
    return colors[category as keyof typeof colors] || colors.Other
  }

  return (
    <div className={`card relative transition-all duration-300 hover:shadow-lg ${
      achievement.is_featured ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''
    }`}>
      {/* Featured Badge */}
      {achievement.is_featured && (
        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center z-10">
          <Star size={10} className="sm:w-3 sm:h-3 text-yellow-800 dark:text-yellow-900 fill-current" />
        </div>
      )}

      {/* Actions Menu - FIXED POSITIONING */}
      {showActions && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1 z-20">
          {onToggleFeatured && (
            <button
              onClick={onToggleFeatured}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                achievement.is_featured
                  ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={achievement.is_featured ? 'Remove from featured' : 'Add to featured'}
            >
              {achievement.is_featured ? <StarOff size={12} className="sm:w-4 sm:h-4" /> : <Star size={12} className="sm:w-4 sm:h-4" />}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              title="Edit achievement"
            >
              <Edit3 size={12} className="sm:w-4 sm:h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Delete achievement"
            >
              <Trash2 size={12} className="sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      )}

      {/* Header - FIXED FOR MOBILE */}
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0 pr-12 sm:pr-16">
          {/* Title and Category Row - RESPONSIVE LAYOUT */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <h3 className="font-semibold text-base sm:text-lg truncate flex-1 min-w-0">
              {achievement.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 w-fit ${getCategoryColor(achievement.category)}`}>
              {achievement.category}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
            {achievement.issuer}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="truncate">{formatDate(achievement.date_earned)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3 sm:mb-4">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
          {isExpanded || achievement.description.length <= 150 
            ? achievement.description 
            : `${achievement.description.substring(0, 150)}...`
          }
        </p>
        {achievement.description.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Skills */}
      {achievement.skills.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skills & Technologies
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {achievement.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certificate ID */}
      {achievement.certificate_id && (
        <div className="mb-3 sm:mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Certificate ID
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded break-all">
            {achievement.certificate_id}
          </div>
        </div>
      )}

      {/* Actions */}
      {achievement.external_link && (
        <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.open(achievement.external_link, '_blank')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          >
            <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
            <span>Verify Online</span>
          </button>
        </div>
      )}
    </div>
  )
}
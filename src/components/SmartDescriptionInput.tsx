import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface SmartDescriptionInputProps {
  title: string
  value: string
  onChange: (value: string) => void
  className?: string
}

// Pattern-based suggestion templates
const SUGGESTION_PATTERNS = {
  workout: {
    keywords: ['workout', 'exercise', 'gym', 'fitness', 'training', 'run', 'jog', 'yoga', 'cardio', 'strength'],
    suggestions: [
      "What exercises did you focus on today? How did you feel during and after the workout?",
      "What was your biggest challenge or achievement? How long did you exercise?",
      "What motivated you to complete this workout? Any new personal records?",
      "Which muscle groups did you target? What was the intensity level?",
      "How did this workout compare to previous sessions? What improvements did you notice?"
    ]
  },
  learning: {
    keywords: ['learn', 'study', 'course', 'book', 'read', 'tutorial', 'skill', 'practice', 'coding', 'programming'],
    suggestions: [
      "What specific concepts or skills did you focus on? What was most interesting?",
      "How will you apply what you learned today? What challenges did you encounter?",
      "What resources were most helpful? How does this connect to your goals?",
      "What was the most surprising discovery? What questions do you still have?",
      "How does this new knowledge build on what you already knew?"
    ]
  },
  work: {
    keywords: ['work', 'project', 'meeting', 'task', 'deadline', 'client', 'team', 'presentation', 'code', 'design'],
    suggestions: [
      "What specific tasks or milestones did you complete? What obstacles did you overcome?",
      "How did you collaborate with others? What tools proved most effective?",
      "What would you do differently next time? How does this contribute to larger goals?",
      "What was the most challenging part? How did you solve any problems?",
      "What feedback did you receive? What are the next steps?"
    ]
  },
  creative: {
    keywords: ['create', 'design', 'art', 'write', 'music', 'photo', 'video', 'draw', 'paint', 'compose'],
    suggestions: [
      "What inspired this creative work? What techniques did you experiment with?",
      "How did you overcome creative blocks? What aspects are you most proud of?",
      "What feedback have you received? How does this reflect your artistic growth?",
      "What was your creative process like? What tools or materials did you use?",
      "How does this piece express your vision or message?"
    ]
  },
  health: {
    keywords: ['health', 'diet', 'nutrition', 'sleep', 'meditation', 'mindfulness', 'wellness', 'doctor', 'therapy'],
    suggestions: [
      "How did you prioritize your wellbeing today? What healthy choices did you make?",
      "How are you feeling physically and mentally? What self-care practices helped?",
      "What positive changes have you noticed? How are you maintaining balance?",
      "What wellness goals are you working toward? What strategies are working best?",
      "How did this contribute to your overall health journey?"
    ]
  },
  social: {
    keywords: ['friend', 'family', 'social', 'community', 'volunteer', 'help', 'support', 'connect', 'relationship'],
    suggestions: [
      "How did you connect with others today? What meaningful conversations did you have?",
      "How did you support or help someone? What did you learn from interactions?",
      "How are you building stronger relationships? What impact did you have?",
      "What social activities brought you joy? How did you contribute to your community?",
      "What connections or bonds were strengthened today?"
    ]
  },
  personal: {
    keywords: ['goal', 'habit', 'routine', 'organize', 'plan', 'reflect', 'journal', 'growth', 'challenge'],
    suggestions: [
      "What progress did you make toward your goals? What habits are you building?",
      "What did you learn about yourself today? How did you step outside your comfort zone?",
      "What are you most grateful for? What would you like to improve tomorrow?",
      "How did this challenge help you grow? What insights did you gain?",
      "What patterns are you noticing in your personal development?"
    ]
  }
}

const GENERAL_SUGGESTIONS = [
  "What was the most challenging part of this? How did you overcome it?",
  "What surprised you during this experience? How do you feel about your progress?",
  "How does this connect to your bigger goals? What would you tell someone else trying this?",
  "What resources or tools were most helpful? What will you do differently next time?",
  "What are you most proud of today? What did this experience teach you?"
]

export function SmartDescriptionInput({ title, value, onChange, className = '' }: SmartDescriptionInputProps) {
  const { user } = useAuth()
  const [placeholder, setPlaceholder] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    generateSmartPlaceholder()
  }, [title, user])

  const generateSmartPlaceholder = async () => {
    if (!title.trim()) {
      setPlaceholder('Tell us more about your progress, challenges overcome, lessons learned...')
      return
    }

    setIsGenerating(true)
    
    try {
      // 1. Try pattern-based suggestions first
      const patternSuggestion = getPatternBasedSuggestion(title)
      
      if (patternSuggestion) {
        setPlaceholder(patternSuggestion)
      } else {
        // 2. Fallback to community-based or general
        const communitySuggestion = await getCommunityBasedSuggestion(title)
        setPlaceholder(communitySuggestion || getRandomGeneralSuggestion())
      }
      
    } catch (error) {
      console.error('Error generating placeholder:', error)
      setPlaceholder(getRandomGeneralSuggestion())
    } finally {
      setIsGenerating(false)
    }
  }

  const getPatternBasedSuggestion = (title: string): string => {
    const titleLower = title.toLowerCase()
    
    // Find the best matching pattern
    for (const [category, data] of Object.entries(SUGGESTION_PATTERNS)) {
      const matchScore = data.keywords.reduce((score, keyword) => {
        return titleLower.includes(keyword) ? score + 1 : score
      }, 0)
      
      if (matchScore > 0) {
        // Return a random suggestion from the matching category
        const randomIndex = Math.floor(Math.random() * data.suggestions.length)
        return data.suggestions[randomIndex]
      }
    }
    
    return ''
  }

  const getCommunityBasedSuggestion = async (title: string): Promise<string> => {
    if (!user) return ''

    try {
      // Extract key words from title
      const titleWords = title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 2) // Use top 2 words

      if (titleWords.length === 0) return ''

      // Search for similar progress entries
      const { data, error } = await supabase
        .from('daily_progress')
        .select('description')
        .eq('visibility', 'public')
        .neq('user_id', user.id)
        .not('description', 'eq', '')
        .limit(10)

      if (error) throw error

      // Find entries with similar content and extract patterns
      const relevantDescriptions = data?.filter(entry => {
        const description = entry.description.toLowerCase()
        return titleWords.some(word => description.includes(word))
      }) || []

      if (relevantDescriptions.length > 0) {
        // Create a contextual suggestion based on community patterns
        const hasLearning = relevantDescriptions.some(d => d.description.toLowerCase().includes('learn'))
        const hasChallenges = relevantDescriptions.some(d => d.description.toLowerCase().includes('challeng'))
        const hasFeeling = relevantDescriptions.some(d => d.description.toLowerCase().includes('feel'))
        
        if (hasLearning && hasChallenges) {
          return "What did you learn from this experience? What challenges did you face and how did you overcome them?"
        } else if (hasFeeling) {
          return "How did this experience make you feel? What was the most rewarding part?"
        } else if (hasChallenges) {
          return "What challenges did you encounter? How did you work through them?"
        } else if (hasLearning) {
          return "What did you learn or discover? How will you apply this knowledge?"
        }
      }

      return ''
    } catch (error) {
      console.error('Error fetching community suggestions:', error)
      return ''
    }
  }

  const getRandomGeneralSuggestion = (): string => {
    const randomIndex = Math.floor(Math.random() * GENERAL_SUGGESTIONS.length)
    return GENERAL_SUGGESTIONS[randomIndex]
  }

  return (
    <div className="relative">
      <label htmlFor="description" className="block text-sm font-medium mb-1">
        Description
        {isGenerating && (
          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
            ✨ Generating smart suggestions...
          </span>
        )}
      </label>
      <textarea
        id="description"
        name="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field min-h-[120px] resize-y ${className}`}
        placeholder={placeholder}
      />
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        💡 Smart suggestions appear based on your title - just start typing to replace them
      </div>
    </div>
  )
}
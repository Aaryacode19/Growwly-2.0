import { useState, useEffect } from 'react'
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react'

interface WritingPromptsProps {
  onPromptSelect: (prompt: string) => void
}

const WRITING_PROMPTS = [
  // Daily Reflection Prompts
  "What was the biggest challenge I overcame today?",
  "What new skill did I practice or learn today?",
  "How did I step out of my comfort zone today?",
  "What am I most grateful for about today's progress?",
  "What would I do differently if I could repeat today?",
  
  // Achievement Prompts
  "I'm proud of myself for...",
  "Today I made progress on...",
  "A small win that made me smile today was...",
  "I surprised myself by...",
  "The effort I put into... really paid off because...",
  
  // Learning & Growth Prompts
  "Something new I discovered about myself today:",
  "A mistake I made that taught me...",
  "How I applied feedback or advice today:",
  "A habit I'm building showed up when...",
  "I felt most focused and productive when...",
  
  // Goal-Oriented Prompts
  "I moved closer to my goal by...",
  "Today's actions that align with my long-term vision:",
  "A breakthrough moment in my project was...",
  "I overcame procrastination by...",
  "The next logical step in my journey is...",
  
  // Wellness & Balance Prompts
  "How I took care of my mental health today:",
  "A moment of joy or peace I experienced:",
  "How I maintained work-life balance today:",
  "I felt energized when...",
  "A healthy choice I made today was...",
  
  // Creative & Innovation Prompts
  "A creative solution I found to a problem:",
  "An idea that excited me today:",
  "How I approached something differently:",
  "A connection I made between two concepts:",
  "I felt inspired when...",
]

const CATEGORIES = [
  { name: 'All', icon: '✨' },
  { name: 'Reflection', icon: '🤔' },
  { name: 'Achievement', icon: '🏆' },
  { name: 'Learning', icon: '📚' },
  { name: 'Goals', icon: '🎯' },
  { name: 'Wellness', icon: '🌱' },
  { name: 'Creative', icon: '💡' },
]

export function WritingPrompts({ onPromptSelect }: WritingPromptsProps) {
  const [currentPrompts, setCurrentPrompts] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    generatePrompts()
  }, [selectedCategory])

  const generatePrompts = () => {
    setIsRefreshing(true)
    
    let filteredPrompts = WRITING_PROMPTS
    
    if (selectedCategory !== 'All') {
      const categoryIndex = CATEGORIES.findIndex(cat => cat.name === selectedCategory)
      const promptsPerCategory = Math.ceil(WRITING_PROMPTS.length / (CATEGORIES.length - 1))
      const startIndex = (categoryIndex - 1) * promptsPerCategory
      const endIndex = startIndex + promptsPerCategory
      filteredPrompts = WRITING_PROMPTS.slice(startIndex, endIndex)
    }
    
    // Shuffle and pick 3 random prompts
    const shuffled = [...filteredPrompts].sort(() => Math.random() - 0.5)
    setCurrentPrompts(shuffled.slice(0, 3))
    
    setTimeout(() => setIsRefreshing(false), 300)
  }

  const handlePromptClick = (prompt: string) => {
    onPromptSelect(prompt)
  }

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Writing Prompts</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400">Get inspired to write</p>
          </div>
        </div>
        
        <button
          onClick={generatePrompts}
          disabled={isRefreshing}
          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
          title="Get new prompts"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1 mb-4">
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'
            }`}
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Prompts */}
      <div className="space-y-3">
        {currentPrompts.map((prompt, index) => (
          <button
            key={`${selectedCategory}-${index}`}
            onClick={() => handlePromptClick(prompt)}
            className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-[1.02] group"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {prompt}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-blue-600 dark:text-blue-400 text-center">
        💡 Click any prompt to use it as your heading or inspiration
      </div>
    </div>
  )
}
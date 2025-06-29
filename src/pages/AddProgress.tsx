import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { ImageUpload } from '../components/ImageUpload'
import { VisibilitySelector } from '../components/VisibilitySelector'
import { WritingPrompts } from '../components/WritingPrompts'
import { AutoCompleteInput } from '../components/AutoCompleteInput'
import { ProgressChart } from '../components/ProgressChart'
import { SmartDescriptionInput } from '../components/SmartDescriptionInput'
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AddProgress() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [headingSuggestions, setHeadingSuggestions] = useState<string[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heading: '',
    description: '',
    videoUrl: '',
    imageUrl: '',
    visibility: 'private' as 'private' | 'public',
  })

  useEffect(() => {
    if (user) {
      fetchHeadingSuggestions()
    }
  }, [user])

  const fetchHeadingSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_progress')
        .select('heading')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Extract unique headings and sort by frequency
      const headings = data?.map(d => d.heading) || []
      const headingCounts: { [key: string]: number } = {}
      
      headings.forEach(heading => {
        headingCounts[heading] = (headingCounts[heading] || 0) + 1
      })

      const sortedHeadings = Object.entries(headingCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([heading]) => heading)
        .slice(0, 10)

      setHeadingSuggestions(sortedHeadings)
    } catch (error) {
      console.error('Error fetching heading suggestions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    
    try {
      // Insert new progress entry (multiple entries per day allowed)
      const { error } = await supabase.from('daily_progress').insert({
        user_id: user.id,
        date: formData.date,
        heading: formData.heading,
        description: formData.description || '',
        video_url: formData.videoUrl || '',
        image_url: formData.imageUrl || '',
        visibility: formData.visibility,
      })

      if (error) throw error
      navigate('/')
    } catch (error) {
      setError('Failed to save progress. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleHeadingChange = (value: string) => {
    setFormData({
      ...formData,
      heading: value,
    })
  }

  const handleDescriptionChange = (value: string) => {
    setFormData({
      ...formData,
      description: value,
    })
  }

  const handleImageUploaded = (url: string) => {
    setFormData({
      ...formData,
      imageUrl: url,
    })
  }

  const handleImageRemoved = () => {
    setFormData({
      ...formData,
      imageUrl: '',
    })
  }

  const handleVisibilityChange = (visibility: 'private' | 'public') => {
    setFormData({
      ...formData,
      visibility,
    })
  }

  const handlePromptSelect = (prompt: string) => {
    // If heading is empty, use the prompt as heading
    if (!formData.heading.trim()) {
      setFormData({
        ...formData,
        heading: prompt,
      })
    } else {
      // If heading exists, add prompt to description
      const newDescription = formData.description 
        ? `${formData.description}\n\n${prompt}` 
        : prompt
      setFormData({
        ...formData,
        description: newDescription,
      })
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 hover:underline mb-4 text-sm sm:text-base">
          <ArrowLeft size={16} />
          Back to Community
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Add Daily Progress</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Document your achievements and milestones. Smart suggestions will appear as you type!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Form */}
        <div className="order-2 lg:order-1">
          <form onSubmit={handleSubmit} className="card max-w-none">
            <div className="space-y-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-1">
                  Date
                </label>
                <div className="relative">
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input-field pl-10"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
                </div>
              </div>

              <AutoCompleteInput
                value={formData.heading}
                onChange={handleHeadingChange}
                placeholder="What did you accomplish today?"
                suggestions={headingSuggestions}
                label="Heading"
                required
              />

              <SmartDescriptionInput
                title={formData.heading}
                value={formData.description}
                onChange={handleDescriptionChange}
              />

              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">
                  Any URL (optional)
                </label>
                <input
                  id="videoUrl"
                  name="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://youtube.com/watch?v=... or any link"
                />
              </div>

              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImage={formData.imageUrl}
                onImageRemoved={handleImageRemoved}
              />

              <VisibilitySelector
                visibility={formData.visibility}
                onChange={handleVisibilityChange}
                disabled={loading}
              />

              {error && (
                <div className="text-red-600 text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {loading ? 'Saving...' : 'Save Progress'}
                </button>
                <Link to="/" className="btn-secondary flex-1 sm:flex-none text-center">
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Right Side - Smart Features */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Writing Prompts */}
          <WritingPrompts onPromptSelect={handlePromptSelect} />
          
          {/* Progress Chart */}
          <ProgressChart />
        </div>
      </div>
    </Layout>
  )
}
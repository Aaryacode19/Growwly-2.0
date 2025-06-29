import { useState, useEffect } from 'react'
import { X, Calendar, Award, Link as LinkIcon, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AchievementModalProps {
  isOpen: boolean
  onClose: () => void
  onAchievementAdded: () => void
}

interface CustomAchievement {
  id?: string
  title: string
  description: string
  date_earned: string
  certificate_id?: string
  external_link?: string
  category: string
  issuer: string
  skills: string[]
}

const ACHIEVEMENT_CATEGORIES = [
  'Education',
  'Certification',
  'Competition',
  'Project',
  'Skill',
  'Award',
  'Course',
  'Workshop',
  'Conference',
  'Other'
]

export function AchievementModal({ isOpen, onClose, onAchievementAdded }: AchievementModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CustomAchievement>({
    title: '',
    description: '',
    date_earned: new Date().toISOString().split('T')[0],
    certificate_id: '',
    external_link: '',
    category: 'Certification',
    issuer: '',
    skills: []
  })
  const [skillInput, setSkillInput] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        date_earned: new Date().toISOString().split('T')[0],
        certificate_id: '',
        external_link: '',
        category: 'Certification',
        issuer: '',
        skills: []
      })
      setError('')
      setSkillInput('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Create a custom achievement entry
      const { error } = await supabase
        .from('user_custom_achievements')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          date_earned: formData.date_earned,
          certificate_id: formData.certificate_id || null,
          external_link: formData.external_link || null,
          category: formData.category,
          issuer: formData.issuer,
          skills: formData.skills,
          is_featured: false
        })

      if (error) throw error

      onAchievementAdded()
    } catch (error: any) {
      setError(error.message || 'Failed to add achievement')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div className="bg-white dark:bg-black border border-black dark:border-white w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="p-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Add Achievement</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Document your accomplishments, certifications, and milestones
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Achievement Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    {ACHIEVEMENT_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="issuer" className="block text-sm font-medium mb-1">
                    Issuer/Organization *
                  </label>
                  <input
                    id="issuer"
                    name="issuer"
                    type="text"
                    value={formData.issuer}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Amazon Web Services"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="date_earned" className="block text-sm font-medium mb-1">
                    Date Earned *
                  </label>
                  <input
                    id="date_earned"
                    name="date_earned"
                    type="date"
                    value={formData.date_earned}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field min-h-[100px] resize-y"
                  placeholder="Describe what you achieved, learned, or accomplished..."
                  required
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.description.length}/500 characters
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Verification Details
              </h3>

              {/* Certificate ID */}
              <div>
                <label htmlFor="certificate_id" className="block text-sm font-medium mb-1">
                  Certificate ID/Number
                </label>
                <input
                  id="certificate_id"
                  name="certificate_id"
                  type="text"
                  value={formData.certificate_id}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., AWS-SAA-123456789"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the official certificate ID or verification number
                </div>
              </div>

              {/* External Link */}
              <div>
                <label htmlFor="external_link" className="block text-sm font-medium mb-1">
                  Verification Link
                </label>
                <input
                  id="external_link"
                  name="external_link"
                  type="url"
                  value={formData.external_link}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://verify.example.com/certificate/123"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Link to verify this achievement online
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Skills & Technologies
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Related Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="input-field flex-1"
                    placeholder="e.g., React, AWS, Python"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="btn-secondary px-4"
                  >
                    Add
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Achievement'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { X, User, MapPin, Globe, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onProfileUpdated: (profile: Profile) => void
}

export function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
    profile_visibility: profile.profile_visibility || 'public',
    show_join_date: profile.show_join_date ?? true,
  })

  // Capture scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      setScrollPosition(window.scrollY)
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        profile_visibility: profile.profile_visibility || 'public',
        show_join_date: profile.show_join_date ?? true,
      })
    }
  }, [isOpen, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim() || null,
          bio: formData.bio.trim() || null,
          location: formData.location.trim() || null,
          website: formData.website.trim() || null,
          profile_visibility: formData.profile_visibility,
          show_join_date: formData.show_join_date,
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (error) throw error

      onProfileUpdated(data)
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setError('')
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
        <div className="card w-full max-w-2xl relative my-8 mx-auto">
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Edit Profile</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Update your profile information and privacy settings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Information
              </h3>
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="input-field min-h-[100px] resize-y"
                  placeholder="Tell others about yourself, your goals, or what motivates you..."
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/500 characters
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-1">
                    <MapPin size={14} className="inline mr-1" />
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="City, Country"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium mb-1">
                    <Globe size={14} className="inline mr-1" />
                    Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                Privacy Settings
              </h3>

              <div>
                <label htmlFor="profile_visibility" className="block text-sm font-medium mb-1">
                  Profile Visibility
                </label>
                <select
                  id="profile_visibility"
                  name="profile_visibility"
                  value={formData.profile_visibility}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="public">
                    🌍 Public - Anyone can view your profile
                  </option>
                  <option value="private">
                    🔒 Private - Only you can view your profile
                  </option>
                </select>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formData.profile_visibility === 'public' 
                    ? 'Your profile will be visible to all users and can be shared'
                    : 'Your profile will only be visible to you'
                  }
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="show_join_date"
                  name="show_join_date"
                  type="checkbox"
                  checked={formData.show_join_date}
                  onChange={handleChange}
                  className="w-4 h-4 text-black dark:text-white border-black dark:border-white rounded focus:ring-black dark:focus:ring-white"
                />
                <label htmlFor="show_join_date" className="text-sm">
                  Show join date on profile
                </label>
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
                className="btn-primary flex-1"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleClose}
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
import { useState, useEffect } from 'react'
import { X, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Capture scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      setScrollPosition(window.scrollY)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      setSuccess(true)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      // Close modal after success
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setError('')
      setSuccess(false)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
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
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Change Password</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Update your account password
            </p>
          </div>

          {success ? (
            <div className="text-center py-4">
              <div className="text-green-600 dark:text-green-400 mb-2">
                ✓ Password updated successfully!
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This window will close automatically...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  New Password *
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Updating...' : 'Update Password'}
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
          )}
        </div>
      </div>
    </div>
  )
}
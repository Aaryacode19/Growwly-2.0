import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    reason: '',
    additionalInfo: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Send password reset request via edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-request`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send password reset request')
      }

      setSubmitted(true)
    } catch (error: any) {
      setError(error.message || 'Failed to submit request')
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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-white dark:bg-black py-8 px-4">
        <div className="card w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Request Sent!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your password reset request has been sent. We'll review it and get back to you with instructions.
            </p>
          </div>
          <button onClick={onBack} className="btn-secondary w-full">
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-white dark:bg-black py-8 px-4">
      <div className="card w-full max-w-md">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 hover:underline mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill out this form to request a password reset
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your registered email"
              required
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">
              Reason for Password Reset *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-y"
              placeholder="Why do you need to reset your password? (e.g., forgot password, account compromised, etc.)"
              required
            />
          </div>

          <div>
            <label htmlFor="additionalInfo" className="block text-sm font-medium mb-1">
              Additional Information
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-y"
              placeholder="Any additional details that might help verify your identity (optional)"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Sending Request...' : 'Send Reset Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
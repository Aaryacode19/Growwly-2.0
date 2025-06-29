import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AccessRequestFormProps {
  onBack: () => void
}

export function AccessRequestForm({ onBack }: AccessRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    reason: '',
    company: '',
    portfolioUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Store in database
      const { error: dbError } = await supabase
        .from('access_requests')
        .insert({
          email: formData.email,
          full_name: formData.fullName,
          reason: formData.reason,
          company: formData.company || null,
          portfolio_url: formData.portfolioUrl || null,
        })

      if (dbError) {
        // Check for duplicate email constraint violation
        if (dbError.code === '23505') {
          setError('An access request for this email has already been submitted. We will get back to you soon.')
        } else {
          setError(dbError.message || 'Failed to submit request')
        }
        return
      }

      // Try to send email notification, but don't fail if it doesn't work
      try {
        const emailResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-access-request`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        )

        if (!emailResponse.ok) {
          // Email notification failed, but request was saved
        }
      } catch (emailError) {
        // Email notification failed
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Request Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Thank you for your interest. We'll review your request and get back to you soon.
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
          <h1 className="text-2xl font-semibold mb-2">Request Access</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us why you'd like to join Growwly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1">
              Company/Organization
            </label>
            <input
              id="company"
              name="company"
              type="text"
              value={formData.company}
              onChange={handleChange}
              className="input-field"
              placeholder="Optional"
            />
          </div>

          <div>
            <label htmlFor="portfolioUrl" className="block text-sm font-medium mb-1">
              Portfolio/Website
            </label>
            <input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              value={formData.portfolioUrl}
              onChange={handleChange}
              className="input-field"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">
              Why do you want access? *
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="input-field min-h-[120px] resize-y"
              placeholder="Tell us about your goals, projects, or how you plan to use Growwly..."
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm border border-red-600 p-2 bg-red-50 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
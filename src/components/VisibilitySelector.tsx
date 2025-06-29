import { Eye, EyeOff } from 'lucide-react'

interface VisibilitySelectorProps {
  visibility: 'private' | 'public'
  onChange: (visibility: 'private' | 'public') => void
  disabled?: boolean
}

export function VisibilitySelector({ visibility, onChange, disabled }: VisibilitySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">
        Visibility
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('private')}
          disabled={disabled}
          className={`flex-1 flex items-center gap-2 px-3 py-2 border transition-colors ${
            visibility === 'private'
              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
              : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <EyeOff size={16} />
          <span className="text-sm">Private</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('public')}
          disabled={disabled}
          className={`flex-1 flex items-center gap-2 px-3 py-2 border transition-colors ${
            visibility === 'public'
              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
              : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Eye size={16} />
          <span className="text-sm">Public</span>
        </button>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {visibility === 'private' 
          ? 'Only you can see this progress entry'
          : 'This will be visible to the community and others can like and comment'
        }
      </p>
    </div>
  )
}
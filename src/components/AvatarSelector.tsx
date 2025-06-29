import { useState } from 'react'
import { User, Check, X } from 'lucide-react'

interface AvatarSelectorProps {
  currentAvatar?: string | null
  onAvatarSelect: (avatarUrl: string) => void
  onClose: () => void
  disabled?: boolean
}

const FACE_AVATARS = [
  // Happy Faces
  {
    id: 'happy1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjZmZkYjRkIi8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTgwIDEzMFExMDAgMTUwIDEyMCAxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==',
    label: 'Happy Yellow'
  },
  {
    id: 'happy2',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjZmY2ZDZkIi8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTgwIDEzMFExMDAgMTUwIDEyMCAxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==',
    label: 'Happy Red'
  },
  {
    id: 'happy3',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjMzRkMzk5Ii8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTgwIDEzMFExMDAgMTUwIDEyMCAxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==',
    label: 'Happy Green'
  },
  {
    id: 'happy4',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjOGI1Y2Y2Ii8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTgwIDEzMFExMDAgMTUwIDEyMCAxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==',
    label: 'Happy Purple'
  },
  // Cool Faces
  {
    id: 'cool1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjZjU5ZTBiIi8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjEyMCIgcng9IjE1IiByeT0iOCIgZmlsbD0iIzMzMyIvPgo8L3N2Zz4K',
    label: 'Cool Orange'
  },
  {
    id: 'cool2',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjNjM2NmYxIi8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjEyMCIgcng9IjE1IiByeT0iOCIgZmlsbD0iIzMzMyIvPgo8L3N2Zz4K',
    label: 'Cool Blue'
  },
  // Star Eyes
  {
    id: 'star1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjZmZkYjRkIi8+CjxwYXRoIGQ9Ik03NSA3NUw4NSA4NUw3NSA5NUw2NSA4NUw3NSA3NVoiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTEyNSA3NUwxMzUgODVMMTI1IDk1TDExNSA4NUwxMjUgNzVaIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik04MCAxMzBRMTAwIDE1MCAxMjAgMTMwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=',
    label: 'Star Eyes Yellow'
  },
  {
    id: 'star2',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjOGI1Y2Y2Ii8+CjxwYXRoIGQ9Ik03NSA3NUw4NSA4NUw3NSA5NUw2NSA4NUw3NSA3NVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTM1IDg1TDEyNSA5NUwxMTUgODVMMTI1IDc1WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTgwIDEzMFExMDAgMTUwIDEyMCAxMzAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=',
    label: 'Star Eyes Purple'
  },
  // Neutral/Thinking Faces
  {
    id: 'neutral1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjMzRkMzk5Ii8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPHJlY3QgeD0iODUiIHk9IjExNSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMiLz4KPC9zdmc+Cg==',
    label: 'Neutral Teal'
  },
  {
    id: 'thinking1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjZWY0NDQ0Ii8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTIwIiByPSI0IiBmaWxsPSIjMzMzIi8+CjxjaXJjbGUgY3g9IjEwNSIgY3k9IjEzMCIgcj0iMiIgZmlsbD0iIzMzMyIvPgo8L3N2Zz4K',
    label: 'Thinking Red'
  },
  // Winking Faces
  {
    id: 'wink1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiByeD0iMTAwIiBmaWxsPSIjZmZkYjRkIi8+CjxwYXRoIGQ9Ik03MCA4MEw5MCA4MEw4MCA5MEw3MCA4MFoiIGZpbGw9IiMzMzMiLz4KPGNpcmNsZSBjeD0iMTIwIiBjeT0iODAiIHI9IjgiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTgwIDEzMFExMDAgMTUwIDEyMCAxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==',
    label: 'Winking Yellow'
  }
]

export function AvatarSelector({ currentAvatar, onAvatarSelect, onClose, disabled }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '')

  const handleAvatarClick = (avatarUrl: string) => {
    if (disabled) return
    setSelectedAvatar(avatarUrl)
    onAvatarSelect(avatarUrl)
    // Close modal after selection
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleRemoveAvatar = () => {
    if (disabled) return
    setSelectedAvatar('')
    onAvatarSelect('')
    setTimeout(() => {
      onClose()
    }, 300)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-black border border-black dark:border-white p-6 w-full max-w-md mx-auto relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          disabled={disabled}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Choose Your Avatar</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Select a fun face to represent your profile
          </p>
        </div>

        {/* Current Avatar Display */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {selectedAvatar ? (
              <img
                src={selectedAvatar}
                alt="Selected avatar"
                className="w-16 h-16 object-cover"
              />
            ) : (
              <User size={24} className="text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">
              {selectedAvatar ? 'Current Selection' : 'No Avatar'}
            </div>
            {selectedAvatar && (
              <button
                onClick={handleRemoveAvatar}
                disabled={disabled}
                className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 mt-1"
              >
                Remove Avatar
              </button>
            )}
          </div>
        </div>

        {/* Face Avatars Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span>😊</span>
            <span>Choose a Face</span>
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {FACE_AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarClick(avatar.url)}
                disabled={disabled}
                className={`
                  relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all duration-200
                  ${selectedAvatar === avatar.url 
                    ? 'border-black dark:border-white ring-2 ring-black dark:ring-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                `}
                title={avatar.label}
              >
                <img
                  src={avatar.url}
                  alt={avatar.label}
                  className="w-full h-full object-cover"
                />
                {selectedAvatar === avatar.url && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Check size={10} className="text-black" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Click any face to select it. You can change it anytime by clicking on your profile picture.
        </div>
      </div>
    </div>
  )
}
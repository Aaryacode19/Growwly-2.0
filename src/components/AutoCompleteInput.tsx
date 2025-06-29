import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Clock, TrendingUp } from 'lucide-react'

interface AutoCompleteInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  suggestions: string[]
  className?: string
  label?: string
  required?: boolean
}

export function AutoCompleteInput({
  value,
  onChange,
  placeholder,
  suggestions,
  className = '',
  label,
  required = false
}: AutoCompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        suggestion.toLowerCase() !== value.toLowerCase()
      )
      setFilteredSuggestions(filtered.slice(0, 5)) // Limit to 5 suggestions
      setIsOpen(filtered.length > 0)
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5)) // Show recent suggestions when empty
      setIsOpen(false)
    }
    setHighlightedIndex(-1)
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
        setIsOpen(true)
        setHighlightedIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        e.preventDefault()
        break
      case 'ArrowUp':
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        e.preventDefault()
        break
      case 'Enter':
        if (highlightedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex])
          e.preventDefault()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0 || value.length === 0) {
      setIsOpen(true)
    }
  }

  const getSuggestionIcon = (suggestion: string) => {
    // Check if this is a recent/frequent suggestion
    if (suggestions.indexOf(suggestion) < 3) {
      return <Clock className="w-3 h-3 text-gray-400" />
    }
    return <TrendingUp className="w-3 h-3 text-gray-400" />
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`input-field pr-8 ${className}`}
          required={required}
        />
        
        {(filteredSuggestions.length > 0 || value.length === 0) && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isOpen && (filteredSuggestions.length > 0 || value.length === 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {value.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Recent suggestions
            </div>
          )}
          
          {(value.length === 0 ? suggestions.slice(0, 5) : filteredSuggestions).map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                index === highlightedIndex ? 'bg-gray-50 dark:bg-gray-800' : ''
              }`}
            >
              {getSuggestionIcon(suggestion)}
              <span className="flex-1 truncate">{suggestion}</span>
            </button>
          ))}
          
          {filteredSuggestions.length === 0 && value.length > 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Clock, Coffee, Target, Music, Volume2, VolumeX, SkipForward, Loader } from 'lucide-react'
import { Layout } from '../components/Layout'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

interface MusicTrack {
  id: string
  title: string
  artist: string
  description: string
  url: string
  duration: number
  genre: string
  created_at: string
}

const TIMER_DURATIONS = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
}

const TIMER_LABELS = {
  work: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

const TIMER_COLORS = {
  work: 'text-red-600 dark:text-red-400',
  shortBreak: 'text-green-600 dark:text-green-400',
  longBreak: 'text-blue-600 dark:text-blue-400',
}

// Enhanced background colors with better visibility in light theme
const TIMER_BACKGROUNDS = {
  work: 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700',
  shortBreak: 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
  longBreak: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
}

export function Pomodoro() {
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.work)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  
  // Music player state
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [musicError, setMusicError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch music tracks from API
  useEffect(() => {
    fetchMusicTracks()
  }, [])

  const fetchMusicTracks = async () => {
    setLoadingTracks(true)
    setMusicError('')
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-api?genre=lofi&limit=4`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setMusicTracks(data.data)
        setCurrentTrackIndex(0)
      } else {
        throw new Error(data.error || 'Failed to fetch music tracks')
      }
    } catch (error) {
      setMusicError('Failed to load music tracks. Using fallback audio.')
      
      // Fallback to generated audio
      setMusicTracks([
        {
          id: 'generated-1',
          title: 'Generated Lofi Beat',
          artist: 'AI Music',
          description: 'Procedurally generated lofi music',
          url: '',
          duration: 180,
          genre: 'lofi',
          created_at: new Date().toISOString()
        }
      ])
    } finally {
      setLoadingTracks(false)
    }
  }

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Audio setup and management
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.addEventListener('timeupdate', updateCurrentTime)
      audioRef.current.addEventListener('ended', handleTrackEnd)
      audioRef.current.addEventListener('error', handleAudioError)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateCurrentTime)
        audioRef.current.removeEventListener('ended', handleTrackEnd)
        audioRef.current.removeEventListener('error', handleAudioError)
      }
    }
  }, [currentTrackIndex, musicTracks])

  // Create audio notification
  useEffect(() => {
    const createBeepSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      } catch (error) {
        // Silent error handling for production
      }
    }

    notificationAudioRef.current = { play: createBeepSound } as any
  }, [])

  const updateCurrentTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleTrackEnd = () => {
    nextTrack()
  }

  const handleAudioError = () => {
    setMusicError('Error playing audio track')
    setIsPlaying(false)
  }

  const playGeneratedMusic = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const playChordProgression = () => {
        const chords = [
          [261.63, 329.63, 392.00, 493.88], // Cmaj7
          [220.00, 261.63, 329.63, 415.30], // Am7
          [174.61, 220.00, 261.63, 349.23], // Fmaj7
          [196.00, 246.94, 293.66, 369.99], // G7
        ]

        let time = audioContext.currentTime
        const chordDuration = 3

        chords.forEach((chord) => {
          chord.forEach((freq, noteIndex) => {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            const filterNode = audioContext.createBiquadFilter()
            
            filterNode.type = 'lowpass'
            filterNode.frequency.value = 800 + Math.sin(time) * 200
            
            oscillator.connect(filterNode)
            filterNode.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.value = freq
            oscillator.type = 'sine'
            
            const noteVolume = volume * 0.08 * (1 - noteIndex * 0.1)
            gainNode.gain.setValueAtTime(0, time)
            gainNode.gain.linearRampToValueAtTime(noteVolume, time + 0.2)
            gainNode.gain.linearRampToValueAtTime(noteVolume * 0.7, time + chordDuration - 0.5)
            gainNode.gain.linearRampToValueAtTime(0, time + chordDuration)
            
            oscillator.start(time)
            oscillator.stop(time + chordDuration)
          })
          
          time += chordDuration
        })
      }

      playChordProgression()
      setIsPlaying(true)
    } catch (error) {
      setIsPlaying(false)
    }
  }

  const toggleMusic = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        const currentTrack = musicTracks[currentTrackIndex]
        
        if (currentTrack && currentTrack.url && currentTrack.id !== 'generated-1') {
          // Play real audio file
          audioRef.current.src = currentTrack.url
          await audioRef.current.play()
          setIsPlaying(true)
          setMusicError('')
        } else {
          // Play generated music as fallback
          playGeneratedMusic()
        }
      }
    } catch (error) {
      setMusicError('Failed to play audio. Trying generated music...')
      
      // Fallback to generated music
      if (!isPlaying) {
        playGeneratedMusic()
      }
    }
  }

  const nextTrack = () => {
    if (musicTracks.length === 0) return
    
    const nextIndex = (currentTrackIndex + 1) % musicTracks.length
    setCurrentTrackIndex(nextIndex)
    setCurrentTime(0)
    
    if (isPlaying && audioRef.current) {
      const nextTrack = musicTracks[nextIndex]
      if (nextTrack && nextTrack.url && nextTrack.id !== 'generated-1') {
        audioRef.current.src = nextTrack.url
        audioRef.current.play().catch(() => {
          playGeneratedMusic()
        })
      } else {
        playGeneratedMusic()
      }
    }
  }

  const previousTrack = () => {
    if (musicTracks.length === 0) return
    
    const prevIndex = currentTrackIndex === 0 ? musicTracks.length - 1 : currentTrackIndex - 1
    setCurrentTrackIndex(prevIndex)
    setCurrentTime(0)
    
    if (isPlaying && audioRef.current) {
      const prevTrack = musicTracks[prevIndex]
      if (prevTrack && prevTrack.url && prevTrack.id !== 'generated-1') {
        audioRef.current.src = prevTrack.url
        audioRef.current.play().catch(() => {
          playGeneratedMusic()
        })
      } else {
        playGeneratedMusic()
      }
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleTimerComplete = () => {
    setIsRunning(false)
    
    // Play notification sound
    try {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.play()
      }
    } catch (error) {
      // Silent error handling for production
    }

    // Show browser notification
    const messages = {
      work: 'Great work! Time for a break 🎉',
      shortBreak: 'Break time is over. Ready to focus? 💪',
      longBreak: 'Long break finished. Let\'s get back to work! 🚀'
    }
    
    try {
      if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: messages[mode],
          icon: '/vite.svg'
        })
      }
    } catch (error) {
      // Silent error handling for production
    }

    // Auto-switch to next mode
    if (mode === 'work') {
      setCompletedSessions(prev => prev + 1)
      const nextMode = (completedSessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak'
      setMode(nextMode)
      setTimeLeft(TIMER_DURATIONS[nextMode])
    } else {
      setMode('work')
      setTimeLeft(TIMER_DURATIONS.work)
    }
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(TIMER_DURATIONS[mode])
  }

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(TIMER_DURATIONS[newMode])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const total = TIMER_DURATIONS[mode]
    return ((total - timeLeft) / total) * 100
  }

  const getMusicProgress = () => {
    const currentTrack = musicTracks[currentTrackIndex]
    if (!currentTrack || currentTrack.id === 'generated-1') return 0
    return (currentTime / currentTrack.duration) * 100
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const currentTrack = musicTracks[currentTrackIndex]

  // Enhanced Session Counter Component
  const SessionCounter = () => {
    const totalSessions = Math.max(8, completedSessions + 4) // Show at least 8 dots
    const completedCycles = Math.floor(completedSessions / 4)
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
              Focus Sessions
            </h3>
          </div>
          
          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {completedSessions}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {completedCycles}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Full Cycles
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.floor(completedSessions * 25)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Minutes
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Session Dots */}
        <div className="space-y-3 sm:space-y-4">
          <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            Today's Progress
          </div>
          
          {/* Session Dots Grid - Responsive */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: totalSessions }, (_, i) => {
              const isCompleted = i < completedSessions
              const cyclePosition = i % 4
              const isLongBreak = cyclePosition === 3
              
              return (
                <div
                  key={i}
                  className={`
                    relative aspect-square rounded-full transition-all duration-500 transform hover:scale-110
                    ${isCompleted 
                      ? isLongBreak 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
                        : 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                    ${isCompleted ? 'animate-pulse' : ''}
                  `}
                  title={`Session ${i + 1} ${isCompleted ? '(Completed)' : '(Pending)'} ${isLongBreak ? '- Long Break' : ''}`}
                >
                  {/* Inner glow effect for completed sessions */}
                  {isCompleted && (
                    <div className="absolute inset-1 rounded-full bg-white/20 animate-pulse" />
                  )}
                  
                  {/* Session number */}
                  <div className={`
                    absolute inset-0 flex items-center justify-center text-xs font-bold
                    ${isCompleted ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce" />
                    ) : (
                      <span className="text-xs">{i + 1}</span>
                    )}
                  </div>
                  
                  {/* Special indicator for long break sessions */}
                  {isLongBreak && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800">
                      <div className="w-full h-full bg-yellow-400 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress to next cycle</span>
              <span>{completedSessions % 4}/4</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${((completedSessions % 4) / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Motivational Message */}
          <div className="text-center mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg">
            <div className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300">
              {completedSessions === 0 && "🚀 Ready to start your first session?"}
              {completedSessions > 0 && completedSessions < 4 && "💪 Keep going! You're building momentum!"}
              {completedSessions >= 4 && completedSessions < 8 && "🔥 Amazing focus! You're on fire!"}
              {completedSessions >= 8 && "🏆 Incredible dedication! You're a productivity champion!"}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 flex items-center justify-center gap-2 sm:gap-3">
            🍅 Pomodoro Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Stay focused and productive with timed work sessions
          </p>
        </div>

        {/* Lofi Music Player - Full Width Above */}
        <div className="card bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            {/* Music Info */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                {loadingTracks ? (
                  <Loader size={16} className="sm:w-5 sm:h-5 text-white animate-spin" />
                ) : (
                  <Music size={16} className="sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-purple-900 dark:text-purple-200">
                  🎵 Lofi Music Player
                </h3>
                {loadingTracks ? (
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">
                    Loading music tracks...
                  </p>
                ) : currentTrack ? (
                  <>
                    <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400 truncate">
                      {currentTrack.title} - {currentTrack.artist}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                      {currentTrack.description}
                    </p>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">
                    No tracks available
                  </p>
                )}
                
                {musicError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {musicError}
                  </p>
                )}
              </div>
            </div>

            {/* Music Controls - Mobile Responsive */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={previousTrack}
                disabled={loadingTracks || musicTracks.length <= 1}
                className="p-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors disabled:opacity-50"
                title="Previous track"
              >
                <SkipForward size={14} className="sm:w-4 sm:h-4 text-purple-700 dark:text-purple-400 rotate-180" />
              </button>
              
              <button
                onClick={toggleMusic}
                disabled={loadingTracks}
                className={`p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg disabled:opacity-50 ${
                  isPlaying 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-400'
                }`}
              >
                {isPlaying ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
              </button>
              
              <button
                onClick={nextTrack}
                disabled={loadingTracks || musicTracks.length <= 1}
                className="p-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors disabled:opacity-50"
                title="Next track"
              >
                <SkipForward size={14} className="sm:w-4 sm:h-4 text-purple-700 dark:text-purple-400" />
              </button>

              {/* Volume Control - Hidden on small mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <VolumeX size={12} className="sm:w-3.5 sm:h-3.5 text-purple-700 dark:text-purple-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-12 sm:w-16 accent-purple-600"
                />
                <Volume2 size={12} className="sm:w-3.5 sm:h-3.5 text-purple-700 dark:text-purple-400" />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchMusicTracks}
                disabled={loadingTracks}
                className="p-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors disabled:opacity-50"
                title="Refresh tracks"
              >
                <Loader size={14} className={`sm:w-4 sm:h-4 text-purple-700 dark:text-purple-400 ${loadingTracks ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Music Progress */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
              <div className="text-purple-700 dark:text-purple-400 truncate">
                Track {currentTrackIndex + 1} of {musicTracks.length}
                {currentTrack?.id === 'generated-1' && ' (Generated)'}
              </div>
              <div className="text-purple-700 dark:text-purple-400 flex-shrink-0">
                {isPlaying ? '🎵 Playing' : '⏸️ Paused'}
              </div>
            </div>
            
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 bg-purple-600 dark:bg-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${getMusicProgress()}%` }}
              />
            </div>
            
            {currentTrack && currentTrack.id !== 'generated-1' && (
              <div className="flex justify-between text-xs text-purple-700 dark:text-purple-400 mt-1">
                <span>{formatTime(Math.floor(currentTime))}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            )}
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            preload="metadata"
            crossOrigin="anonymous"
          />
        </div>

        {/* Main Content - Timer Left, Instructions Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Side - Pomodoro Timer */}
          <div className={`card transition-all duration-300 ${TIMER_BACKGROUNDS[mode]}`}>
            {/* Mode Selector - FIXED FOR MOBILE */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                onClick={() => switchMode('work')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border transition-all duration-300 ${
                  mode === 'work'
                    ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Target size={12} className="sm:w-4 sm:h-4" />
                    <span className="font-semibold">Work</span>
                  </div>
                  <div className="text-xs opacity-75">25 min</div>
                </div>
              </button>
              <button
                onClick={() => switchMode('shortBreak')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border transition-all duration-300 ${
                  mode === 'shortBreak'
                    ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Coffee size={12} className="sm:w-4 sm:h-4" />
                    <span className="font-semibold">Break</span>
                  </div>
                  <div className="text-xs opacity-75">5 min</div>
                </div>
              </button>
              <button
                onClick={() => switchMode('longBreak')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border transition-all duration-300 ${
                  mode === 'longBreak'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Clock size={12} className="sm:w-4 sm:h-4" />
                    <span className="font-semibold">Long</span>
                  </div>
                  <div className="text-xs opacity-75">15 min</div>
                </div>
              </button>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className={`text-4xl sm:text-5xl lg:text-6xl font-mono font-bold mb-3 sm:mb-4 ${TIMER_COLORS[mode]} transition-all duration-300`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                {TIMER_LABELS[mode]}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 mb-4 sm:mb-6 overflow-hidden">
                <div 
                  className={`h-2 sm:h-3 rounded-full transition-all duration-1000 ${
                    mode === 'work' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    mode === 'shortBreak' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>

              {/* Timer Controls - FIXED FOR MOBILE */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-4 sm:mb-6">
                <button
                  onClick={toggleTimer}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg ${
                    mode === 'work' ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' :
                    mode === 'shortBreak' ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                    'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {isRunning ? <Pause size={16} className="sm:w-5 sm:h-5" /> : <Play size={16} className="sm:w-5 sm:h-5" />}
                  <span className="text-sm sm:text-base">{isRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={resetTimer}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-md flex items-center justify-center"
                  title="Reset Timer"
                >
                  <RotateCcw size={16} className="sm:w-5 sm:h-5" />
                  <span className="ml-2 text-sm sm:hidden">Reset</span>
                </button>
              </div>

              {/* Enhanced Session Counter */}
              <SessionCounter />
            </div>
          </div>

          {/* Right Side - Instructions */}
          <div className="card bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-300 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl">💡</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-200">
                  Productivity Tips
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Master the Pomodoro Technique
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <strong>Focus Sessions:</strong> Work on one task for 25 minutes without any distractions. Turn off notifications and stay committed.
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <strong>Short Breaks:</strong> Take a 5-minute break to rest your mind. Step away from your screen, stretch, or grab some water.
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <strong>Long Breaks:</strong> After 4 work sessions, take a 15-30 minute break. This helps prevent mental fatigue.
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <strong>Music:</strong> Use the lofi music player above to maintain focus. The API provides curated tracks perfect for concentration.
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <strong>Consistency:</strong> Use this technique daily. Track your completed sessions to build a productive habit.
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <strong>Task Planning:</strong> Before starting, decide what specific task you'll work on during each 25-minute session.
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-300 dark:border-blue-700">
              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  🎯 Today's Focus Session
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs">
                  <div>
                    <div className="font-bold text-blue-600 dark:text-blue-400">{completedSessions}</div>
                    <div className="text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600 dark:text-green-400">{Math.floor(completedSessions * 25)}</div>
                    <div className="text-gray-600 dark:text-gray-400">Minutes</div>
                  </div>
                  <div>
                    <div className="font-bold text-purple-600 dark:text-purple-400">{Math.floor(completedSessions / 4)}</div>
                    <div className="text-gray-600 dark:text-gray-400">Cycles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}